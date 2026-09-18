import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Chip, Switch, FormControlLabel, Card, CardContent, Divider, Avatar, Stack, Button } from '@mui/material';
import { LocalShipping, Warning, Speed, TrendingUp, CheckCircle } from '@mui/icons-material';
import Map from '../../../shared/components/maps/Map';
import type { DeliveryPartner } from '../../../core/types';

const mockFleet: DeliveryPartner[] = [
  { id: 'DP001', name: 'Rahul S.', phone: '9876543210', vehicleType: 'bike', currentLocation: { lat: 19.0760, lng: 72.8777 }, status: 'on_delivery', rating: 4.8, completedDeliveries: 1250, lastUpdate: new Date() },
  { id: 'DP002', name: 'Amit K.', phone: '9876543211', vehicleType: 'bike', currentLocation: { lat: 19.0800, lng: 72.8800 }, status: 'online', rating: 4.5, completedDeliveries: 850, lastUpdate: new Date() },
  { id: 'DP003', name: 'Suresh M.', phone: '9876543212', vehicleType: 'bike', currentLocation: { lat: 19.0700, lng: 72.8700 }, status: 'on_delivery', rating: 4.9, completedDeliveries: 2100, lastUpdate: new Date() }
];

export default function AdminDeliveryDashboard() {
  const [fleet] = useState<DeliveryPartner[]>(mockFleet);
  const [copilotActive, setCopilotActive] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);

  const activeDeliveries = fleet.filter(p => p.status === 'on_delivery').length;
  const onlinePartners = fleet.filter(p => p.status !== 'offline').length;
  
  const markers = fleet.map(partner => ({
    id: partner.id, position: partner.currentLocation, type: 'partner',
    title: partner.name, info: `${partner.status.replace('_', ' ')} - ${partner.vehicleType}`
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Fleet Operations</Typography>
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
              <Card><CardContent><Typography variant="h6" gutterBottom>Partner Details</Typography><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography>{selectedPartner.name}</Typography><Chip size="small" label={selectedPartner.status} color={selectedPartner.status === 'on_delivery' ? 'primary' : 'success'} /></Box><Typography variant="body2" color="text.secondary">Rating: {selectedPartner.rating} ⭐</Typography><Typography variant="body2" color="text.secondary">Deliveries: {selectedPartner.completedDeliveries}</Typography><Button size="small" variant="outlined" sx={{ mt: 2 }} onClick={() => setSelectedPartner(null)}>Close</Button></CardContent></Card>
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
