import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import Map from '../../../shared/components/maps/Map';
import { logger } from '../../../core/dev/logger/Logger';
import type { LogEntry } from '../../../core/dev/logger/types';

export const InteractiveDemos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  // -------------------------------------------------------------
  // DEMO 1: GPS Delivery Simulation State
  // -------------------------------------------------------------
  const stages = [
    { key: 'placed', label: 'Order Placed', actor: 'Customer', desc: 'Order created and broadcasted to kitchen via socket' },
    { key: 'accepted', label: 'Accepted by Kitchen', actor: 'Owner', desc: 'Merchant accepts and marks ticket in preparing state' },
    { key: 'assigned', label: 'Courier Assigned', actor: 'Partner', desc: 'Delivery partner accepts assignment; simulator calculates route' },
    { key: 'picked_up', label: 'Food Picked Up', actor: 'Partner', desc: 'Courier arrives at restaurant and confirms pickup dialog' },
    { key: 'out_for_delivery', label: 'Out for Delivery (GPS Active)', actor: 'System', desc: 'Deterministic GPS tick interpolation begins towards customer' },
    { key: 'delivered', label: 'Order Delivered', actor: 'Partner', desc: 'Courier marks delivered; partner state resets to available' },
  ];

  const [currentStageIdx, setCurrentStageIdx] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Coordinates: Bangalore Koramangala demo
  const restaurantCoords = { lat: 12.9352, lng: 77.6245 };
  const customerCoords = { lat: 12.9515, lng: 77.6405 };

  // Calculate simulated courier position based on stage
  const getPartnerPosition = () => {
    if (currentStageIdx <= 2) return { lat: 12.9300, lng: 77.6200 };
    if (currentStageIdx === 3) return restaurantCoords;
    if (currentStageIdx === 4) return { lat: 12.9433, lng: 77.6325 }; // midpoint
    return customerCoords;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStageIdx((prev) => {
          if (prev >= stages.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, stages.length]);

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

        {/* TAB 1: GPS SIMULATOR DEMO */}
        {activeTab === 0 && (
          <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="h6" fontWeight={800}>
                    Deterministic GPS Navigation Simulator
                  </Typography>
                  <Chip label="Deterministic Simulation" color="info" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Demonstrates the server-side simulation loop (`delivery.simulator.service.ts`) computing intermediate coordinates between restaurant and drop-off.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={isPlaying ? <Pause /> : <PlayArrow />}
                  color={isPlaying ? 'warning' : 'primary'}
                  onClick={() => setIsPlaying(!isPlaying)}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  {isPlaying ? 'Pause' : 'Auto Play'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Replay />}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStageIdx(0);
                  }}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>

            {/* Stage Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  STAGE {currentStageIdx + 1} OF {stages.length}: {stages[currentStageIdx].label.toUpperCase()}
                </Typography>
                <Typography variant="caption" fontWeight={700} color="primary.main">
                  {Math.round(((currentStageIdx + 1) / stages.length) * 100)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={((currentStageIdx + 1) / stages.length) * 100}
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />

              {/* Stage Step Pills */}
              <Stack direction="row" spacing={1} overflow="auto" sx={{ pb: 1 }}>
                {stages.map((s, idx) => (
                  <Chip
                    key={s.key}
                    label={`${idx + 1}. ${s.label}`}
                    size="small"
                    color={idx === currentStageIdx ? 'primary' : idx < currentStageIdx ? 'success' : 'default'}
                    variant={idx === currentStageIdx ? 'filled' : 'outlined'}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStageIdx(idx);
                    }}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Embedded Map Component */}
            <Box
              sx={{
                height: 380,
                width: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
              }}
            >
              <Map
                center={{ lat: 12.9433, lng: 77.6325 }}
                zoom={13}
                height="100%"
                markers={[
                  {
                    id: 'restaurant',
                    position: restaurantCoords,
                    type: 'restaurant',
                    title: 'Spice Garden (Pickup)',
                  },
                  {
                    id: 'customer',
                    position: customerCoords,
                    type: 'customer',
                    title: 'Customer Residence (Dropoff)',
                  },
                  {
                    id: 'partner',
                    position: getPartnerPosition(),
                    type: 'partner',
                    title: `Courier Position (${stages[currentStageIdx].label})`,
                  },
                ]}
              />
            </Box>

            <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Technical Architecture Note:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                The real-world backend simulation ticks every 500ms and verifies an atomic Compare-and-Set guard (`status: {'{ $in: [\'picked_up\', \'out_for_delivery\'] }'}`) before emitting coordinates over Socket.IO. If an order is cancelled or completed concurrently, the tick loop aborts immediately to avoid stale state writes.
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
              <Chip label="Verified E2E" color="success" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
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
                  <Chip label="Verified E2E" color="success" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Live rolling stream from `web/src/core/dev/logger/Logger.ts`. Attaches trace IDs and performance measurements across HTTP, WebSockets, and Redux.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button size="small" variant="outlined" onClick={() => triggerSampleEvent('API')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  + API Log
                </Button>
                <Button size="small" variant="outlined" onClick={() => triggerSampleEvent('SOCKET')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  + Socket Log
                </Button>
                <Button size="small" variant="outlined" onClick={() => triggerSampleEvent('REDUX')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  + Redux Log
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
