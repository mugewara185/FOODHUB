import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { componentPerfData, bundleMetrics } from '../mockData';

const PerformanceMetrics: React.FC = () => {

  const getRenderColor = (ms: number) => {
    if (ms < 5) return 'success.main';
    if (ms < 15) return 'warning.main';
    return 'error.main';
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', pb: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Performance & Metrics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Analyze component render times, API latencies, and bundle sizes.
      </Typography>

      <Grid container spacing={4}>
        {/* Top Level KPIs */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', borderBottom: '4px solid', borderColor: 'success.main' }}>
                <Typography variant="caption" color="text.secondary">First Contentful Paint</Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">{bundleMetrics.loadTimes.fcp}s</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', borderBottom: '4px solid', borderColor: 'success.main' }}>
                <Typography variant="caption" color="text.secondary">Largest Contentful Paint</Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">{bundleMetrics.loadTimes.lcp}s</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', borderBottom: '4px solid', borderColor: 'warning.main' }}>
                <Typography variant="caption" color="text.secondary">Time to First Byte</Typography>
                <Typography variant="h4" fontWeight={700} color="warning.main">{bundleMetrics.loadTimes.ttfb}ms</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', borderBottom: '4px solid', borderColor: 'success.main' }}>
                <Typography variant="caption" color="text.secondary">Cumulative Layout Shift</Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">{bundleMetrics.loadTimes.cls}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Component Render Times */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ borderRadius: 2, height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={600}>Top Render Bottlenecks</Typography>
              <Chip size="small" label="Avg Mount Time" color="primary" variant="outlined" />
            </Box>
            <List>
              {componentPerfData.sort((a, b) => b.avgRenderMs - a.avgRenderMs).map((item, index) => (
                <React.Fragment key={item.name}>
                  <ListItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2">{item.name}</Typography>
                          {item.memoized && <Chip label="Memoized" size="small" color="success" sx={{ height: 16, fontSize: '0.65rem' }} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">{item.path}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: getRenderColor(item.avgRenderMs) }}>
                          {item.avgRenderMs.toFixed(1)} ms
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.renderCount} renders
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ width: '100%' }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((item.avgRenderMs / 40) * 100, 100)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': { bgcolor: getRenderColor(item.avgRenderMs) }
                        }}
                      />
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">Triggers:</Typography>
                      {item.reRenderTriggers.map(t => (
                        <Chip key={t} label={t} size="small" sx={{ height: 16, fontSize: '0.65rem' }} />
                      ))}
                    </Box>
                  </ListItem>
                  {index < componentPerfData.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Bundle Stats */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={600}>Bundle Sizes</Typography>
            </Box>

            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.50' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary.main" fontWeight={800}>{bundleMetrics.totalSize}</Typography>
                <Typography variant="body2" color="text.secondary">Uncompressed Size</Typography>
                <Chip label={`\${bundleMetrics.gzipSize} GZIP`} color="primary" size="small" sx={{ mt: 1 }} />
              </Box>
            </Box>

            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {bundleMetrics.chunks.map((chunk, index) => (
                <React.Fragment key={chunk.name}>
                  <ListItem>
                    <DashboardIcon sx={{ color: 'text.secondary', mr: 2, opacity: 0.5 }} />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" fontWeight={600}>{chunk.name}</Typography>
                          <Typography variant="body2" fontWeight={600}>{chunk.raw}</Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" noWrap sx={{ maxWidth: 180 }}>
                            {chunk.modules.join(', ')}
                          </Typography>
                          <Typography variant="caption" color="primary.main">
                            Gzip: {chunk.gzip}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < bundleMetrics.chunks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceMetrics;
