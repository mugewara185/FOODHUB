import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  LocationOn,
  Search,
  Clear,
  MyLocation,
  Restaurant,
  Home,
} from '@mui/icons-material';
import type { Coordinates, Location } from '../../../data/types/location';
import Map from './Map';
import { useJsApiLoader } from '@react-google-maps/api';

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
  height?: string | number;
  showMap?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  height = '500px',
  showMap = true,
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [mapCenter, setMapCenter] = useState<Coordinates>(
    initialLocation?.coordinates || { lat: 19.0760, lng: 72.8777 }
  );
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Initialize services
  React.useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Search places
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    autocompleteService.current?.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'in' },
        types: ['address', 'establishment'],
      },
      (results, status) => {
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  // Select place
  const handleSelectPlace = useCallback((placeId: string) => {
    if (!placesService.current && mapRef.current) {
      placesService.current = new google.maps.places.PlacesService(mapRef.current);
    }

    placesService.current?.getDetails(
      { placeId, fields: ['name', 'formatted_address', 'geometry'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const location: Location = {
            address: place.formatted_address || '',
            coordinates: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
            placeId,
          };
          
          setSelectedLocation(location);
          setMapCenter(location.coordinates);
          setPredictions([]);
          setSearchQuery(location.address);
          onLocationSelect(location);
        }
      }
    );
  }, [onLocationSelect]);

  // Get current location
  const handleGetCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          // Reverse geocode
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: pos }, (results, status) => {
            setLoading(false);
            if (status === 'OK' && results && results[0]) {
              const location: Location = {
                address: results[0].formatted_address,
                coordinates: pos,
                placeId: results[0].place_id,
              };
              setSelectedLocation(location);
              setMapCenter(pos);
              setSearchQuery(location.address);
              onLocationSelect(location);
            }
          });
        },
        (error) => {
          setLoading(false);
          console.error('Error getting location:', error);
        }
      );
    }
  }, [onLocationSelect]);

  return (
    <Box sx={{ height, display: 'flex', flexDirection: 'column' }}>
      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Search for an address or place"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => {
                    setSearchQuery('');
                    setPredictions([]);
                  }}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={handleGetCurrentLocation} color="primary">
            <MyLocation />
          </IconButton>
        </Box>

        {/* Search Predictions */}
        {predictions.length > 0 && (
          <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
            <List>
              {predictions.map((prediction) => (
                <ListItem
                  key={prediction.place_id}
                  button
                  onClick={() => handleSelectPlace(prediction.place_id)}
                >
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={prediction.structured_formatting.main_text}
                    secondary={prediction.structured_formatting.secondary_text}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Paper>

      {/* Map */}
      {showMap && isLoaded && (
        <Box sx={{ flex: 1, minHeight: 300, position: 'relative' }}>
          <Map
            center={mapCenter}
            markers={selectedLocation ? [
              {
                id: 'selected',
                position: selectedLocation.coordinates,
                type: 'current',
                title: 'Selected Location',
                info: selectedLocation.address,
              },
            ] : []}
            onMapClick={(e) => {
              if (e.latLng) {
                const pos = {
                  lat: e.latLng.lat(),
                  lng: e.latLng.lng(),
                };
                // Reverse geocode
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: pos }, (results, status) => {
                  if (status === 'OK' && results && results[0]) {
                    const location: Location = {
                      address: results[0].formatted_address,
                      coordinates: pos,
                      placeId: results[0].place_id,
                    };
                    setSelectedLocation(location);
                    onLocationSelect(location);
                    setSearchQuery(location.address);
                  }
                });
              }
            }}
            height="100%"
          />
        </Box>
      )}
    </Box>
  );
};

export default LocationPicker;