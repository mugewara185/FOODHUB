import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  Polyline,
  DirectionsRenderer,
  useJsApiLoader,
} from '@react-google-maps/api';
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  IconButton,
} from '@mui/material';
import {
  MyLocation,
  ZoomIn,
  ZoomOut,
  Fullscreen,
} from '@mui/icons-material';
import type { Coordinates, MapMarker } from '../../../data/types/location';
import { getMarkerIcon } from '../../../core/utils/location';

interface MapProps {
  markers?: MapMarker[];
  center?: Coordinates;
  zoom?: number;
  height?: string | number;
  showTraffic?: boolean;
  showUserLocation?: boolean;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  directions?: google.maps.DirectionsResult;
  polyline?: string;
  polylines?: string[];
}

const defaultCenter: Coordinates = {
  lat: 19.0760, // Mumbai
  lng: 72.8777,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  clickableIcons: true,
  scrollwheel: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  zoomControl: false,
};

const decodePolyline = (encoded: string): google.maps.LatLngLiteral[] => {
  const points: google.maps.LatLngLiteral[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
};

const Map: React.FC<MapProps> = ({
  markers = [],
  center = defaultCenter,
  zoom = 12,
  height = '400px',
  showTraffic = false,
  showUserLocation = false,
  onMapClick,
  onMarkerClick,
  directions,
  polyline,
  polylines,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'script-loader',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Handle user location
  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(pos);
          mapRef.current?.panTo(pos);
        },
        () => {
          console.error('Error getting user location');
        }
      );
    }
  }, [showUserLocation]);

  // Handle traffic layer
  useEffect(() => {
    if (isLoaded && mapRef.current) {
      if (showTraffic) {
        if (!trafficLayer) {
          const newTrafficLayer = new google.maps.TrafficLayer();
          newTrafficLayer.setMap(mapRef.current);
          setTrafficLayer(newTrafficLayer);
        }
      } else {
        trafficLayer?.setMap(null);
        setTrafficLayer(null);
      }
    }
  }, [isLoaded, showTraffic, trafficLayer]);

  // Decode and draw polylines without requiring the geometry library
  const decodedPolylines = polylines?.map((polyline) => decodePolyline(polyline));

  if (loadError) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', height }}>
        <Typography color="error">Error loading maps</Typography>
      </Paper>
    );
  }

  if (!isLoaded) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative', height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
        onClick={onMapClick}
      >
        {/* User location marker */}
        {showUserLocation && userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: getMarkerIcon('current'),
              scaledSize: new google.maps.Size(40, 40),
            }}
          />
        )}

        {/* Regular markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.title}
            icon={{
              url: getMarkerIcon(marker.type),
              scaledSize: new google.maps.Size(40, 40),
            }}
            onClick={() => {
              setSelectedMarker(marker);
              onMarkerClick?.(marker);
            }}
          />
        ))}

        {/* Selected marker info window */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {selectedMarker.title}
              </Typography>
              {selectedMarker.info && (
                <Typography variant="body2">
                  {selectedMarker.info}
                </Typography>
              )}
            </Box>
          </InfoWindow>
        )}

        {/* Directions */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: '#FF6B35',
                strokeWeight: 5,
              },
              suppressMarkers: true,
            }}
          />
        )}

        {/* Polylines */}
        {decodedPolylines?.map((path, index) => (
          <Polyline
            key={index}
            path={path}
            options={{
              strokeColor: '#FF6B35',
              strokeOpacity: 0.8,
              strokeWeight: 4,
              icons: [
                {
                  icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                  offset: '100%',
                },
              ],
            }}
          />
        ))}

        {/* Single polyline */}
        {polyline && (
          <Polyline
            path={decodePolyline(polyline)}
            options={{
              strokeColor: '#2196F3',
              strokeOpacity: 0.6,
              strokeWeight: 4,
            }}
          />
        )}
      </GoogleMap>

      {/* Map Controls */}
      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
        <Paper sx={{ display: 'flex', flexDirection: 'column' }}>
          <IconButton onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 12) + 1)}>
            <ZoomIn />
          </IconButton>
          <IconButton onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 12) - 1)}>
            <ZoomOut />
          </IconButton>
          <IconButton onClick={() => mapRef.current?.setCenter(center)}>
            <MyLocation />
          </IconButton>
          <IconButton onClick={() => mapRef.current?.setMapTypeId(mapRef.current?.getMapTypeId() === 'satellite' ? 'roadmap' : 'satellite')}>
            <Fullscreen />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );
};

export default Map;