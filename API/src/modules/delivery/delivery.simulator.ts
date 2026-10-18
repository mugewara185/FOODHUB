import { getDistance } from 'geolib';
import { Delivery, IDelivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { getIO } from '../../socket';
import { Types } from 'mongoose';
import { Order } from '../orders/order.model';
import { evaluateRisk } from './risk.engine';
import { config } from '../../config/env';

const activeSimulators = new Map<string, NodeJS.Timeout>();
const startingSimulators = new Set<string>();
const pendingHandoffTimers = new Map<string, NodeJS.Timeout>();

export interface SimulationRouteState {
  currentLeg: 'to_pickup' | 'to_destination';
  waypoints: [number, number][]; // [[lng, lat], ...]
  waypointIndex: number;
}

const activeRoutes = new Map<string, SimulationRouteState>();
const waypointsCache = new Map<string, [number, number][]>();

export function isSimulationActive(deliveryId: string): boolean {
  return activeSimulators.has(deliveryId);
}

export function getActiveSimulationsCount(): number {
  return activeSimulators.size;
}

export function isHandoffPending(deliveryId: string): boolean {
  return pendingHandoffTimers.has(deliveryId);
}

/**
 * Bounded waypoint fetcher for road routes (OSRM with 2.5s timeout and straight-line fallback).
 * In test environment, immediately returns fallback straight line to avoid stalling fake timers.
 */
export async function fetchRoadWaypoints(
  start: [number, number],
  end: [number, number],
  timeoutMs = 2500
): Promise<[number, number][]> {
  const fallback: [number, number][] = [start, end];
  if (
    process.env.NODE_ENV === 'test' ||
    !start || !end ||
    typeof start[0] !== 'number' || typeof start[1] !== 'number' ||
    typeof end[0] !== 'number' || typeof end[1] !== 'number'
  ) {
    return fallback;
  }

  const cacheKey = `${start[0].toFixed(4)},${start[1].toFixed(4)};${end[0].toFixed(4)},${end[1].toFixed(4)}`;
  if (waypointsCache.has(cacheKey)) {
    return waypointsCache.get(cacheKey)!;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return fallback;
    }

    const data: any = await res.json();
    if (data?.code === 'Ok' && Array.isArray(data?.routes?.[0]?.geometry?.coordinates) && data.routes[0].geometry.coordinates.length > 1) {
      const coords = data.routes[0].geometry.coordinates as [number, number][];
      waypointsCache.set(cacheKey, coords);
      return coords;
    }
    return fallback;
  } catch {
    clearTimeout(timer);
    return fallback;
  }
}

/**
 * Step courier along polyline waypoints by stepMeters.
 */
export function advanceAlongWaypoints(
  current: [number, number],
  waypoints: [number, number][],
  startIndex: number,
  stepMeters: number
): { nextCoord: [number, number]; nextIndex: number; distanceRemainingMeters: number } {
  if (!waypoints || waypoints.length <= 1) {
    return { nextCoord: current, nextIndex: 0, distanceRemainingMeters: 0 };
  }

  let remainingStep = stepMeters;
  let curCoord: [number, number] = [current[0], current[1]];
  let idx = Math.min(Math.max(0, startIndex), waypoints.length - 2);

  while (remainingStep > 0 && idx < waypoints.length - 1) {
    const targetPoint = waypoints[idx + 1];
    const segDist = getDistance(
      { latitude: curCoord[1], longitude: curCoord[0] },
      { latitude: targetPoint[1], longitude: targetPoint[0] }
    );

    if (segDist <= remainingStep) {
      remainingStep -= segDist;
      curCoord = [targetPoint[0], targetPoint[1]];
      idx++;
    } else {
      const fraction = remainingStep / segDist;
      const nextLng = curCoord[0] + (targetPoint[0] - curCoord[0]) * fraction;
      const nextLat = curCoord[1] + (targetPoint[1] - curCoord[1]) * fraction;
      curCoord = [nextLng, nextLat];
      remainingStep = 0;
      break;
    }
  }

  // Calculate distance remaining from curCoord to the end of waypoints
  let distanceRemaining = 0;
  if (idx < waypoints.length - 1) {
    distanceRemaining += getDistance(
      { latitude: curCoord[1], longitude: curCoord[0] },
      { latitude: waypoints[idx + 1][1], longitude: waypoints[idx + 1][0] }
    );
    for (let i = idx + 1; i < waypoints.length - 1; i++) {
      distanceRemaining += getDistance(
        { latitude: waypoints[i][1], longitude: waypoints[i][0] },
        { latitude: waypoints[i + 1][1], longitude: waypoints[i + 1][0] }
      );
    }
  }

  return { nextCoord: curCoord, nextIndex: idx, distanceRemainingMeters: distanceRemaining };
}

/**
 * Computes distance in meters between two [lng, lat] coordinates.
 */
export function calculateDistanceMeters(coord1: [number, number], coord2: [number, number]): number {
  if (
    !coord1 || !coord2 ||
    typeof coord1[0] !== 'number' || typeof coord1[1] !== 'number' ||
    typeof coord2[0] !== 'number' || typeof coord2[1] !== 'number'
  ) {
    return 0;
  }
  return getDistance(
    { latitude: coord1[1], longitude: coord1[0] },
    { latitude: coord2[1], longitude: coord2[0] }
  );
}

/**
 * Computes a deterministic, plausible starting coordinate near the restaurant pickup area
 * (~450m to ~750m away) so newly assigned partners never start at [0, 0] or at a stale
 * customer drop-off coordinate from a previous order, while varying across orders/partners.
 */
export function computeInitialPartnerOrigin(
  pickupCoords: [number, number],
  seedKey = 'default'
): [number, number] {
  const [rLng, rLat] = pickupCoords;
  let hash = 0;
  const str = String(seedKey || 'default');
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }

  // Choose from 8 distinct bearings (excluding 45 deg where customer +0.02,+0.02 sits)
  const bearingsDeg = [120, 150, 180, 210, 240, 270, 300, 330];
  const angleRad = (bearingsDeg[hash % bearingsDeg.length] * Math.PI) / 180;

  // Radius between 0.0042 and 0.0064 degrees (~470m to ~710m)
  const radiusDeg = 0.0042 + ((hash >>> 3) % 23) * 0.0001;

  const startLng = Number((rLng + Math.cos(angleRad) * radiusDeg).toFixed(6));
  const startLat = Number((rLat + Math.sin(angleRad) * radiusDeg).toFixed(6));
  return [startLng, startLat];
}

function scheduleDemoHandoffIfEligible(deliveryId: string, orderId: string) {
  if (pendingHandoffTimers.has(deliveryId)) return;

  Order.findById(orderId).then((orderDoc) => {
    if ((orderDoc as any)?.isDemo && !pendingHandoffTimers.has(deliveryId)) {
      const timer = setTimeout(async () => {
        try {
          const curDelivery = await Delivery.findById(deliveryId);
          if (curDelivery && curDelivery.status === 'arrived_pickup') {
            const { transitionOrderStatus } = await import('../orders/order.service');
            await transitionOrderStatus(orderId, 'picked_up', { id: 'system', role: 'system' });
          }
        } catch (e) {
          // Ignore if already handed off or cancelled
        } finally {
          pendingHandoffTimers.delete(deliveryId);
        }
      }, 3000);
      pendingHandoffTimers.set(deliveryId, timer);
    }
  }).catch(() => {});
}

export async function startDeliverySimulation(deliveryId: string): Promise<{ running: boolean; started: boolean; reason?: string }> {
  if (activeSimulators.has(deliveryId)) {
    return { running: true, started: false };
  }

  if (startingSimulators.has(deliveryId)) {
    return { running: true, started: false };
  }

  startingSimulators.add(deliveryId);

  try {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return { running: false, started: false, reason: 'delivery_not_found' };
    }

    if (delivery.status === 'delivered' || (delivery as any).status === 'cancelled') {
      return { running: false, started: false, reason: 'terminal_status' };
    }

    const eligibleStatuses = ['partner_assigned', 'arrived_pickup', 'picked_up', 'out_for_delivery', 'nearby'];
    if (!eligibleStatuses.includes(delivery.status)) {
      return { running: false, started: false, reason: `ineligible_status_${delivery.status}` };
    }

    if (!delivery.partnerId) {
      return { running: false, started: false, reason: 'missing_partner' };
    }

    const partner = await DeliveryPartner.findById(delivery.partnerId);
    if (!partner) {
      return { running: false, started: false, reason: 'partner_not_found' };
    }

    if (activeSimulators.has(deliveryId)) {
      return { running: true, started: false };
    }

    // If starting/resuming while already at arrived_pickup, ensure demo auto-handoff is scheduled
    if (delivery.status === 'arrived_pickup') {
      scheduleDemoHandoffIfEligible(deliveryId, delivery.orderId.toString());
    }

    const timer = setInterval(async () => {
      try {
        const curDelivery = await Delivery.findById(deliveryId);
        if (!curDelivery || curDelivery.status === 'delivered' || (curDelivery as any).status === 'cancelled') {
          stopDeliverySimulation(deliveryId);
          return;
        }

        if (!curDelivery.partnerId) return;
        const curPartner = await DeliveryPartner.findById(curDelivery.partnerId);
        if (!curPartner) return;

        const pickup = curDelivery.pickupLocation.coordinates as [number, number]; // [lng, lat]
        const dest = curDelivery.destinationLocation.coordinates as [number, number];
        let current = (curDelivery.currentLocation?.coordinates || curPartner.currentLocation?.coordinates) as [number, number];

        if (
          !current ||
          current.length !== 2 ||
          (current[0] === 0 && current[1] === 0)
        ) {
          current = computeInitialPartnerOrigin(pickup, curDelivery.orderId?.toString() || deliveryId);
        }

        const isPickedUp = ['picked_up', 'out_for_delivery', 'nearby'].includes(curDelivery.status);
        const target = isPickedUp ? dest : pickup;
        const targetLeg: 'to_pickup' | 'to_destination' = isPickedUp ? 'to_destination' : 'to_pickup';

        const directDistanceToTarget = getDistance(
          { latitude: current[1], longitude: current[0] },
          { latitude: target[1], longitude: target[0] }
        );

        const stepMeters = config.deliverySimulator.stepMeters;
        let nextLng = current[0];
        let nextLat = current[1];
        let newDistance = directDistanceToTarget;

        if (directDistanceToTarget < 10) {
          nextLng = target[0];
          nextLat = target[1];
          newDistance = 0;
        } else {
          let routeState = activeRoutes.get(deliveryId);
          if (!routeState || routeState.currentLeg !== targetLeg) {
            const legStart: [number, number] = current;
            const legEnd: [number, number] = target;
            const waypoints = await fetchRoadWaypoints(legStart, legEnd);
            routeState = {
              currentLeg: targetLeg,
              waypoints,
              waypointIndex: 0
            };
            activeRoutes.set(deliveryId, routeState);
          }

          if (routeState && routeState.waypoints && routeState.waypoints.length > 2) {
            const res = advanceAlongWaypoints(current, routeState.waypoints, routeState.waypointIndex, stepMeters);
            routeState.waypointIndex = res.nextIndex;
            nextLng = res.nextCoord[0];
            nextLat = res.nextCoord[1];
            newDistance = res.distanceRemainingMeters;
          } else {
            // Standard linear interpolation
            if (directDistanceToTarget > stepMeters) {
              const fraction = stepMeters / directDistanceToTarget;
              nextLng = current[0] + (target[0] - current[0]) * fraction;
              nextLat = current[1] + (target[1] - current[1]) * fraction;
              newDistance = directDistanceToTarget - stepMeters;
            } else {
              nextLng = target[0];
              nextLat = target[1];
              newDistance = 0;
            }
          }
        }

        // Update location
        curDelivery.currentLocation = { type: 'Point', coordinates: [nextLng, nextLat] };
        curPartner.currentLocation = { type: 'Point', coordinates: [nextLng, nextLat] };
        curDelivery.distanceRemainingMeters = Math.max(0, Math.round(newDistance));
        curDelivery.etaSeconds = newDistance < 10 ? 0 : Math.max(1, Math.round(newDistance / 6.9));

        // Status updates
        let statusChanged = false;
        const prevStatus = curDelivery.status;

        if (!isPickedUp && newDistance < 10) {
          curDelivery.distanceRemainingMeters = 0;
          curDelivery.etaSeconds = 0;
          if (curDelivery.status === 'partner_assigned') {
            curDelivery.status = 'arrived_pickup';
            statusChanged = true;
          }
        } else if (isPickedUp) {
          if (newDistance < 10) {
            const now = new Date();
            curDelivery.distanceRemainingMeters = 0;
            curDelivery.etaSeconds = 0;
            // Attempt atomic status transition on Delivery to prevent concurrent ticks from double-completing
            const updatedDelivery = await Delivery.findOneAndUpdate(
              { _id: curDelivery._id, status: { $in: ['picked_up', 'out_for_delivery', 'nearby'] } },
              { 
                $set: { 
                  status: 'delivered', 
                  'timestamps.deliveredAt': now,
                  'currentLocation.coordinates': [nextLng, nextLat],
                  distanceRemainingMeters: 0,
                  etaSeconds: 0
                } 
              },
              { new: true }
            );
            
            if (updatedDelivery) {
              curDelivery.status = 'delivered';
              curDelivery.timestamps = curDelivery.timestamps || {};
              curDelivery.timestamps.deliveredAt = now;

              // Use atomic update to prevent race conditions causing lost increments
              await DeliveryPartner.updateOne(
                { _id: curPartner._id },
                { 
                  $set: { status: 'available', currentAssignedDelivery: null },
                  $inc: { completedDeliveries: 1 }
                }
              );
              curPartner.status = 'available';
              curPartner.currentAssignedDelivery = undefined;
              statusChanged = true;
            } else {
              stopDeliverySimulation(deliveryId);
              return;
            }
            
            stopDeliverySimulation(deliveryId);
          } else if (newDistance < 500 && curDelivery.status !== 'nearby') {
            curDelivery.status = 'nearby';
            statusChanged = true;
          } else if (curDelivery.status === 'picked_up') {
            curDelivery.status = 'out_for_delivery';
            statusChanged = true;
          }
        }

        if (curDelivery.status !== 'delivered') {
          await curDelivery.save();
          await curPartner.save();
        }

        // Elapsed delivery transit calculation
        const pickedUpAt = curDelivery.timestamps?.pickedUpAt || curDelivery.timestamps?.assignedAt;
        const transitMinutes = (curDelivery.status === 'delivered' && pickedUpAt)
          ? Math.max(1, Math.round(((curDelivery.timestamps?.deliveredAt || new Date()).getTime() - new Date(pickedUpAt).getTime()) / 60000))
          : (curDelivery.status === 'delivered' ? Math.max(1, Math.round(((curDelivery.timestamps?.deliveredAt || new Date()).getTime() - new Date(curDelivery.createdAt).getTime()) / 60000)) : undefined);

        // Safe event emission
        try {
          const io = getIO();
          const payload = {
            deliveryId: curDelivery.id || curDelivery._id.toString(),
            orderId: curDelivery.orderId.toString(),
            partnerId: curDelivery.partnerId.toString(),
            location: { lat: nextLat, lng: nextLng },
            etaSeconds: curDelivery.etaSeconds,
            distanceRemainingMeters: curDelivery.distanceRemainingMeters,
            status: curDelivery.status,
            timestamp: new Date().toISOString(),
            deliveredAt: curDelivery.status === 'delivered' ? (curDelivery.timestamps?.deliveredAt || new Date()).toISOString() : undefined,
            pickedUpAt: curDelivery.timestamps?.pickedUpAt ? new Date(curDelivery.timestamps.pickedUpAt).toISOString() : undefined,
            actualTransitMinutes: transitMinutes,
            estimatedMinutes: 15
          };

          io.to(curDelivery.orderId.toString()).emit('delivery:location', payload);
          io.to('admin_fleet').emit('delivery:location', payload);
          if (curDelivery.partnerId && curPartner.userId) {
            io.to(curPartner.userId.toString()).emit('delivery:location', payload);
          }

          let ownerIdStr = '';
          try {
            const order = await Order.findById(curDelivery.orderId);
            if (order) {
              const { Restaurant } = require('../restaurants/restaurant.model');
              const restaurant = await Restaurant.findById(order.restaurantId);
              if (restaurant?.ownerId) {
                ownerIdStr = restaurant.ownerId.toString();
                io.to(ownerIdStr).emit('delivery:location', payload);
              }
            }
          } catch (e) {
            // Ignore
          }

          if (statusChanged) {
            io.to(curDelivery.orderId.toString()).emit('delivery:status', { ...payload, prevStatus });
            io.to('admin_fleet').emit('delivery:status', { ...payload, prevStatus });
            if (ownerIdStr) {
              io.to(ownerIdStr).emit('delivery:status', { ...payload, prevStatus });
            }
            if (curDelivery.partnerId && curPartner.userId) {
              io.to(curPartner.userId.toString()).emit('delivery:status', { ...payload, prevStatus });
            }
          }
        } catch (ioErr) {
          // Socket.IO may not be initialized in non-socket test contexts
        }

        if (statusChanged) {
          try {
            const { transitionOrderStatus } = await import('../orders/order.service');
            if (['picked_up', 'out_for_delivery', 'delivered'].includes(curDelivery.status)) {
              await transitionOrderStatus(curDelivery.orderId.toString(), curDelivery.status, { id: 'system', role: 'system' });
            }
          } catch (e) {
            console.error('[simulator] Failed to transition order status:', e);
          }
        }

        // Schedule demo auto-handoff if newly or currently at arrived_pickup
        if (curDelivery.status === 'arrived_pickup') {
          scheduleDemoHandoffIfEligible(deliveryId, curDelivery.orderId.toString());
        }

        // Trigger risk evaluation
        await evaluateRisk(curDelivery);

      } catch (err) {
        console.error('[simulator] Simulator error for delivery', deliveryId, err);
      }
    }, config.deliverySimulator.intervalMs);

    activeSimulators.set(deliveryId, timer);
    return { running: true, started: true };
  } finally {
    startingSimulators.delete(deliveryId);
  }
}

export function stopDeliverySimulation(deliveryId: string) {
  const timer = activeSimulators.get(deliveryId);
  if (timer) {
    clearInterval(timer);
    activeSimulators.delete(deliveryId);
  }
  const handoffTimer = pendingHandoffTimers.get(deliveryId);
  if (handoffTimer) {
    clearTimeout(handoffTimer);
    pendingHandoffTimers.delete(deliveryId);
  }
  activeRoutes.delete(deliveryId);
  startingSimulators.delete(deliveryId);
}

export function stopAllDeliverySimulations() {
  for (const deliveryId of Array.from(activeSimulators.keys())) {
    stopDeliverySimulation(deliveryId);
  }
  for (const deliveryId of Array.from(pendingHandoffTimers.keys())) {
    const ht = pendingHandoffTimers.get(deliveryId);
    if (ht) clearTimeout(ht);
    pendingHandoffTimers.delete(deliveryId);
  }
  activeSimulators.clear();
  activeRoutes.clear();
  startingSimulators.clear();
}

export async function recoverActiveDeliveries(): Promise<{ recovered: number; errors: number }> {
  let recovered = 0;
  let errors = 0;

  try {
    const eligibleStatuses = ['partner_assigned', 'arrived_pickup', 'picked_up', 'out_for_delivery', 'nearby'];
    const activeDeliveries = await Delivery.find({
      status: { $in: eligibleStatuses }
    });

    for (const delivery of activeDeliveries) {
      try {
        if (!activeSimulators.has(delivery._id.toString())) {
          const res = await startDeliverySimulation(delivery._id.toString());
          if (res.started) {
            recovered++;
          }
        }
      } catch (err) {
        errors++;
        console.error(`[simulator:recovery] Failed to recover delivery ${delivery._id}:`, err);
      }
    }

    if (recovered > 0 || errors > 0) {
      console.log(`[simulator:recovery] Active deliveries scan: ${recovered} recovered, ${errors} errors.`);
    }
  } catch (err) {
    console.error('[simulator:recovery] Failed to query active deliveries:', err);
  }

  return { recovered, errors };
}
