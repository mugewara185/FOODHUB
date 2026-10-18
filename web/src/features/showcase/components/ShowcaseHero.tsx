import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  Container,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  RocketLaunch,
  Architecture,
  Terminal,
  Speed,
  OpenInNew,
  CheckCircle,
  CompareArrows,
  PlayArrow,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

interface ShowcaseHeroProps {
  isQuickScan: boolean;
  onToggleQuickScan: (val: boolean) => void;
  onScrollToSection: (sectionId: string) => void;
  onLaunchLiveDemo?: () => void;
}

export const ShowcaseHero: React.FC<ShowcaseHeroProps> = ({
  isQuickScan,
  onToggleQuickScan,
  onScrollToSection,
  onLaunchLiveDemo,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        color: '#f8fafc',
        borderRadius: { xs: 0, sm: 3 },
        p: { xs: 3, sm: 5, md: 6 },
        mb: 4,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background glow */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" disableGutters sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              icon={<RocketLaunch sx={{ fontSize: 16, color: '#38bdf8 !important' }} />}
              label="ENGINEERING PORTFOLIO SHOWCASE"
              sx={{
                bgcolor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            />
            <Chip
              icon={<CheckCircle sx={{ fontSize: 16, color: '#4ade80 !important' }} />}
              label="MULTI-ACTOR REALTIME"
              sx={{
                bgcolor: 'rgba(74, 222, 128, 0.15)',
                color: '#4ade80',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: '1px solid rgba(74, 222, 128, 0.3)',
              }}
            />

          </Stack>

          {/* Quick Scan Mode Toggle */}
          <Paper
            elevation={0}
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={isQuickScan}
                  onChange={(e) => onToggleQuickScan(e.target.checked)}
                  color="warning"
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600, color: isQuickScan ? '#f59e0b' : '#94a3b8' }}>
                  ⚡ 2-Minute Recruiter Scan
                </Typography>
              }
              sx={{ m: 0 }}
            />
          </Paper>
        </Stack>

        <Typography
          variant="h3"
          component="h1"
          fontWeight={900}
          sx={{
            fontSize: { xs: '1.85rem', sm: '2.5rem', md: '3.2rem' },
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            mb: 2,
            background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          FoodHub Distributed System Architecture
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: '1rem', md: '1.2rem' },
            color: '#94a3b8',
            maxWidth: 820,
            lineHeight: 1.6,
            mb: 3,
          }}
        >
          A high-signal technical exploration of an event-driven food delivery ecosystem. Synchronizes 4 independent actor domains (Customer, Merchant Owner, Delivery Fleet, Admin) via WebSockets, backed by atomic state machines, dual Mock/API transports, and an enterprise observability platform.
        </Typography>

        {/* Tech Stack Pills */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 4 }}>
          {['React 18', 'TypeScript', 'Redux Toolkit', 'Socket.IO', 'Node / Express', 'MongoDB / Mongoose', 'Leaflet GPS', 'Vite', 'Vitest', 'Puppeteer E2E'].map((tech) => (
            <Chip
              key={tech}
              label={tech}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.78rem',
              }}
            />
          ))}
        </Stack>

        {/* Action Jump Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            color="warning"
            startIcon={<PlayArrow sx={{ color: '#0f172a' }} />}
            onClick={() => {
              onScrollToSection('interactive-demos');
              if (onLaunchLiveDemo) {
                onLaunchLiveDemo();
              }
            }}
            sx={{
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              py: 1.2,
              borderRadius: 2,
              bgcolor: '#f59e0b',
              color: '#0f172a',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              '&:hover': {
                bgcolor: '#d97706',
              },
            }}
          >
            ▶ Launch Live Order Demo
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Architecture />}
            onClick={() => onScrollToSection('architecture-diagram')}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
            }}
          >
            System Architecture
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Speed />}
            onClick={() => onScrollToSection('interactive-demos')}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)',
            }}
          >
            Live Interactive Demos
          </Button>
          <Button
            variant="outlined"
            startIcon={<Terminal />}
            onClick={() => onScrollToSection('engineering-tradeoffs')}
            sx={{
              color: '#f8fafc',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              py: 1.2,
              borderRadius: 2,
              '&:hover': {
                borderColor: '#ffffff',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            Key Trade-offs
          </Button>
          <Button
            component={RouterLink}
            to="/restaurants"
            variant="text"
            endIcon={<OpenInNew />}
            sx={{
              color: '#38bdf8',
              fontWeight: 700,
              textTransform: 'none',
              px: 2,
            }}
          >
            Browse Live Catalog
          </Button>
        </Stack>
      </Container>
    </Paper>
  );
};
