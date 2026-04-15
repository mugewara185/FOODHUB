import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  Stack,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Speed,
  Memory,
  Storage,
  NetworkCheck,
  Code,
  BugReport,
  Palette,
  Description,
  TrendingUp,
  TrendingDown,
  Refresh,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
} from '@mui/icons-material';
import { useDevContext } from '../contexts/DevContext';
import { useLogger } from '../logger';

const DevDashboard: React.FC = () => {
  const { logs } = useLogger()
  // const { performance, versions, currentVersion, setCurrentVersion } = useDevContext();
  const { availableVersions: versions, selectedVersions: currentVersion, setVersion: setCurrentVersion } = useDevContext();
  const performance = { fps: 0, memory: 0, apiLatency: 0, renderTime: 0 }; // Fallback values
  const [systemInfo, setSystemInfo] = useState({
    browser: '',
    os: '',
    screenSize: '',
    deviceMemory: 0,
    cores: 0,
  });

  useEffect(() => {
    // Collect system information
    setSystemInfo({
      browser: navigator.userAgent.split(' ').pop() || 'Unknown',
      os: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      // deviceMemory: (navigator : any).deviceMemory || 4,
      deviceMemory: 4,
      cores: navigator.hardwareConcurrency || 4,
    });
  }, []);

  const stats = [
    { label: 'FPS', value: performance?.fps, icon: <Speed />, color: performance?.fps > 50 ? 'success' : performance?.fps > 30 ? 'warning' : 'error' },
    { label: 'Memory Usage', value: `${performance?.memory || 0} MB`, icon: <Memory />, color: (performance?.memory || 0) < 200 ? 'success' : 'warning' },
    { label: 'API Latency', value: `${performance?.apiLatency}ms`, icon: <NetworkCheck />, color: performance?.apiLatency < 200 ? 'success' : 'warning' },
    { label: 'Render Time', value: `${performance?.renderTime}ms`, icon: <Storage />, color: performance?.renderTime < 50 ? 'success' : 'warning' },
  ];

  const logCounts = {
    error: logs.filter(l => l.type === 'error').length,
    warning: logs.filter(l => l.type === 'warning').length,
    success: logs.filter(l => l.type === 'success').length,
    info: logs.filter(l => l.type === 'info').length,
  };

  const recentLogs = logs.slice(0, 5);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'success': return <CheckCircle color="success" />;
      default: return <Info color="info" />;
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Developer Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        System monitoring and development tools
      </Typography>

      {/* System Info */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          System Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Browser</Typography>
            <Typography variant="body2" fontWeight={500}>{systemInfo.browser}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">OS</Typography>
            <Typography variant="body2" fontWeight={500}>{systemInfo.os}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Screen</Typography>
            <Typography variant="body2" fontWeight={500}>{systemInfo.screenSize}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">CPU Cores</Typography>
            <Typography variant="body2" fontWeight={500}>{systemInfo.cores}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Performance? Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid item xs={6} md={3} key={stat.label}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar sx={{ bgcolor: `${stat.color}.light`, width: 32, height: 32 }}>
                    {stat.icon}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color={`${stat.color}.main`}>
                  {stat.value}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stat.label === 'FPS' ? (stat.value / 60) * 100 : (parseInt(stat.value) / 500) * 100}
                  color={stat.color as any}
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Version Switcher & Logs */}
      <Grid container spacing={3}>
        {/* Version Switcher */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Component Versions
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Switch between different UI versions
            </Typography>

            <Stack spacing={2}>
              {[
                {
                  id: 'v1',
                  name: 'Version 1',
                  version: '1.0.0',
                  description: 'Initial release with core restaurant browsing and cart functionality.',
                  features: [
                    'Browse restaurants',
                    'View menu',
                    'Add to cart',
                    'Basic checkout'
                  ],
                },
                {
                  id: 'v2',
                  name: 'Version 2',
                  version: '2.0.0',
                  description: 'Enhanced UX with owner dashboard and improved performance.',
                  features: [
                    'Owner dashboard',
                    'Menu management',
                    'Order tracking',
                    'UI improvements'
                  ],
                },
              ].map((version) => (
                <Paper
                  key={version.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderColor: currentVersion === version.id ? 'primary.main' : 'divider',
                    bgcolor: currentVersion === version.id ? 'primary.light' : 'transparent',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                  onClick={() => setCurrentVersion(version.id)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {version.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={version.version}
                      color={currentVersion === version.id ? 'primary' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {version.description}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {version.features.map((feature) => (
                      <Chip key={feature} label={feature} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Log Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Recent Logs
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip size="small" label={`Errors: ${logCounts.error}`} color="error" />
                <Chip size="small" label={`Warnings: ${logCounts.warning}`} color="warning" />
              </Box>
            </Box>

            <List>
              {recentLogs.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  No logs yet
                </Typography>
              ) : (
                recentLogs.map((log) => (
                  <ListItem key={log.id} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getLogIcon(log.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={log.message}
                      secondary={log.timestamp.toLocaleTimeString()}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>

      </Grid>

    </Box>
  );
};

export default DevDashboard;