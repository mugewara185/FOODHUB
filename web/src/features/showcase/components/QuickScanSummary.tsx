import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import {
  Speed,
  CheckCircle,
  Architecture,
  Terminal,
  CompareArrows,
  ArrowForward,
} from '@mui/icons-material';

interface QuickScanSummaryProps {
  onExploreFull: () => void;
  onExploreLive: () => void;
}

export const QuickScanSummary: React.FC<QuickScanSummaryProps> = ({
  onExploreFull,
  onExploreLive,
}) => {
  const highlights = [
    {
      title: '4-Actor Realtime State Machine',
      summary: 'Pub/sub socket lifecycle spanning Customer, Restaurant Owner, Delivery Fleet Partner, and Platform Admin with atomic state guards.',
      badge: 'Distributed System',
      color: '#3b82f6',
    },
    {
      title: 'Dual Transport Architecture',
      summary: 'Instant runtime toggling between zero-dependency synthetic Mock data and live Express/MongoDB backend via app.config.ts.',
      badge: 'Decoupled Transports',
      color: '#10b981',
    },
    {
      title: 'Dynamic UI Version Engine',
      summary: 'Abstracted hot-swappable component architecture (DevVersionRenderer) supporting side-by-side generational comparisons at runtime.',
      badge: 'Core Framework',
      color: '#8b5cf6',
    },
    {
      title: 'Headless 4-Browser E2E Automation',
      summary: 'Puppeteer orchestration pipeline (web/e2e.ts) executing the entire 4-actor order lifecycle end-to-end in automated browser contexts.',
      badge: 'Test Automation',
      color: '#f59e0b',
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        mb: 6,
        borderRadius: 3,
        border: '2px solid',
        borderColor: 'warning.main',
        bgcolor: 'background.paper',
        boxShadow: '0 8px 30px rgba(245, 158, 11, 0.12)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Chip label="2-MINUTE RECRUITER SCAN" color="warning" size="small" sx={{ fontWeight: 800, fontSize: '0.72rem' }} />
            <Chip label="HIGH SIGNAL" variant="outlined" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
          </Stack>
          <Typography variant="h5" fontWeight={800}>
            Executive Engineering Summary
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={onExploreFull}
            endIcon={<ArrowForward />}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Switch to Full Deep Dive
          </Button>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 850, lineHeight: 1.6 }}>
        If you only have a few minutes: FoodHub is not a generic mock-data storefront. It is a full-stack, distributed food-delivery ecosystem with production-like realtime WebSockets, atomic concurrency protection, client-side observability, and enterprise developer tooling.
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {highlights.map((item) => (
          <Grid item xs={12} sm={6} key={item.title}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderRadius: 2.5,
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Chip
                  label={item.badge}
                  size="small"
                  sx={{
                    bgcolor: `${item.color}15`,
                    color: item.color,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    mb: 1,
                  }}
                />
                <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {item.summary}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions Row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
        <Button
          variant="contained"
          color="warning"
          startIcon={<Speed />}
          onClick={onExploreFull}
          sx={{ fontWeight: 800, textTransform: 'none', px: 3, py: 1 }}
        >
          Inspect Live Demos & Architecture
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={onExploreLive}
          sx={{ fontWeight: 700, textTransform: 'none', px: 3, py: 1 }}
        >
          Explore Live Food Catalog (/restaurants)
        </Button>
      </Stack>
    </Paper>
  );
};
