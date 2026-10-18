import { NextFunction, Request, Response } from 'express';
import { config } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Order } from '../orders/order.model';
import { DeliveryPartner } from '../delivery/delivery-partner.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { User, IUser } from '../auth/auth.model';
import { toGeoJSON } from '../../utils/geo';
import { Delivery } from '../delivery/delivery.model';
import { emitDeliveryAssigned } from '../delivery/delivery.events';
import { getIO } from '../../socket';
import { transitionOrderStatus } from '../orders/order.service';
import {
  startDeliverySimulation,
  stopDeliverySimulation,
  clearPendingHandoff,
  computeInitialPartnerOrigin,
  calculateDistanceMeters,
} from '../delivery/delivery.simulator';

// Types
interface SeedCollectionPayload {
  modelName: string;
  documents?: any[];
  clearFirst?: boolean;
  deleteIds?: string[];
  deleteFilter?: Record<string, any>;
}

interface FactorySeedPayload {
  collections: SeedCollectionPayload[];
}

export function getConnectedDbInfo() {
  const dbName = mongoose.connection.db?.databaseName || mongoose.connection.name || '';
  const isDedicatedTestDb = /test|e2e/i.test(dbName);
  return { dbName, isDedicatedTestDb };
}

export async function getDbInfo(req: Request, res: Response) {
  if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
  }
  const { dbName, isDedicatedTestDb } = getConnectedDbInfo();
  res.json({
    success: true,
    data: {
      databaseName: dbName,
      isDedicatedTestDb,
      host: mongoose.connection.host,
      nodeEnv: config.nodeEnv,
      readyState: mongoose.connection.readyState
    }
  });
}

export async function seedFactoryData(req: Request, res: Response, next: NextFunction) {
  try {
    if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
    }

    const { collections, warnings: clientWarnings = [] } = req.body as {
      collections: SeedCollectionPayload[];
      warnings?: string[];
    };

    if (!collections || !Array.isArray(collections)) {
      return res.status(400).json({ success: false, message: 'Invalid payload. collections array required.' });
    }

    const { dbName, isDedicatedTestDb } = getConnectedDbInfo();

    // Explicit Safety Guard: destructive clearFirst must fail-closed unless active DB is demonstrably a test/e2e DB
    const hasClearFirst = collections.some(c => c.clearFirst === true);
    if (hasClearFirst) {
      const currentEnv = process.env.NODE_ENV || config.nodeEnv;
      const isExplicitlyAuthorized = (currentEnv === 'test' || process.env.ALLOW_DESTRUCTIVE_SEED === 'true' || req.headers['x-allow-destructive-seed'] === 'true');
      if (!isDedicatedTestDb || !isExplicitlyAuthorized) {
        console.warn(`[seed:guard:blocked] clearFirst rejected against database '${dbName}'. Dedicated test DB and explicit authorization required.`);
        return res.status(403).json({
          success: false,
          message: `Destructive clearFirst rejected: active database '${dbName}' is not a dedicated test/e2e database or destructive operation is unauthorized. Operation aborted to protect application data.`,
          data: { dbName, isDedicatedTestDb, isExplicitlyAuthorized }
        });
      }
    }

    const seedStart = Date.now();
    const results: Record<string, any> = {};
    const errors: string[] = [];

    for (const collection of collections) {
      const { modelName, documents = [], clearFirst, deleteIds, deleteFilter } = collection;
      const Model = mongoose.models[modelName];

      if (!Model) {
        errors.push(`${modelName}: Unknown model`);
        continue;
      }

      const colStart = Date.now();

      if (clearFirst) {
        await Model.deleteMany({});
      } else if (deleteIds && Array.isArray(deleteIds) && deleteIds.length > 0) {
        await Model.deleteMany({ _id: { $in: deleteIds } });
      } else if (deleteFilter && typeof deleteFilter === 'object' && Object.keys(deleteFilter).length > 0) {
        await Model.deleteMany(deleteFilter);
      }

      let inserted = 0;
      let failed = 0;
      let skipped = 0;
      let modelErrors: any[] = [];


      let documentsToInsert = documents;
      if (modelName === 'User' && documentsToInsert.length > 0) {
        // Only hash passwords for fixed development users
        documentsToInsert = await Promise.all(documents.map(async (doc: any) => {
          if (doc.__isFixed && doc.password === 'devdev') {
            doc.password = await bcrypt.hash('devdev', 12);
          }
          return doc;
        }));
      }

      if (documentsToInsert.length > 0) {

        try {
          await Model.insertMany(documentsToInsert, { ordered: false, rawResult: true });
          inserted = documentsToInsert.length;
        } catch (insertErr: any) {
          if (insertErr.name === 'MongoBulkWriteError' || insertErr.code === 11000 || insertErr.writeErrors) {
            inserted = insertErr.insertedCount ?? 0;
            const writeErrors = insertErr.writeErrors || [];
            
            // Distinguish skipped vs failed
            const genuineErrors = [];
            for (const we of writeErrors) {
              const doc = documentsToInsert[we.index];
              const errCode = we.code || we.err?.code; if (errCode === 11000 && doc && doc.__isFixed) {
                // Fixed account already exists -> intentionally skipped
                // But we must ensure its password is reset to devdev
                if (modelName === 'User' && doc.password) {
                  await Model.updateOne({ _id: doc._id }, { $set: { password: doc.password } });
                }
                skipped++;
              } else {
                genuineErrors.push(we);
              }
            }
            
            failed = documentsToInsert.length - inserted - skipped;
            
            if (genuineErrors.length > 0) {
              modelErrors = genuineErrors.map((we: any) => ({
                index: we.index,
                code: we.code || we.err?.code,
                message: (we.errmsg || we.err?.errmsg)?.substring(0, 200)
              })).slice(0, 10);
            }
          } else {
            failed = documentsToInsert.length;
            modelErrors.push({ message: insertErr.message?.substring(0, 200) });
          }
          
          if (failed > 0) {
            const summaryMsg = `[${modelName}] Inserted ${inserted}, Skipped ${skipped}, Failed ${failed}`;
            errors.push(summaryMsg);
            console.error(`[seed:${modelName}:error]`, summaryMsg, modelErrors);
          }
        }
      }

      const colDuration = Date.now() - colStart;
      results[modelName] = {
        requested: documents.length,
        inserted,
        skipped,
        failed,
        errors: modelErrors
      };
      console.log(`[seed:${modelName}:complete]`, { requested: documents.length, inserted, skipped, failed, durationMs: colDuration });
    }

    const totalDuration = Date.now() - seedStart;
    const seededCollections = Object.entries(results)
      .map(([model, data]) => `${model}: ${data.inserted}/${data.requested}`)
      .join(', ');

    const finalWarnings = [...clientWarnings, ...errors];

    console.log('[seed:complete]', { results, durationMs: totalDuration, errors: finalWarnings });

    sendSuccess({
      res,
      statusCode: 201,
      message: finalWarnings.length === 0
        ? `Seed completed. (${seededCollections})`
        : `Seed completed with warnings. (${seededCollections})`,
      data: {
        seeded: results,
        durationMs: totalDuration,
        warnings: finalWarnings.length > 0 ? finalWarnings : undefined,
      },
    });
  } catch (error) {
    console.error('[seed:error]', error);
    next(error);
  }
}

export async function assignPartner(req: Request, res: Response) {
  if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
  }

  const { orderId, partnerUserId } = req.body as {
    orderId?: string;
    partnerUserId?: string;
  };

  if (!orderId || !partnerUserId) {
    return res.status(400).json({ success: false, message: 'orderId and partnerUserId are required' });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const partner = await DeliveryPartner.findOne({ userId: partnerUserId });
  if (!partner) return res.status(404).json({ success: false, message: 'Partner not found for userId' });

  const restaurant = await Restaurant.findById(order.restaurantId);
  if (!restaurant || !restaurant.location) {
    return res.status(400).json({ success: false, message: 'Restaurant location missing' });
  }

  const pickupLocation = toGeoJSON(restaurant.location);

  // DEMO destination: fixed offset since Order has no coordinates.
  // Real geocoding is a separate concern.
  const destinationLocation = toGeoJSON({
    lat: restaurant.location.lat + 0.015,
    lng: restaurant.location.lng + 0.015,
  });

  const currentLocation = partner.currentLocation ?? pickupLocation;

  const delivery = await Delivery.create({
    orderId: order._id,
    partnerId: partner._id,
    status: 'partner_assigned',
    pickupLocation,
    destinationLocation,
    currentLocation,
    timestamps: { assignedAt: new Date() },
  });

  partner.status = 'on_delivery';
  partner.currentAssignedDelivery = delivery._id as any;
  await partner.save();

  emitDeliveryAssigned({
    deliveryId: delivery._id.toString(),
    orderId: order._id.toString(),
    partnerId: partner._id.toString(),
    partnerUserId: partner.userId!.toString(),
    status: 'partner_assigned',
    partnerName: partner.name,
    partnerPhone: partner.phone,
  });

  res.json({ success: true, data: delivery });
}

// ============================================================================
// ONE-CLICK LIVE-ORDER DEMO CONTROLLERS & FIXTURE ISOLATION
// ============================================================================

export const DEMO_FIXTURE_IDS = {
  OWNER_USER: '64e8e50f3c5f4a1b8c1a9902',
  RESTAURANT: '64e8e50f3c5f4a1b8c1a9905',
  CUSTOMER_USER: '64e8e50f3c5f4a1b8c1a9901',
  PARTNER_USER: '64e8e50f3c5f4a1b8c1a9903',
  DELIVERY_PARTNER: '64e8e50f3c5f4a1b8c1a9907',
  ADMIN_USER: '64e8e50f3c5f4a1b8c1a9904',
};

export const DEMO_FIXTURE_EMAILS = {
  OWNER: 'demo-owner@foodhub.test',
  CUSTOMER: 'demo-customer@foodhub.test',
  PARTNER: 'demo-partner@foodhub.test',
  ADMIN: 'demo-admin@foodhub.test',
};

// In-memory sliding rate limiter for public demo launch protection
const demoRateLimitWindowMs = 60 * 1000; // 1 minute window
const maxDemoLaunchesPerWindow = 10;
const demoLaunchTimestampsByIp = new Map<string, number[]>();

export function checkDemoRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (demoLaunchTimestampsByIp.get(ip) || []).filter(
    (ts) => now - ts < demoRateLimitWindowMs
  );
  if (timestamps.length >= maxDemoLaunchesPerWindow) {
    demoLaunchTimestampsByIp.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  demoLaunchTimestampsByIp.set(ip, timestamps);
  return true;
}

export function resetDemoRateLimitsForTest() {
  demoLaunchTimestampsByIp.clear();
}

let isLaunchingDemo = false;

/**
 * Resolves or safely creates dedicated demo participants.
 * Invariant: Never mutates, hijacks, reassigns, or resets ordinary application records.
 */
export async function resolveDedicatedDemoParticipants() {
  // 1. Dedicated Demo Owner User
  let ownerUser = (await User.findById(DEMO_FIXTURE_IDS.OWNER_USER).select('+password')) as IUser | null;
  if (!ownerUser) {
    ownerUser = (await User.findOne({ email: DEMO_FIXTURE_EMAILS.OWNER }).select('+password')) as IUser | null;
  }

  if (ownerUser) {
    // Safety check: Ensure this is not an ordinary user
    if (!ownerUser.isDemo && ownerUser.email !== DEMO_FIXTURE_EMAILS.OWNER) {
      throw new AppError(
        'Conflict detected: An ordinary non-demo user exists with the demo owner identity. Demo launch aborted to protect application participants.',
        409
      );
    }
    if (!ownerUser.isDemo) {
      ownerUser.isDemo = true;
      await ownerUser.save();
    }
    if (!(await ownerUser.comparePassword('devdev'))) {
      ownerUser.password = 'devdev';
      await ownerUser.save();
    }
  } else {
    ownerUser = await User.create({
      _id: new mongoose.Types.ObjectId(DEMO_FIXTURE_IDS.OWNER_USER),
      name: 'Showcase Kitchen Manager',
      email: DEMO_FIXTURE_EMAILS.OWNER,
      password: 'devdev',
      roles: ['owner'],
      phone: '9888888881',
      address: '100 Indiranagar 100ft Road, Bangalore',
      isDemo: true,
    });
  }

  // 2. Dedicated Demo Restaurant
  let restaurant = await Restaurant.findById(DEMO_FIXTURE_IDS.RESTAURANT);
  if (!restaurant) {
    restaurant = await Restaurant.findOne({ isDemo: true, ownerId: ownerUser._id });
  }

  if (restaurant) {
    // Safety check: Never reassign an ordinary restaurant
    if (!restaurant.isDemo && restaurant.name !== 'Showcase Spice Kitchen') {
      throw new AppError(
        'Conflict detected: An ordinary restaurant exists with the demo ID. Demo launch aborted to protect application participants.',
        409
      );
    }
    if (restaurant.ownerId && restaurant.ownerId.toString() !== ownerUser._id.toString()) {
      const currentOwner = await User.findById(restaurant.ownerId);
      if (currentOwner && !currentOwner.isDemo && currentOwner.email !== DEMO_FIXTURE_EMAILS.OWNER) {
        throw new AppError(
          'Conflict detected: Restaurant is owned by an ordinary user. Reassignment aborted to protect application participants.',
          409
        );
      }
    }
    if (!restaurant.isDemo || restaurant.ownerId?.toString() !== ownerUser._id.toString()) {
      restaurant.isDemo = true;
      restaurant.ownerId = ownerUser._id;
      await restaurant.save();
    }
  } else {
    restaurant = await Restaurant.create({
      _id: new mongoose.Types.ObjectId(DEMO_FIXTURE_IDS.RESTAURANT),
      name: 'Showcase Spice Kitchen',
      ownerId: ownerUser._id,
      description: 'Dedicated live order showcase restaurant specializing in authentic culinary excellence',
      cuisine: ['North Indian', 'Biryani'],
      address: '100 Indiranagar 100ft Road, Bangalore',
      city: 'Bangalore',
      rating: 4.8,
      totalRatings: 128,
      priceRange: 2,
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      isOpen: true,
      deliveryTime: 20,
      minOrder: 150,
      phone: '+91 98765 43210',
      location: { lat: 12.9716, lng: 77.5946 },
      isDemo: true,
      menu: [
        {
          name: 'Demo Butter Chicken Bowl',
          description: 'Tender chicken simmered in rich creamy tomato butter gravy with spiced basmati rice',
          price: 280,
          category: 'Main Course',
          isAvailable: true,
        },
      ],
    });
  }

  // 3. Dedicated Demo Customer User
  let customerUser = (await User.findById(DEMO_FIXTURE_IDS.CUSTOMER_USER).select('+password')) as IUser | null;
  if (!customerUser) {
    customerUser = (await User.findOne({ email: DEMO_FIXTURE_EMAILS.CUSTOMER }).select('+password')) as IUser | null;
  }

  if (customerUser) {
    if (!customerUser.isDemo && customerUser.email !== DEMO_FIXTURE_EMAILS.CUSTOMER) {
      throw new AppError(
        'Conflict detected: An ordinary non-demo user exists with the demo customer identity. Demo launch aborted to protect application participants.',
        409
      );
    }
    if (!customerUser.isDemo) {
      customerUser.isDemo = true;
      await customerUser.save();
    }
    if (!(await customerUser.comparePassword('devdev'))) {
      customerUser.password = 'devdev';
      await customerUser.save();
    }
  } else {
    customerUser = await User.create({
      _id: new mongoose.Types.ObjectId(DEMO_FIXTURE_IDS.CUSTOMER_USER),
      name: 'Showcase Customer',
      email: DEMO_FIXTURE_EMAILS.CUSTOMER,
      password: 'devdev',
      roles: ['user'],
      phone: '9888888882',
      address: 'Flat 402, Showcase Heights, Bangalore',
      isDemo: true,
    });
  }

  // 4. Dedicated Demo Partner User & DeliveryPartner
  let partnerUser = (await User.findById(DEMO_FIXTURE_IDS.PARTNER_USER).select('+password')) as IUser | null;
  if (!partnerUser) {
    partnerUser = (await User.findOne({ email: DEMO_FIXTURE_EMAILS.PARTNER }).select('+password')) as IUser | null;
  }

  if (partnerUser) {
    if (!partnerUser.isDemo && partnerUser.email !== DEMO_FIXTURE_EMAILS.PARTNER) {
      throw new AppError(
        'Conflict detected: An ordinary non-demo user exists with the demo partner identity. Demo launch aborted to protect application participants.',
        409
      );
    }
    if (!partnerUser.isDemo) {
      partnerUser.isDemo = true;
      await partnerUser.save();
    }
    if (!(await partnerUser.comparePassword('devdev'))) {
      partnerUser.password = 'devdev';
      await partnerUser.save();
    }
  } else {
    partnerUser = await User.create({
      _id: new mongoose.Types.ObjectId(DEMO_FIXTURE_IDS.PARTNER_USER),
      name: 'Ramesh Rider',
      email: DEMO_FIXTURE_EMAILS.PARTNER,
      password: 'devdev',
      roles: ['partner'],
      phone: '9888888883',
      address: 'Fleet Hub 1, Bangalore',
      isDemo: true,
    });
  }

  let partner = await DeliveryPartner.findById(DEMO_FIXTURE_IDS.DELIVERY_PARTNER);
  if (!partner) {
    partner = await DeliveryPartner.findOne({ isDemo: true, userId: partnerUser._id });
  }

  if (partner) {
    if (!partner.isDemo && partner._id.toString() !== DEMO_FIXTURE_IDS.DELIVERY_PARTNER) {
      throw new AppError(
        'Conflict detected: An ordinary non-demo partner exists with the demo partner identity. Demo launch aborted to protect application participants.',
        409
      );
    }
    partner.isDemo = true;
    partner.status = 'available';
    partner.currentAssignedDelivery = undefined;
    await partner.save();
  } else {
    partner = await DeliveryPartner.create({
      _id: new mongoose.Types.ObjectId(DEMO_FIXTURE_IDS.DELIVERY_PARTNER),
      userId: partnerUser._id,
      name: partnerUser.name || 'Ramesh Rider',
      phone: partnerUser.phone || '9888888883',
      vehicle: 'KA-01-DEMO-99 (Bike)',
      rating: 4.9,
      status: 'available',
      isDemo: true,
    });
  }

  // 5. Dedicated Demo Admin User
  let adminUser = (await User.findById(DEMO_FIXTURE_IDS.ADMIN_USER).select('+password')) as IUser | null;
  if (!adminUser) {
    adminUser = (await User.findOne({ email: DEMO_FIXTURE_EMAILS.ADMIN }).select('+password')) as IUser | null;
  }

  if (adminUser) {
    if (!adminUser.isDemo && adminUser.email !== DEMO_FIXTURE_EMAILS.ADMIN) {
      throw new AppError(
        'Conflict detected: An ordinary non-demo user exists with the demo admin identity. Demo launch aborted to protect application participants.',
        409
      );
    }
    if (!adminUser.isDemo) {
      adminUser.isDemo = true;
      await adminUser.save();
    }
    if (!(await adminUser.comparePassword('devdev'))) {
      adminUser.password = 'devdev';
      await adminUser.save();
    }
  } else {
    adminUser = await User.create({
      _id: new mongoose.Types.ObjectId(DEMO_FIXTURE_IDS.ADMIN_USER),
      name: 'Showcase Platform Administrator',
      email: DEMO_FIXTURE_EMAILS.ADMIN,
      password: 'devdev',
      roles: ['admin', 'user'],
      phone: '9888888884',
      address: 'Platform Operations Center, Bangalore',
      isDemo: true,
    });
  }

  return { ownerUser, restaurant, customerUser, partnerUser, partner, adminUser };
}

export async function getActiveDemoOrder(req: Request, res: Response, next: NextFunction) {
  try {
    if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
    }

    // Explicitly query demo-owned order only
    const demoOrder = await Order.findOne({ isDemo: true })
      .sort({ createdAt: -1 })
      .populate('userId', 'name') // Never expose email, phone, passwords, or private customer records
      .populate('restaurantId', 'name address location');

    if (!demoOrder) {
      return res.json({ success: true, data: null });
    }

    // Explicitly query demo-owned delivery only
    const delivery = await Delivery.findOne({ orderId: demoOrder._id, isDemo: true })
      .populate('partnerId', 'name phone vehicle rating status');

    const isTerminal = ['delivered', 'cancelled', 'rejected'].includes(demoOrder.status);

    if (delivery && !isTerminal && ['partner_assigned', 'arrived_pickup', 'picked_up', 'out_for_delivery', 'nearby'].includes(delivery.status)) {
      startDeliverySimulation(delivery._id.toString()).catch((err) => {
        console.error('[dev] Failed to ensure simulation for active demo order:', err);
      });
    }

    return res.json({
      success: true,
      data: {
        order: demoOrder,
        delivery,
        isTerminal,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmDemoHandoff(req: Request, res: Response, next: NextFunction) {
  try {
    if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
    }

    const { orderId } = req.body as { orderId?: string };

    let order: any;

    if (orderId) {
      const targetOrder = await Order.findById(orderId);
      if (!targetOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Security requirement: Reject ordinary orders even if ID is supplied and status matches
      if (!targetOrder.isDemo) {
        return res.status(403).json({
          success: false,
          message: 'Operation rejected: Demo endpoints cannot modify ordinary non-demo orders.',
        });
      }
      order = targetOrder;
    } else {
      order = await Order.findOne({ isDemo: true, status: 'partner_assigned' }).sort({ createdAt: -1 });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Eligible demo order not found' });
    }

    if (!order.isDemo) {
      return res.status(403).json({
        success: false,
        message: 'Operation rejected: Demo endpoints cannot modify ordinary non-demo orders.',
      });
    }

    // Idempotency: If order or delivery has already been transitioned to picked_up or beyond
    if (order.status === 'picked_up' || ['out_for_delivery', 'nearby', 'delivered'].includes(order.status)) {
      const existingDelivery = await Delivery.findOne({ orderId: order._id, isDemo: true });
      if (existingDelivery) {
        clearPendingHandoff(existingDelivery._id.toString());
      }
      return res.json({
        success: true,
        message: 'Kitchen handoff already confirmed; courier is now en route to customer',
        data: {
          order,
          delivery: existingDelivery,
          alreadyHandedOff: true,
        },
      });
    }

    if (order.status !== 'partner_assigned') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm handoff: order status is currently '${order.status}' (expected 'partner_assigned')`,
        currentStatus: order.status,
      });
    }

    // Verify delivery belongs to demo
    const delivery = await Delivery.findOne({ orderId: order._id, isDemo: true });
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Associated demo delivery not found for this order',
      });
    }

    if (delivery.status === 'picked_up' || ['out_for_delivery', 'nearby', 'delivered'].includes(delivery.status)) {
      clearPendingHandoff(delivery._id.toString());
      return res.json({
        success: true,
        message: 'Kitchen handoff already confirmed; courier is now en route to customer',
        data: {
          order,
          delivery,
          alreadyHandedOff: true,
        },
      });
    }

    // Clear server-side pending handoff timer so redundant auto-handoff does not fire
    clearPendingHandoff(delivery._id.toString());

    // If delivery is still marked partner_assigned (e.g. direct test invocation before arrival),
    // align to arrived_pickup so order.service transitionOrderStatus finds and updates it
    if (delivery.status === 'partner_assigned') {
      delivery.status = 'arrived_pickup';
      await delivery.save();
    }

    // Server-authoritative transition to picked_up using canonical order service
    const updatedOrder = await transitionOrderStatus(order._id.toString(), 'picked_up', {
      id: 'system',
      role: 'system',
    });

    const updatedDelivery = await Delivery.findOne({ orderId: order._id, isDemo: true });

    return res.json({
      success: true,
      message: 'Kitchen handoff confirmed; courier is now en route to customer',
      data: {
        order: updatedOrder,
        delivery: updatedDelivery,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function launchLiveOrderDemo(req: Request, res: Response, next: NextFunction) {
  try {
    if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
    }

    // Rate Limiting Protection
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    if (!checkDemoRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        message: 'Too many demo launch requests. Please wait a moment before trying again.',
      });
    }

    // Concurrency guard: Mutex check
    if (isLaunchingDemo) {
      return res.status(409).json({
        success: false,
        message: 'A demo launch is already in progress. Please wait a moment.',
      });
    }

    // Idempotency check: Is there already an active demo running?
    const existingActiveOrder = await Order.findOne({
      isDemo: true,
      status: { $nin: ['delivered', 'cancelled', 'rejected'] },
    });

    if (existingActiveOrder) {
      const existingDelivery = await Delivery.findOne({ orderId: existingActiveOrder._id, isDemo: true });

      if (existingDelivery && ['partner_assigned', 'arrived_pickup', 'picked_up', 'out_for_delivery', 'nearby'].includes(existingDelivery.status)) {
        await startDeliverySimulation(existingDelivery._id.toString());
      }

      const restaurant = await Restaurant.findById(existingActiveOrder.restaurantId);
      const customerUser = await User.findById(existingActiveOrder.userId);
      const partner = existingDelivery?.partnerId ? await DeliveryPartner.findById(existingDelivery.partnerId) : null;

      return res.json({
        success: true,
        message: 'An active demo order is already running',
        data: {
          order: existingActiveOrder,
          delivery: existingDelivery,
          restaurant: restaurant ? {
            id: restaurant._id,
            name: restaurant.name,
            location: restaurant.location,
            address: restaurant.address,
          } : undefined,
          customer: customerUser ? {
            id: customerUser._id,
            name: customerUser.name,
            address: existingActiveOrder.deliveryAddress,
            destinationLocation: existingDelivery?.destinationLocation ? {
              lat: existingDelivery.destinationLocation.coordinates[1],
              lng: existingDelivery.destinationLocation.coordinates[0],
            } : undefined,
          } : undefined,
          partner: partner ? {
            id: partner._id,
            name: partner.name,
            phone: partner.phone,
            currentLocation: existingDelivery?.currentLocation ? {
              lat: existingDelivery.currentLocation.coordinates[1],
              lng: existingDelivery.currentLocation.coordinates[0],
            } : undefined,
          } : undefined,
          alreadyRunning: true,
        },
      });
    }

    isLaunchingDemo = true;

    try {
      // 1. Resolve strictly isolated dedicated demo participants
      const { ownerUser, restaurant, customerUser, partnerUser, partner } =
        await resolveDedicatedDemoParticipants();

      // Clean up simulators from past demo deliveries only
      const pastDemoDeliveries = await Delivery.find({ isDemo: true });
      for (const pd of pastDemoDeliveries) {
        stopDeliverySimulation(pd._id.toString());
      }

      // 2. Select Menu Item from Demo Restaurant
      const menuItem = restaurant.menu && restaurant.menu.length > 0
        ? restaurant.menu[0]
        : { name: 'Demo Butter Chicken Bowl', price: 280 };

      // 3. Create Demo Order in 'pending_owner'
      const demoOrder = new Order({
        userId: customerUser._id,
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        items: [
          {
            menuItemId: (menuItem as any)._id ? (menuItem as any)._id.toString() : 'demo-item-1',
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
          },
        ],
        totalAmount: menuItem.price,
        deliveryAddress: 'Flat 402, Showcase Heights, Bangalore',
        status: 'pending_owner',
        paymentMethod: 'card',
        paymentStatus: 'completed',
        isDemo: true,
        timestamps: {},
      });
      await demoOrder.save();

      // 4. Legitimate Lifecycle Progression:
      // pending_owner -> confirmed -> preparing -> ready_for_pickup (auto-advances to awaiting_partner)
      await transitionOrderStatus(demoOrder._id.toString(), 'confirmed', {
        id: ownerUser._id.toString(),
        role: 'owner',
      });
      await transitionOrderStatus(demoOrder._id.toString(), 'preparing', {
        id: ownerUser._id.toString(),
        role: 'owner',
      });
      await transitionOrderStatus(demoOrder._id.toString(), 'ready_for_pickup', {
        id: ownerUser._id.toString(),
        role: 'owner',
      });

      // 5. Canonical Partner Assignment:
      // awaiting_partner -> partner_assigned via canonical order.service
      const updatedOrder = await transitionOrderStatus(demoOrder._id.toString(), 'partner_assigned', {
        id: 'system',
        role: 'system',
      });

      // 6. Compute coordinates & initialize Delivery record
      const rLat = restaurant.location?.lat || 12.9716;
      const rLng = restaurant.location?.lng || 77.5946;
      const pickupCoords: [number, number] = [rLng, rLat];
      const destCoords: [number, number] = [rLng + 0.015, rLat + 0.015];
      const startCoords: [number, number] = computeInitialPartnerOrigin(pickupCoords, demoOrder._id.toString());

      const initialDistanceMeters = calculateDistanceMeters(startCoords, pickupCoords);
      const initialEtaSeconds = Math.max(1, Math.round(initialDistanceMeters / 6.9));

      const delivery = new Delivery({
        orderId: demoOrder._id,
        partnerId: partner._id,
        status: 'partner_assigned',
        pickupLocation: { type: 'Point', coordinates: pickupCoords },
        destinationLocation: { type: 'Point', coordinates: destCoords },
        currentLocation: { type: 'Point', coordinates: startCoords },
        distanceRemainingMeters: initialDistanceMeters,
        etaSeconds: initialEtaSeconds,
        isDemo: true,
        timestamps: { assignedAt: new Date() },
      });
      await delivery.save();

      partner.status = 'assigned';
      partner.currentAssignedDelivery = delivery._id as any;
      partner.currentLocation = { type: 'Point', coordinates: startCoords };
      await partner.save();

      // 7. Emit delivery assignment & location socket events
      const io = getIO();
      emitDeliveryAssigned({
        deliveryId: delivery._id.toString(),
        orderId: demoOrder._id.toString(),
        partnerId: partner._id.toString(),
        partnerUserId: partnerUser._id.toString(),
        customerUserId: customerUser._id.toString(),
        partnerName: partner.name || 'Partner',
        partnerPhone: partner.phone || '9999999999',
        status: 'partner_assigned',
      });

      const initialLocationPayload = {
        deliveryId: delivery._id.toString(),
        orderId: demoOrder._id.toString(),
        partnerId: partner._id.toString(),
        location: { lat: startCoords[1], lng: startCoords[0] },
        etaSeconds: initialEtaSeconds,
        distanceRemainingMeters: initialDistanceMeters,
        status: 'partner_assigned',
        timestamp: new Date().toISOString(),
      };
      io.to(demoOrder._id.toString()).emit('delivery:location', initialLocationPayload);
      io.to('admin_fleet').emit('delivery:location', initialLocationPayload);
      io.to(partnerUser._id.toString()).emit('delivery:location', initialLocationPayload);
      io.to(ownerUser._id.toString()).emit('delivery:location', initialLocationPayload);

      // 8. Start the real delivery simulator
      startDeliverySimulation(delivery._id.toString());

      return res.status(201).json({
        success: true,
        message: 'Live order demo launched successfully',
        data: {
          order: updatedOrder,
          delivery,
          restaurant: {
            id: restaurant._id,
            name: restaurant.name,
            location: restaurant.location,
            address: restaurant.address,
          },
          customer: {
            id: customerUser._id,
            name: customerUser.name,
            address: demoOrder.deliveryAddress,
            destinationLocation: { lat: destCoords[1], lng: destCoords[0] },
          },
          partner: {
            id: partner._id,
            name: partner.name,
            phone: partner.phone,
            currentLocation: { lat: startCoords[1], lng: startCoords[0] },
          },
        },
      });
    } finally {
      isLaunchingDemo = false;
    }
  } catch (err) {
    isLaunchingDemo = false;
    next(err);
  }
}
