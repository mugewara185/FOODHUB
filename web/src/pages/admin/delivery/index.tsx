import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CircularProgress,
  Button
} from '@mui/material';
import {
  LocalShipping,
  Warning,
  CheckCircle,
  AccessTime,
  GpsFixed,
  SmartToy
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { socketService } from '../../../services/socket';
import { api } from '../../../core/utils/api';
import { formatDuration } from '../../../core/utils/location';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const partnerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3209/3209865.png',
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

const alertIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1008/1008928.png',
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

function MapFocus({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function AdminDeliveryDashboard() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedLocation, setFocusedLocation] = useState<[number, number] | null>(null);
  
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);

  useEffect(() => {
    fetchFleetData();

    socketService.connect('admin_user', 'admin');
    socketService.joinAdminFleet();

    socketService.onAdminFleetEvent('delivery:location', (data: any) => {
      setDeliveries(prev => {
        const idx = prev.findIndex(d => d._id === data.deliveryId);
        if (idx === -1) {
          // If not in list, fetch it
          fetchFleetData();
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { 
          ...updated[idx], 
          currentLocation: { type: 'Point', coordinates: [data.location.lng, data.location.lat] },
          etaSeconds: data.etaSeconds,
          distanceRemainingMeters: data.distanceRemainingMeters,
          status: data.status || updated[idx].status
        };
        return updated;
      });
    });

    socketService.onAdminFleetEvent('delivery:status', (data: any) => {
      setDeliveries(prev => {
        const idx = prev.findIndex(d => d._id === data.deliveryId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], status: data.status };
        return updated;
      });
    });

    socketService.onAdminFleetEvent('delivery:risk', (risk: any) => {
      setRisks(prev => {
        const idx = prev.findIndex(r => r.deliveryId === risk.deliveryId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = risk;
          return updated;
        }
        return [...prev, risk];
      });
    });

    socketService.onAdminFleetEvent('delivery:risk_cleared', (data: any) => {
      setRisks(prev => prev.filter(r => r.deliveryId !== data.deliveryId));
    });

    return () => {
      socketService.leaveAdminFleet();
    };
  }, []);

  const fetchFleetData = async () => {
    try {
      const res = await api.get('/admin/delivery/fleet');
      if (res.success) {
        setDeliveries(res.data.activeDeliveries || []);
        setPartners(res.data.partners || []);
        setRisks(res.data.risks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const askCopilot = async (question: string, deliveryId?: string) => {
    setCopilotLoading(true);
    setCopilotResponse(null);
    try {
      const res = await api.post('/admin/delivery/copilot', { question, deliveryId });
      if (res.success) {
        setCopilotResponse(res.data.answer);
      }
    } catch (err) {
      console.error(err);
      setCopilotResponse("Error communicating with AI Copilot.");
    } finally {
      setCopilotLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const activeCount = deliveries.filter(d => !['delivered', 'cancelled'].includes(d.status)).length;
  const availablePartners = partners.filter(p => p.status === 'available').length;
  const delayedCount = risks.filter(r => r.severity === 'high' || r.severity === 'critical').length;
  
  // Calculate average ETA of active ones
  const activeWithEta = deliveries.filter(d => d.etaSeconds && !['delivered', 'cancelled'].includes(d.status));
  const avgEta = activeWithEta.length > 0 
    ? activeWithEta.reduce((sum, d) => sum + d.etaSeconds, 0) / activeWithEta.length 
    : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Live Fleet Operations
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Deliveries</Typography>
              <Typography variant="h4">{activeCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Available Partners</Typography>
              <Typography variant="h4">{availablePartners}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Delayed / At Risk</Typography>
              <Typography variant="h4" color={delayedCount > 0 ? "error" : "inherit"}>{delayedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Average ETA</Typography>
              <Typography variant="h4">{avgEta > 0 ? formatDuration(avgEta) : '--'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Copilot Area */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
          <SmartToy />
          <Typography variant="h6">FoodHub Operations Copilot</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" color="secondary" onClick={() => askCopilot("Which delivery needs attention?")} disabled={copilotLoading}>
            Which delivery needs attention?
          </Button>
          <Button variant="contained" color="secondary" onClick={() => askCopilot("Summarize the current fleet status.")} disabled={copilotLoading}>
            Summarize fleet status
          </Button>
        </Box>
        {copilotLoading && <CircularProgress size={24} color="inherit" />}
        {copilotResponse && (
          <Paper sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
            <Typography variant="body1">{copilotResponse}</Typography>
          </Paper>
        )}
      </Paper>

      {/* Risks Area */}
      {risks.length > 0 && (
        <Box mb={3}>
          {risks.map(risk => (
            <Alert severity={risk.severity === 'high' || risk.severity === 'critical' ? 'error' : 'warning'} key={risk.deliveryId} sx={{ mb: 1 }}>
              <AlertTitle>Risk Detected: {risk.type.replace('_', ' ').toUpperCase()}</AlertTitle>
              {risk.humanTemplate}
              <Box mt={1}>
                <Button size="small" variant="outlined" color="inherit" onClick={() => askCopilot(`Why is order ${risk.orderId} delayed?`, risk.deliveryId)} disabled={copilotLoading}>
                  Explain with Copilot
                </Button>
                <Button size="small" sx={{ ml: 1 }} onClick={() => {
                  const d = deliveries.find(d => d._id === risk.deliveryId);
                  if (d && d.currentLocation) {
                    setFocusedLocation([d.currentLocation.coordinates[1], d.currentLocation.coordinates[0]]);
                  }
                }}>
                  Locate
                </Button>
              </Box>
            </Alert>
          ))}
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Map */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ height: 500, borderRadius: 2, overflow: 'hidden' }}>
            <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <MapFocus center={focusedLocation} />
              
              {deliveries.filter(d => d.currentLocation).map(d => {
                const partner = partners.find(p => p._id === d.partnerId);
                const isRisk = risks.some(r => r.deliveryId === d._id);
                return (
                  <Marker 
                    key={d._id} 
                    position={[d.currentLocation.coordinates[1], d.currentLocation.coordinates[0]]}
                    icon={isRisk ? alertIcon : partnerIcon}
                  >
                    <Popup>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">Order {d.orderId.substring(0, 8)}</Typography>
                        <Typography variant="body2">Partner: {partner?.name || 'Unknown'}</Typography>
                        <Typography variant="body2">Vehicle: {partner?.vehicle}</Typography>
                        <Typography variant="body2">Rating: {partner?.rating} ⭐</Typography>
                        <Typography variant="body2">Status: {d.status.replace('_', ' ')}</Typography>
                        <Typography variant="body2">ETA: {d.etaSeconds ? formatDuration(d.etaSeconds) : '--'}</Typography>
                        <Typography variant="body2">Distance: {d.distanceRemainingMeters ? Math.round(d.distanceRemainingMeters) + 'm' : '--'}</Typography>
                      </Box>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </Paper>
        </Grid>

        {/* Table */}
        <Grid item xs={12} md={5}>
          <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Partner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>ETA</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliveries.map(d => {
                  const partner = partners.find(p => p._id === d.partnerId);
                  const isRisk = risks.some(r => r.deliveryId === d._id);
                  return (
                    <TableRow key={d._id} sx={{ bgcolor: isRisk ? 'error.light' : 'inherit' }}>
                      <TableCell>{d.orderId.substring(0, 8)}</TableCell>
                      <TableCell>{partner?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={d.status.replace(/_/g, ' ')} />
                      </TableCell>
                      <TableCell>{d.etaSeconds ? formatDuration(d.etaSeconds) : '--'}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => {
                          if (d.currentLocation) {
                            setFocusedLocation([d.currentLocation.coordinates[1], d.currentLocation.coordinates[0]]);
                          }
                        }}>
                          <GpsFixed />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {deliveries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No active deliveries</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
