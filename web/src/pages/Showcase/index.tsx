import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import { ArrowBack, Restaurant, Code } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useHideGlobalSearch } from '../../features/ui/hooks/useHideGlobalSearch';
import { ShowcaseHero } from '../../features/showcase/components/ShowcaseHero';
import { QuickScanSummary } from '../../features/showcase/components/QuickScanSummary';
import { ArchitectureMap } from '../../features/showcase/components/ArchitectureMap';
import { InteractiveDemos } from '../../features/showcase/components/InteractiveDemos';
import { DomainShowcaseCards } from '../../features/showcase/components/DomainShowcaseCards';
import { EngineeringTradeoffs } from '../../features/showcase/components/EngineeringTradeoffs';
import { DemoAccessSection } from '../../features/showcase/components/DemoAccessSection';

const ShowcasePage: React.FC = () => {
  useHideGlobalSearch();
  const navigate = useNavigate();
  const [isQuickScan, setIsQuickScan] = useState<boolean>(false);
  const [launchTrigger, setLaunchTrigger] = useState<number>(0);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
      {/* Top Banner Navigation Bar */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1.5,
          px: { xs: 2, sm: 4 },
          bgcolor: 'background.paper',
          position: 'sticky',
          top: { xs: 56, sm: 64 },
          zIndex: 1090,
        }}
      >

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/user')}
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Back to Home
          </Button>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              component={RouterLink}
              to="/restaurants"
              variant="outlined"
              size="small"
              startIcon={<Restaurant />}
              sx={{ textTransform: 'none', fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Live Catalog
            </Button>
            <Button
              variant="contained"
              size="small"
              color={isQuickScan ? 'warning' : 'primary'}
              onClick={() => setIsQuickScan(!isQuickScan)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {isQuickScan ? 'Full Deep Dive' : '⚡ 2-Min Scan'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Container maxWidth="lg" sx={{ pt: 3 }}>
        {/* 1. Hero Section */}
        <ShowcaseHero
          isQuickScan={isQuickScan}
          onToggleQuickScan={setIsQuickScan}
          onScrollToSection={scrollToSection}
          onLaunchLiveDemo={() => setLaunchTrigger((prev) => prev + 1)}
        />

        {/* 2. Quick Scan Summary Mode (if active) */}
        {isQuickScan && (
          <QuickScanSummary
            onExploreFull={() => setIsQuickScan(false)}
            onExploreLive={() => navigate('/restaurants')}
          />
        )}

        {/* 3. Interactive Demos (Always visible or in deep-dive) */}
        <InteractiveDemos launchTrigger={launchTrigger} />

        {/* 4. Demo Account Access & Persona Exploration */}
        <DemoAccessSection />

        {/* 5. Distributed Architecture Map */}
        <ArchitectureMap />

        {/* 6. Domain Deep Dives */}
        <DomainShowcaseCards />

        {/* 7. Engineering Decisions & Trade-Offs */}
        <EngineeringTradeoffs />

        {/* 7. Bottom Navigation CTA */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Ready to explore the live application?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Experience the consumer ordering flow, filter through authentic cuisines, inspect cart synchronization, and track orders in real time.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={RouterLink}
              to="/restaurants"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Restaurant />}
              sx={{ fontWeight: 700, textTransform: 'none', px: 4 }}
            >
              Browse Restaurants
            </Button>
            <Button
              component={RouterLink}
              to="/"
              variant="outlined"
              size="large"
              sx={{ fontWeight: 700, textTransform: 'none', px: 4 }}
            >
              Return to Home
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ShowcasePage;
