import React, { useState, useCallback } from 'react';
import { Box, TextField, Paper, List, ListItem, ListItemIcon, ListItemText, CircularProgress, IconButton, InputAdornment } from '@mui/material';
import { LocationOn, Search, Clear, MyLocation } from '@mui/icons-material';
import type { Coordinates, Location } from '../../../data/types/location';
import Map from './Map';

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
  height?: string | number;
  showMap?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialLocation, height = '500px', showMap = true }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [mapCenter, setMapCenter] = useState<Coordinates>(initialLocation?.coordinates || { lat: 19.0760, lng: 72.8777 });

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) return setPredictions([]);
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      setPredictions(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const handleSelectPlace = useCallback((prediction: any) => {
    const location: Location = { address: prediction.display_name, coordinates: { lat: parseFloat(prediction.lat), lng: parseFloat(prediction.lon) }, placeId: prediction.place_id.toString() };
    setSelectedLocation(location);
    setMapCenter(location.coordinates);
    setPredictions([]);
    setSearchQuery(location.address);
    onLocationSelect(location);
  }, [onLocationSelect]);

  return (
    <Box sx={{ height, display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth placeholder="Search for an address or place" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} size="small"
            InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>), endAdornment: searchQuery && (<InputAdornment position="end"><IconButton size="small" onClick={() => { setSearchQuery(''); setPredictions([]); }}><Clear /></IconButton></InputAdornment>) }}
          />
        </Box>
        {predictions.length > 0 && (
          <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
            <List>
              {predictions.map((p) => (
                <ListItem key={p.place_id} component="div" onClick={() => handleSelectPlace(p)} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon><LocationOn color="primary" /></ListItemIcon>
                  <ListItemText primary={p.display_name} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Paper>
      {showMap && (
        <Box sx={{ flex: 1, minHeight: 300, position: 'relative' }}>
          <Map center={mapCenter} markers={selectedLocation ? [{ id: 'selected', position: selectedLocation.coordinates, type: 'current', title: 'Selected Location', info: selectedLocation.address }] : []} height="100%" />
        </Box>
      )}
    </Box>
  );
};
export default LocationPicker;