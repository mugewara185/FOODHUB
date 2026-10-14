import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Stack,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Person,
  Storefront,
  DeliveryDining,
  AdminPanelSettings,
  Tune,
  OpenInNew,
  Code,
  CheckCircle,
  HelpOutline,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { SHOWCASE_DOMAINS } from '../showcaseData';
import type { DomainShowcase } from '../types';

export const DomainShowcaseCards: React.FC = () => {
  const [activeDomainIdx, setActiveDomainIdx] = useState<number>(0);
  const currentDomain: DomainShowcase = SHOWCASE_DOMAINS[activeDomainIdx] || SHOWCASE_DOMAINS[0];

  const getDomainIcon = (id: string) => {
    switch (id) {
      case 'customer':
        return <Person />;
      case 'owner':
        return <Storefront />;
      case 'partner':
        return <DeliveryDining />;
      case 'admin':
        return <AdminPanelSettings />;
      case 'dev':
        return <Tune />;
      default:
        return <Code />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified E2E':
        return 'success';
      case 'Deterministic Simulation':
        return 'info';
      case 'Dual Transport (Mock / API)':
        return 'primary';
      case 'Architectural Prototype':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box id="domain-deep-dives" sx={{ mb: 6 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Code color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={800}>
          Multi-Domain Architecture & Technical Boundaries
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 800 }}>
        FoodHub is partitioned into distinct domain models, each with dedicated state machines, WebSocket channels, and layout boundaries.
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
        {/* Domain Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Tabs
            value={activeDomainIdx}
            onChange={(_e, v) => setActiveDomainIdx(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            {SHOWCASE_DOMAINS.map((domain, idx) => (
              <Tab
                key={domain.id}
                icon={getDomainIcon(domain.id)}
                iconPosition="start"
                label={domain.title}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '0.88rem',
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Active Domain Body */}
        <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip
                  label={currentDomain.roleBadge}
                  sx={{
                    bgcolor: `${currentDomain.accentColor}20`,
                    color: currentDomain.accentColor,
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    letterSpacing: '0.04em',
                  }}
                />
                <Chip
                  label={currentDomain.status}
                  color={getStatusColor(currentDomain.status) as any}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                />
              </Stack>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                {currentDomain.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 750 }}>
                {currentDomain.description}
              </Typography>
            </Box>

            {/* Quick public jump button if public route exists */}
            {currentDomain.id === 'customer' && (
              <Button
                component={RouterLink}
                to="/restaurants"
                variant="contained"
                endIcon={<OpenInNew />}
                sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
              >
                Experience Live Catalog
              </Button>
            )}
          </Stack>

          {/* Realtime Events & Actors Metadata */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom>
                  KEY ACTORS & AGENTS
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {currentDomain.keyActors.map((actor) => (
                    <Chip key={actor} label={actor} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom>
                  WEBSOCKET CHANNELS / EVENTS
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {currentDomain.realtimeEvents.map((evt) => (
                    <Chip
                      key={evt}
                      label={evt}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Feature Breakdown Cards */}
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2, letterSpacing: '0.04em' }}>
            ENGINEERING CAPABILITIES & MODULE IMPLEMENTATION
          </Typography>

          <Grid container spacing={2.5}>
            {currentDomain.features.map((feature) => (
              <Grid item xs={12} md={6} key={feature.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2.5,
                    borderColor: 'divider',
                    transition: 'border-color 0.2s',
                    '&:hover': {
                      borderColor: currentDomain.accentColor,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {feature.name}
                      </Typography>
                      <Chip
                        label={feature.status}
                        size="small"
                        color={getStatusColor(feature.status) as any}
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                      />
                    </Stack>

                    <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary', fontSize: '0.85rem' }}>
                      {feature.summary}
                    </Typography>

                    <Paper elevation={0} sx={{ p: 1.5, mb: 2, borderRadius: 1.5, bgcolor: 'background.default' }}>
                      <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 500, display: 'block', fontSize: '0.78rem' }}>
                        {feature.technicalDetails}
                      </Typography>
                    </Paper>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                      {feature.keyConcepts.map((concept) => (
                        <Chip
                          key={concept}
                          label={concept}
                          size="small"
                          sx={{
                            fontSize: '0.68rem',
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          color: 'text.secondary',
                          fontSize: '0.72rem',
                          maxWidth: '75%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={feature.sourceFile}
                      >
                        📂 {feature.sourceFile}
                      </Typography>

                      {feature.routePath && (
                        <Button
                          component={RouterLink}
                          to={feature.routePath}
                          size="small"
                          endIcon={<OpenInNew sx={{ fontSize: '14px !important' }} />}
                          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                        >
                          View
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};
