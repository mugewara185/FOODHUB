import { useState } from 'react';
import { Box, Typography, Grid, Paper, Chip, Switch, FormControlLabel, Card, CardContent, Divider, Avatar, Stack, Button, CircularProgress, Alert } from '@mui/material';
import { LocalShipping, Warning, Speed, TrendingUp, CheckCircle, Wifi, SignalWifiOff } from '@mui/icons-material';
import Map from '../../../shared/components/maps/Map';
import type { DeliveryPartner } from '../../../core/types';
import { useAdminFleet } from '../../../features/admin/hooks/useAdminFleet';

export default function AdminDeliveryDashboard() {
  const { fleet, connectionStatus, loading, error } = useAdminFleet();
  const [copilotActive, setCopilotActive] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;
  }
  
  if (error) {
    return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
  }

  const activeDeliveries = fleet.filter(p => p.status === 'on_delivery').length;
  // Database returns 'available' instead of 'online' sometimes, mapping it safely
  const onlinePartners = fleet.filter(p => p.status !== 'offline').length;
  
  const markers = fleet.filter(p => p.currentLocation).map(partner => ({
    id: partner.id, position: partner.currentLocation, type: 'partner' as const,
    title: partner.name, info: `${partner.status.replace('_', ' ')} - ${partner.vehicleType}`
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_delivery': return 'primary';
      case 'assigned': return 'warning';
      case 'available':
      case 'online': return 'success';
      default: return 'default';
    }
  };

  const ConnectionIndicator = () => {
    if (connectionStatus === 'connected') return <Chip icon={<Wifi />} label="Live" color="success" size="small" />;
    if (connectionStatus === 'reconnecting') return <Chip icon={<Wifi />} label="Reconnecting..." color="warning" size="small" />;
    return <Chip icon={<SignalWifiOff />} label="Disconnected" color="error" size="small" />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" fontWeight="bold">Fleet Operations</Typography>
          <ConnectionIndicator />
        </Box>
        <FormControlLabel control={<Switch checked={copilotActive} onChange={(e) => setCopilotActive(e.target.checked)} color="primary" />} label={<Typography fontWeight="bold" color={copilotActive ? 'primary' : 'text.secondary'}>Copilot AI</Typography>} />
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}><Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}><Avatar sx={{ bgcolor: 'primary.light' }}><LocalShipping /></Avatar><Box><Typography variant="h4">{activeDeliveries}</Typography><Typography variant="body2" color="text.secondary">Active Deliveries</Typography></Box></Paper></Grid>
        <Grid item xs={12} md={3}><Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}><Avatar sx={{ bgcolor: 'success.light' }}><CheckCircle /></Avatar><Box><Typography variant="h4">{onlinePartners}</Typography><Typography variant="body2" color="text.secondary">Partners Online</Typography></Box></Paper></Grid>
        <Grid item xs={12} md={3}><Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}><Avatar sx={{ bgcolor: 'warning.light' }}><Speed /></Avatar><Box><Typography variant="h4">28m</Typography><Typography variant="body2" color="text.secondary">Avg Delivery Time</Typography></Box></Paper></Grid>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ height: 600, overflow: 'hidden', position: 'relative' }}>
             <Map center={{ lat: 19.0760, lng: 72.8777 }} zoom={13} height="100%" markers={markers} onMarkerClick={(m) => { const p = fleet.find(f => f.id === m.id); if (p) setSelectedPartner(p); }} />
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {selectedPartner && (
              <Card><CardContent><Typography variant="h6" gutterBottom>Partner Details</Typography><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography>{selectedPartner.name}</Typography><Chip size="small" label={selectedPartner.status} color={getStatusColor(selectedPartner.status)} /></Box><Typography variant="body2" color="text.secondary">Rating: {selectedPartner.rating} ⭐️</Typography><Button size="small" variant="outlined" sx={{ mt: 2 }} onClick={() => setSelectedPartner(null)}>Close</Button></CardContent></Card>
            )}
            {copilotActive && (
              <Card sx={{ border: '1px solid', borderColor: 'primary.main', bgcolor: 'primary.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><Speed color="primary" /><Typography variant="h6" color="primary.dark">Fleet Copilot</Typography></Box>
                  <Box sx={{ mb: 2 }}><Typography variant="body2" fontWeight="bold" gutterBottom><Warning sx={{ fontSize: 16, verticalAlign: 'text-bottom', color: 'warning.main', mr: 0.5 }} />High Demand Zone Detected</Typography><Typography variant="body2" color="text.secondary">Bandra West is experiencing 40% higher volume. Recommending +₹20 surge pricing to attract partners.</Typography></Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ mt: 2 }}><Typography variant="body2" fontWeight="bold" gutterBottom><TrendingUp sx={{ fontSize: 16, verticalAlign: 'text-bottom', color: 'success.main', mr: 0.5 }} />Route Optimization</Typography><Typography variant="body2" color="text.secondary">Batching 3 orders from Andheri East can save 12 minutes of fleet time.</Typography></Box>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
