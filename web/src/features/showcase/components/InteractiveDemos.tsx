import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Stack,
  Chip,
  LinearProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Speed,
  PlayArrow,
  Pause,
  Replay,
  Layers,
  Terminal,
  CheckCircle,
  LocationOn,
  Restaurant,
  DeliveryDining,
  Person,
  SyncAlt,
  Tune,
  OpenInNew,
  HourglassEmpty,
  FlashOn,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import Map from '../../../shared/components/maps/Map';
import { logger } from '../../../core/dev/logger/Logger';
import type { LogEntry } from '../../../core/dev/logger/types';
import api from '../../../core/utils/api';
import { socketService } from '../../../services/socket';
import { fetchRoadRoute } from '../../../core/utils/location';

interface InteractiveDemosProps {
  launchTrigger?: number;
}

export const InteractiveDemos: React.FC<InteractiveDemosProps> = ({ launchTrigger }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  // -------------------------------------------------------------
  // DEMO 1: Genuine Server-Authoritative Live Order Demo State
  // -------------------------------------------------------------
  const stages = [
    { key: 'pending_owner', label: 'Order Placed', actor: 'Customer', desc: 'Order created in MongoDB with pending_owner status and broadcasted to kitchen room' },
    { key: 'confirmed', label: 'Accepted by Kitchen', actor: 'Merchant Owner', desc: 'Kitchen owner accepts order and sets preparation schedule via order service' },
    { key: 'preparing', label: 'Food Preparing', actor: 'Merchant Owner', desc: 'Kitchen marks order preparing; status change emitted over Socket.IO' },
    { key: 'awaiting_partner', label: 'Ready for Pickup', actor: 'System / Owner', desc: 'Food is boxed; order transitions to awaiting_partner; delivery:available emitted to fleet' },
    { key: 'partner_assigned', label: 'Courier Assigned', actor: 'Delivery Partner', desc: 'Courier accepts delivery; partner origin computed near restaurant; simulation starts' },
    { key: 'arrived_pickup', label: 'Arrived at Kitchen', actor: 'Delivery Partner', desc: 'Courier reaches restaurant; awaits kitchen handoff (manual click or 3s auto-handoff)' },
    { key: 'picked_up', label: 'Food Picked Up', actor: 'Delivery Partner', desc: 'Kitchen handoff confirmed; courier departs toward customer drop-off' },
    { key: 'out_for_delivery', label: 'Out for Delivery (GPS Active)', actor: 'System / Courier', desc: 'Road waypoints stepped every 500ms; live coordinates broadcast to customer & owner' },
    { key: 'delivered', label: 'Order Delivered', actor: 'Partner / System', desc: 'Courier arrives at destination (<10m); delivery & order atomically completed; partner released' },
  ];

  const getStageIndex = (status?: string): number => {
    switch (status) {
      case 'pending_owner': return 0;
      case 'confirmed': return 1;
      case 'preparing': return 2;
      case 'ready_for_pickup':
      case 'awaiting_partner': return 3;
      case 'partner_assigned': return 4;
      case 'arrived_pickup': return 5;
      case 'picked_up': return 6;
      case 'out_for_delivery':
      case 'nearby': return 7;
      case 'delivered':
      case 'completed':
      case 'reviewed': return 8;
      default: return 0;
    }
  };

  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<any | null>(null);
  const [restaurantInfo, setRestaurantInfo] = useState<any | null>(null);
  const [customerInfo, setCustomerInfo] = useState<any | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<any | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('idle');
  const [courierPosition, setCourierPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [travelledCoords, setTravelledCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [routeStatus, setRouteStatus] = useState<'road' | 'direct' | 'none'>('none');
  const [distanceRemainingMeters, setDistanceRemainingMeters] = useState<number | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [isHandoffPending, setIsHandoffPending] = useState<boolean>(false);
  const [isHandingOff, setIsHandingOff] = useState<boolean>(false);
  const [handoffCountdown, setHandoffCountdown] = useState<number | null>(null);
  const [isDelivered, setIsDelivered] = useState<boolean>(false);
  const [transitMinutes, setTransitMinutes] = useState<number | null>(null);
  const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [launchError, setLaunchError] = useState<string | null>(null);
  const lastHandledTrigger = useRef<number>(0);

  // Default coordinate anchors in Bangalore
  const restaurantCoords = restaurantInfo?.location || { lat: 12.9716, lng: 77.5946 };
  const customerCoords = customerInfo?.destinationLocation || {
    lat: restaurantCoords.lat + 0.015,
    lng: restaurantCoords.lng + 0.015,
  };
  const partnerCoords = courierPosition || partnerInfo?.currentLocation || {
    lat: restaurantCoords.lat - 0.005,
    lng: restaurantCoords.lng - 0.005,
  };

  // Authoritative demo state fetcher
  const fetchActiveOrderState = useCallback(() => {
    return api.request<any>('/dev/demo/active-order')
      .then((res) => {
        const payload = (res && 'data' in res && res.data) ? res.data : res;
        if (!payload?.order) return;
        const { order, delivery, isTerminal } = payload;
        setActiveOrder(order);
        setActiveDelivery(delivery);
        if (order.restaurantId) {
          setRestaurantInfo({
            id: order.restaurantId._id || order.restaurantId,
            name: order.restaurantId.name || order.restaurantName,
            location: order.restaurantId.location,
            address: order.restaurantId.address,
          });
        }
        if (order.userId) {
          setCustomerInfo({
            id: order.userId._id || order.userId,
            name: order.userId.name,
            address: order.deliveryAddress,
          });
        }
        if (delivery?.partnerId) {
          setPartnerInfo({
            id: delivery.partnerId._id || delivery.partnerId,
            name: delivery.partnerId.name,
            phone: delivery.partnerId.phone,
          });
        }
        setCurrentStatus((prev) => {
          const curIdx = getStageIndex(prev);
          const newIdx = getStageIndex(order.status);
          return newIdx >= curIdx ? order.status : prev;
        });
        if (delivery?.currentLocation?.coordinates) {
          setCourierPosition({
            lat: delivery.currentLocation.coordinates[1],
            lng: delivery.currentLocation.coordinates[0],
          });
        }
        if (typeof delivery?.distanceRemainingMeters === 'number') {
          setDistanceRemainingMeters(delivery.distanceRemainingMeters);
        }
        if (typeof delivery?.etaSeconds === 'number') {
          setEtaSeconds(delivery.etaSeconds);
        }
        if (isTerminal || order.status === 'delivered') {
          setIsDelivered(true);
        }
        if (delivery?.status === 'arrived_pickup') {
          setIsHandoffPending(true);
        } else if (['picked_up', 'out_for_delivery', 'delivered'].includes(delivery?.status)) {
          setIsHandoffPending(false);
        }
      })
      .catch(() => {
        // Dev endpoints unavailable in production
      });
  }, []);

  // Inspect existing active demo order on mount
  useEffect(() => {
    fetchActiveOrderState();
  }, [fetchActiveOrderState]);

  // Bounded fallback reconciliation poll while demo is active
  useEffect(() => {
    if (!activeOrder || isDelivered) return;
    const timer = setInterval(() => {
      fetchActiveOrderState();
    }, 5000);
    return () => clearInterval(timer);
  }, [activeOrder, isDelivered, fetchActiveOrderState]);

  // Socket connection and room subscription for active order
  useEffect(() => {
    socketService.connect(undefined, 'customer');
    const handleConn = (status: 'connected' | 'reconnecting' | 'disconnected') => {
      setSocketStatus(status);
      if (status === 'connected') {
        fetchActiveOrderState();
      }
    };
    socketService.onConnectionChange(handleConn);

    return () => {
      socketService.offConnectionChange(handleConn);
    };
  }, [fetchActiveOrderState]);

  // Order room subscription and delivery event listeners
  useEffect(() => {
    if (!activeOrder?._id) return;
    const orderId = activeOrder._id.toString();
    socketService.joinOrderRoom(orderId);

    const handleLocation = (payload: any) => {
      if (payload.orderId === orderId || payload.deliveryId === activeDelivery?._id) {
        const loc = payload.location?.coordinates && Array.isArray(payload.location.coordinates)
          ? { lat: payload.location.coordinates[1], lng: payload.location.coordinates[0] }
          : payload.location;
        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          setCourierPosition({ lat: loc.lat, lng: loc.lng });
          setTravelledCoords((prev) => {
            if (prev.length > 0) {
              const last = prev[prev.length - 1];
              if (Math.abs(last.lat - loc.lat) < 1e-6 && Math.abs(last.lng - loc.lng) < 1e-6) {
                return prev;
              }
            }
            return [...prev, { lat: loc.lat, lng: loc.lng }];
          });
        }
        if (typeof payload.etaSeconds === 'number') setEtaSeconds(payload.etaSeconds);
        if (typeof payload.distanceRemainingMeters === 'number') setDistanceRemainingMeters(payload.distanceRemainingMeters);
        if (payload.status) {
          setCurrentStatus((prev) => {
            const curIdx = getStageIndex(prev);
            const newIdx = getStageIndex(payload.status);
            return newIdx >= curIdx ? payload.status : prev;
          });
          if (payload.status === 'arrived_pickup') {
            setIsHandoffPending(true);
          } else if (['picked_up', 'out_for_delivery', 'delivered'].includes(payload.status)) {
            setIsHandoffPending(false);
          }
          if (payload.status === 'delivered') {
            setIsDelivered(true);
            if (payload.actualTransitMinutes) setTransitMinutes(payload.actualTransitMinutes);
          }
        }
      }
    };

    const handleStatus = (payload: any) => {
      if (payload.orderId === orderId) {
        const loc = payload.location?.coordinates && Array.isArray(payload.location.coordinates)
          ? { lat: payload.location.coordinates[1], lng: payload.location.coordinates[0] }
          : payload.location;
        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          setCourierPosition({ lat: loc.lat, lng: loc.lng });
          setTravelledCoords((prev) => {
            if (prev.length > 0) {
              const last = prev[prev.length - 1];
              if (Math.abs(last.lat - loc.lat) < 1e-6 && Math.abs(last.lng - loc.lng) < 1e-6) {
                return prev;
              }
            }
            return [...prev, { lat: loc.lat, lng: loc.lng }];
          });
        }
        if (payload.status) {
          setCurrentStatus((prev) => {
            const curIdx = getStageIndex(prev);
            const newIdx = getStageIndex(payload.status);
            return newIdx >= curIdx ? payload.status : prev;
          });
          if (payload.status === 'arrived_pickup') {
            setIsHandoffPending(true);
          } else if (['picked_up', 'out_for_delivery', 'delivered'].includes(payload.status)) {
            setIsHandoffPending(false);
          }
          if (payload.status === 'delivered') {
            setIsDelivered(true);
            if (payload.actualTransitMinutes) setTransitMinutes(payload.actualTransitMinutes);
          }
        }
      }
    };

    const handleOrderUpdate = (payload: any) => {
      const pId = payload.orderId || payload.id;
      if (pId === orderId) {
        if (payload.status) {
          setCurrentStatus((prev) => {
            const curIdx = getStageIndex(prev);
            const newIdx = getStageIndex(payload.status);
            return newIdx >= curIdx ? payload.status : prev;
          });
          if (payload.status === 'delivered') {
            setIsDelivered(true);
            if (payload.actualTransitMinutes) setTransitMinutes(payload.actualTransitMinutes);
          }
        }
      }
    };

    socketService.onDeliveryLocation(handleLocation);
    socketService.onDeliveryStatus(handleStatus);
    socketService.onOrderStatusUpdate(handleOrderUpdate);

    return () => {
      socketService.offDeliveryLocation(handleLocation);
      socketService.offDeliveryStatus(handleStatus);
      socketService.offOrderStatusUpdate(handleOrderUpdate);
    };
  }, [activeOrder?._id, activeDelivery?._id, isDelivered]);

  // Launch live order demo handler
  const handleLaunchLiveDemo = useCallback(async () => {
    if (isLaunching) return;
    setIsLaunching(true);
    setLaunchError(null);
    try {
      const res = await api.request<any>('/dev/demo/launch-live-order', {
        method: 'POST',
      });
      const payload = (res && 'data' in res && res.data) ? res.data : res;
      if (payload?.order) {
        const { order, delivery, restaurant, customer, partner } = payload;
        setActiveOrder(order);
        setActiveDelivery(delivery);
        if (restaurant) setRestaurantInfo(restaurant);
        if (customer) setCustomerInfo(customer);
        if (partner) setPartnerInfo(partner);
        setCurrentStatus(order.status || 'partner_assigned');
        if (partner?.currentLocation) {
          setCourierPosition(partner.currentLocation);
        }
        if (typeof delivery?.distanceRemainingMeters === 'number') {
          setDistanceRemainingMeters(delivery.distanceRemainingMeters);
        }
        if (typeof delivery?.etaSeconds === 'number') {
          setEtaSeconds(delivery.etaSeconds);
        }
        setIsDelivered(false);
        setIsHandoffPending(false);
        setTransitMinutes(null);

        socketService.connect(customer?.id, 'customer');
        if (order?._id) {
          socketService.joinOrderRoom(order._id);
        }
      }
    } catch (err: any) {
      setLaunchError(err.message || 'Failed to launch live order demo. Check that API server is running.');
    } finally {
      setIsLaunching(false);
    }
  }, [isLaunching]);

  // Kitchen handoff confirmation handler
  const handleConfirmHandoff = useCallback(async () => {
    if (isHandingOff) return;
    setIsHandingOff(true);
    try {
      const res = await api.request<any>('/dev/demo/confirm-handoff', {
        method: 'POST',
        body: JSON.stringify({ orderId: activeOrder?._id }),
      });
      const payload = (res && 'data' in res && res.data) ? res.data : res;
      if (payload?.order) {
        setCurrentStatus('picked_up');
        setIsHandoffPending(false);
      }
    } catch (err: any) {
      console.error('Failed to confirm handoff:', err);
    } finally {
      setIsHandingOff(false);
      setHandoffCountdown(null);
    }
  }, [isHandingOff, activeOrder?._id]);

  // Automatic handoff countdown when arrived at kitchen
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isHandoffPending && !isHandingOff && !isDelivered) {
      setHandoffCountdown(3);
      timer = setInterval(() => {
        setHandoffCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            handleConfirmHandoff();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setHandoffCountdown(null);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isHandoffPending, isHandingOff, isDelivered, handleConfirmHandoff]);

  // Handle external launchTrigger from Hero CTA button
  useEffect(() => {
    if (launchTrigger && launchTrigger > lastHandledTrigger.current) {
      lastHandledTrigger.current = launchTrigger;
      setActiveTab(0);
      if (!isLaunching && (!activeOrder || isDelivered)) {
        handleLaunchLiveDemo();
      }
    }
  }, [launchTrigger, isLaunching, activeOrder, isDelivered, handleLaunchLiveDemo]);

  // Bounded road route calculation for the active demo leg
  useEffect(() => {
    if (!activeOrder || !restaurantCoords || !customerCoords) {
      setRouteCoords([]);
      setRouteStatus('none');
      return;
    }

    let isCancelled = false;
    const isCustomerLeg = ['picked_up', 'out_for_delivery', 'nearby', 'delivered'].includes(currentStatus);
    const startPoint = isCustomerLeg ? restaurantCoords : (courierPosition || partnerCoords);
    const endPoint = isCustomerLeg ? customerCoords : restaurantCoords;

    // Set immediate direct fallback
    setRouteCoords([startPoint, endPoint]);
    setRouteStatus('direct');

    fetchRoadRoute(startPoint, endPoint, 2500)
      .then((res) => {
        if (!isCancelled && res.coordinates.length > 1) {
          setRouteCoords(res.coordinates);
          setRouteStatus(res.isRoadRoute ? 'road' : 'direct');
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setRouteStatus('direct');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    activeOrder?._id,
    ['picked_up', 'out_for_delivery', 'nearby', 'delivered'].includes(currentStatus),
    restaurantCoords?.lat,
    restaurantCoords?.lng,
    customerCoords?.lat,
    customerCoords?.lng,
  ]);

  // -------------------------------------------------------------
  // DEMO 2: Version Swapper State
  // -------------------------------------------------------------
  const [demoVersion, setDemoVersion] = useState<string>('Home_V');
  const versionVariants = [
    {
      id: 'Home_V',
      name: 'Home_V (Production Composite)',
      tag: 'ACTIVE PRODUCTION',
      focus: 'Truthful dynamic metrics, search query synchronization, real cuisine grid, fastest delivery carousel.',
    },
    {
      id: 'Home_V2',
      name: 'Home_V2 (Developer Showcase)',
      tag: 'DEV SHOWCASE',
      focus: 'Compact metrics dashboard, live state inspection overlays, direct factory seed triggers.',
    },
    {
      id: 'Home_V3',
      name: 'Home_V3 (Visual Showcase)',
      tag: 'VISUAL EXPERIMENT',
      focus: 'Visual presentation testbed for card layouts and promotional hero treatments.',
    },
  ];

  // -------------------------------------------------------------
  // DEMO 3: Telemetry & Live Logger Stream
  // -------------------------------------------------------------
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    // Initial logs
    setLogs(logger.getLogs().slice(-20));
    // Subscribe to logger
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs.slice(-20));
    });
    return () => {
      // Cleanup if logger supports it
    };
  }, []);

  const triggerSampleEvent = (category: 'API' | 'SOCKET' | 'REDUX' | 'APP') => {
    const traceId = Math.random().toString(36).substring(2, 9);
    switch (category) {
      case 'API':
        logger.info('API', `GET /api/restaurants?cuisine=North+Indian [200 OK]`, {
          traceId,
          duration: Math.floor(Math.random() * 80 + 20),
          event: 'API.REQUEST.SUCCESS',
        });
        break;
      case 'SOCKET':
        logger.info('SOCKET', `delivery:location tick emitted lat=12.9433 lng=77.6325`, {
          traceId,
          event: 'SOCKET.LOCATION.TICK',
          data: { orderId: 'ord-showcase-1', status: 'out_for_delivery' },
        });
        break;
      case 'REDUX':
        logger.info('REDUX', `cart/addItem: Butter Chicken (x1) -> subtotal updated`, {
          traceId,
          event: 'CART.ITEM.ADDED',
        });
        break;
      case 'APP':
        logger.info('APP', `DevVersionRenderer hot-swapped version to ${demoVersion}`, {
          traceId,
          event: 'DEV.VERSION.HOTSWAP',
        });
        break;
    }
    setLogs(logger.getLogs().slice(-20));
  };

  return (
    <Box id="interactive-demos" sx={{ mb: 6 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Speed color="secondary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={800}>
          Interactive Engineering Demonstrations
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 800 }}>
        Directly test the core capabilities that power FoodHub: real-time GPS progression simulation, dynamic component hot-swapping, and the client-side observability engine.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Tabs
            value={activeTab}
            onChange={(_e, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab icon={<DeliveryDining />} iconPosition="start" label="1. Live GPS Tracking Simulator" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab icon={<Layers />} iconPosition="start" label="2. Component Version Hot-Swapper" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab icon={<Terminal />} iconPosition="start" label="3. Realtime Telemetry & Logger" sx={{ fontWeight: 700, textTransform: 'none' }} />
          </Tabs>
        </Box>

        {/* TAB 1: GENUINE SERVER-AUTHORITATIVE LIVE ORDER DEMO */}
        {activeTab === 0 && (
          <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
            {/* Top Bar: Title, Live Chip, Socket Status, Action Buttons */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                  <Typography variant="h6" fontWeight={800}>
                    Server-Authoritative Live Order Demo
                  </Typography>
                  <Chip
                    label={activeOrder && !isDelivered ? '● LIVE IN PROGRESS' : isDelivered ? 'COMPLETED' : 'READY TO LAUNCH'}
                    color={activeOrder && !isDelivered ? 'warning' : isDelivered ? 'success' : 'primary'}
                    size="small"
                    sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                  />
                  <Chip
                    icon={socketStatus === 'connected' ? <Wifi sx={{ fontSize: 14 }} /> : <WifiOff sx={{ fontSize: 14 }} />}
                    label={socketStatus === 'connected' ? 'Socket Connected' : 'Socket Reconnecting'}
                    color={socketStatus === 'connected' ? 'success' : 'default'}
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.68rem' }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Executes a real order through MongoDB persistence, owner confirmation, courier dispatch, and live Socket.IO courier coordinate updates.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  size="medium"
                  variant="contained"
                  color={isDelivered ? 'success' : activeOrder ? 'info' : 'warning'}
                  startIcon={isLaunching ? <CircularProgress size={18} color="inherit" /> : <PlayArrow />}
                  disabled={isLaunching || (Boolean(activeOrder) && !isDelivered)}
                  onClick={handleLaunchLiveDemo}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                  }}
                >
                  {isLaunching
                    ? 'Launching Live Demo...'
                    : isDelivered
                    ? '▶ Launch Another Order Demo'
                    : activeOrder
                    ? 'Order In Transit (Live Sync)'
                    : '▶ Launch Live Order Demo'}
                </Button>

                {activeOrder && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Replay />}
                    onClick={() => {
                      setActiveOrder(null);
                      setActiveDelivery(null);
                      setCourierPosition(null);
                      setIsDelivered(false);
                      setIsHandoffPending(false);
                      setCurrentStatus('idle');
                    }}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Reset View
                  </Button>
                )}
              </Stack>
            </Stack>

            {/* Simulated GPS Tracking Notice */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 2.5,
                bgcolor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                <strong>Simulated Delivery Environment:</strong> Demonstrates the actual backend state transitions and road routing algorithm (<code style={{ color: '#2563eb' }}>API/src/modules/delivery/delivery.simulator.ts</code>). This environment generates programmatic courier waypoints across Bangalore streets, not physical device GPS hardware.
              </Typography>
            </Paper>

            {/* Error Banner */}
            {launchError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLaunchError(null)}>
                {launchError}
              </Alert>
            )}

            {/* Arrived Kitchen Handoff Banner */}
            {isHandoffPending && (
              <Alert
                severity="warning"
                icon={<HourglassEmpty fontSize="inherit" />}
                action={
                  <Button
                    color="warning"
                    variant="contained"
                    size="small"
                    startIcon={isHandingOff ? <CircularProgress size={14} color="inherit" /> : <FlashOn />}
                    disabled={isHandingOff}
                    onClick={handleConfirmHandoff}
                    sx={{ fontWeight: 800, textTransform: 'none' }}
                  >
                    {isHandingOff ? 'Handing Off...' : 'Hand Off Food Now'}
                  </Button>
                }
                sx={{ mb: 2, alignItems: 'center' }}
              >
                <strong>Courier arrived at restaurant kitchen!</strong> Ready for food handoff to dispatch toward customer.{' '}
                {handoffCountdown !== null && (
                  <span style={{ fontWeight: 700 }}>
                    (Auto-handing off in {handoffCountdown}s...)
                  </span>
                )}
              </Alert>
            )}

            {/* Delivered Completion Banner */}
            {isDelivered && (
              <Alert
                severity="success"
                icon={<CheckCircle fontSize="inherit" />}
                action={
                  <Button
                    color="success"
                    variant="outlined"
                    size="small"
                    startIcon={<Replay />}
                    onClick={handleLaunchLiveDemo}
                    sx={{ fontWeight: 700, textTransform: 'none' }}
                  >
                    Run Another Demo
                  </Button>
                }
                sx={{ mb: 2, alignItems: 'center' }}
              >
                <strong>Order Successfully Delivered!</strong> Real-time lifecycle demonstration complete.
                {transitMinutes ? ` Total elapsed transit time: ${transitMinutes} min.` : ''} MongoDB documents and partner availability updated.
              </Alert>
            )}

            {/* Stage Progress Bar */}
            {(() => {
              const currentStageIdx = getStageIndex(currentStatus);
              const progressPct = activeOrder ? Math.round(((currentStageIdx + 1) / stages.length) * 100) : 0;
              return (
                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      {activeOrder
                        ? `STAGE ${currentStageIdx + 1} OF ${stages.length}: ${stages[currentStageIdx]?.label.toUpperCase()}`
                        : 'READY TO START: CLICK "LAUNCH LIVE ORDER DEMO" ABOVE'}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                      {progressPct}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant={isLaunching ? 'indeterminate' : 'determinate'}
                    value={progressPct}
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  />

                  {/* Stage Step Pills */}
                  <Stack direction="row" spacing={1} overflow="auto" sx={{ pb: 1 }}>
                    {stages.map((s, idx) => {
                      const isPast = idx < currentStageIdx;
                      const isCurrent = idx === currentStageIdx && Boolean(activeOrder);
                      return (
                        <Chip
                          key={s.key}
                          label={`${idx + 1}. ${s.label}`}
                          size="small"
                          color={isCurrent ? 'primary' : isPast ? 'success' : 'default'}
                          variant={isCurrent ? 'filled' : 'outlined'}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            flexShrink: 0,
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              );
            })()}

            {/* Real-Time Order & Telemetry Cards */}
            {activeOrder && (
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      ORDER ID & STATUS
                    </Typography>
                    <Typography variant="body2" fontWeight={800} noWrap sx={{ mt: 0.5 }}>
                      #{activeOrder._id ? activeOrder._id.slice(-8) : 'ORD-DEMO'}
                    </Typography>
                    <Chip
                      label={currentStatus.replace(/_/g, ' ').toUpperCase()}
                      size="small"
                      color={isDelivered ? 'success' : isHandoffPending ? 'warning' : 'primary'}
                      sx={{ fontWeight: 800, fontSize: '0.65rem', mt: 0.5 }}
                    />
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      RESTAURANT KITCHEN
                    </Typography>
                    <Typography variant="body2" fontWeight={800} noWrap sx={{ mt: 0.5 }}>
                      {restaurantInfo?.name || activeOrder.restaurantName || 'Spice Kitchen'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {restaurantInfo?.address || '100ft Road, Bangalore'}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      COURIER PARTNER
                    </Typography>
                    <Typography variant="body2" fontWeight={800} noWrap sx={{ mt: 0.5 }}>
                      {partnerInfo?.name || 'Ramesh Rider (Bike)'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {partnerInfo?.phone || '+91 98888 88883'}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      DISTANCE & ETA
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={800}>
                          {distanceRemainingMeters !== null
                            ? distanceRemainingMeters > 1000
                              ? `${(distanceRemainingMeters / 1000).toFixed(1)} km`
                              : `${distanceRemainingMeters} m`
                            : '--'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Remaining</Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box>
                        <Typography variant="body2" fontWeight={800} color="primary.main">
                          {etaSeconds !== null
                            ? etaSeconds <= 0
                              ? 'Arrived'
                              : `${Math.max(1, Math.ceil(etaSeconds / 60))} mins`
                            : '--'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Estimated</Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Embedded Live Leaflet Map */}
            <Box
              sx={{
                height: 420,
                width: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
              }}
            >
              <Map
                center={partnerCoords || restaurantCoords}
                zoom={14}
                height="100%"
                markers={[
                  {
                    id: 'restaurant',
                    position: restaurantCoords,
                    type: 'restaurant',
                    title: `${restaurantInfo?.name || 'Showcase Kitchen'} (Pickup)`,
                  },
                  {
                    id: 'customer',
                    position: customerCoords,
                    type: 'customer',
                    title: `${customerInfo?.name || 'Customer'} (Dropoff: ${customerInfo?.address || 'Showcase Heights'})`,
                  },
                  ...(activeOrder
                    ? [
                        {
                          id: 'partner',
                          position: partnerCoords,
                          type: 'partner' as const,
                          title: `Courier: ${partnerInfo?.name || 'Partner'} [${currentStatus.replace(/_/g, ' ')}]`,
                        },
                      ]
                    : []),
                ]}
                routeCoordinates={routeCoords}
                travelledCoordinates={travelledCoords}
                isFallbackRoute={routeStatus === 'direct'}
                routeStatus={routeStatus}
              />
            </Box>

            {/* Deep Links to Live Multi-Actor Dashboards */}
            {activeOrder && (
              <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                  Inspect Multi-Actor Synchronized Interfaces in New Tabs:
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Button
                    component="a"
                    href={`/orders/tracking/${activeOrder._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    startIcon={<Person />}
                    endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Customer Live Tracking
                  </Button>
                  <Button
                    component="a"
                    href="/owner"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    startIcon={<Restaurant />}
                    endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Merchant Kitchen View
                  </Button>
                  <Button
                    component="a"
                    href="/partner/active"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    startIcon={<DeliveryDining />}
                    endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Courier Navigation View
                  </Button>
                </Stack>
              </Paper>
            )}

            {/* Technical Architecture Footnote */}
            <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Technical Architecture Note:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                The real-world backend simulation ticks every 500ms and verifies an atomic Compare-and-Set guard (<code style={{ color: '#2563eb' }}>status: {'{ $in: [\'picked_up\', \'out_for_delivery\'] }'}</code>) before emitting coordinates over Socket.IO. When the courier reaches the destination, the order atomically reaches terminal status and releases fleet partner availability.
              </Typography>
            </Paper>
          </Box>
        )}

        {/* TAB 2: VERSION SWAPPER DEMO */}
        {activeTab === 1 && (
          <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="h6" fontWeight={800}>
                Dynamic Component Versioning Engine
              </Typography>
              <Chip label="Framework Architecture" color="secondary" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              FoodHub abstracts component generation switching via `DevVersionRenderer.tsx`. Using Vite `import.meta.glob`, pages can dynamically load different architectural variants without route restructuring.
            </Typography>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {versionVariants.map((variant) => {
                const isSelected = demoVersion === variant.id;
                return (
                  <Grid item xs={12} md={4} key={variant.id}>
                    <Card
                      variant="outlined"
                      onClick={() => setDemoVersion(variant.id)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '2px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        bgcolor: isSelected ? 'primary.50' : 'background.paper',
                        boxShadow: isSelected ? '0 4px 16px rgba(59, 130, 246, 0.25)' : 'none',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Chip label={variant.tag} size="small" color={isSelected ? 'primary' : 'default'} sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                          {isSelected && <CheckCircle color="primary" sx={{ fontSize: 18 }} />}
                        </Stack>
                        <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                          {variant.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                          {variant.focus}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Code implementation snippet */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: '#0f172a',
                color: '#f8fafc',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                overflowX: 'auto',
              }}
            >
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
                // Real usage in web/src/pages/Home/index.tsx
              </Typography>
              <Box component="pre" sx={{ m: 0 }}>
{`import { DevVersionRenderer } from '../../core/dev/renderer/DevVersionRenderer';

export default function Home() {
  return (
    <DevVersionRenderer
      pageKey="home"
      defaultVersion="${demoVersion}"
      imports={import.meta.glob('./versions/*.tsx')}
    />
  );
}`}
              </Box>
            </Paper>
          </Box>
        )}

        {/* TAB 3: REALTIME TELEMETRY & LOGGER STREAM */}
        {activeTab === 2 && (
          <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="h6" fontWeight={800}>
                    Structured Trace Logger & Telemetry Engine
                  </Typography>
                  <Chip label="Client Observability" color="info" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Live rolling stream from `web/src/core/dev/logger/Logger.ts`. Attaches trace IDs and performance measurements across HTTP, WebSockets, and Redux.
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                  * Interactive diagnostic simulation demonstrating structured trace formatting and local telemetry capture without network side effects.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button size="small" variant="outlined" onClick={() => triggerSampleEvent('API')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Simulate API Trace
                </Button>
                <Button size="small" variant="outlined" onClick={() => triggerSampleEvent('SOCKET')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Simulate Socket Trace
                </Button>
                <Button size="small" variant="outlined" onClick={() => triggerSampleEvent('REDUX')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Simulate Redux Trace
                </Button>
              </Stack>
            </Stack>


            {/* Filter pills */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {['ALL', 'API', 'SOCKET', 'REDUX', 'APP'].map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  size="small"
                  color={selectedCategory === cat ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(cat)}
                  sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                />
              ))}
            </Stack>

            {/* Log Terminal Window */}
            <Paper
              elevation={0}
              sx={{
                bgcolor: '#0f172a',
                color: '#e2e8f0',
                borderRadius: 2.5,
                p: 2,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                height: 320,
                overflowY: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {logs.length === 0 ? (
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  No telemetry events captured yet. Click the buttons above to emit trace events.
                </Typography>
              ) : (
                logs
                  .filter((l) => selectedCategory === 'ALL' || l.category === selectedCategory)
                  .map((log) => (
                    <Box key={log.id} sx={{ mb: 1, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <Box component="span" sx={{ color: '#64748b' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          color:
                            log.category === 'API'
                              ? '#38bdf8'
                              : log.category === 'SOCKET'
                              ? '#4ade80'
                              : log.category === 'REDUX'
                              ? '#fbbf24'
                              : '#c084fc',
                          fontWeight: 700,
                        }}
                      >
                        [{log.category}]
                      </Box>
                      {log.traceId && (
                        <Box component="span" sx={{ color: '#f43f5e' }}>
                          trace:{log.traceId}
                        </Box>
                      )}
                      <Box component="span" sx={{ color: '#f1f5f9' }}>
                        {log.message}
                      </Box>
                      {log.duration !== undefined && (
                        <Box component="span" sx={{ color: '#a3e635' }}>
                          ({log.duration}ms)
                        </Box>
                      )}
                    </Box>
                  ))
              )}
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
