import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip } from '@mui/material';
import type { Coordinates, MapMarker } from '../../../data/types/location';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const decodePolyline = (encoded: string): Coordinates[] => {
  const points: Coordinates[] = [];
  let index = 0, lat = 0, lng = 0;
  const len = encoded.length;
  while (index < len) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
};

function MapController({
  center,
  zoom,
  bounds,
  recenterTrigger
}: {
  center: Coordinates;
  zoom: number;
  bounds?: L.LatLngBoundsExpression;
  recenterTrigger?: number;
}) {
  const map = useMap();
  const isInitialLoad = React.useRef(true);
  const prevRecenterTrigger = React.useRef(recenterTrigger);

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (isInitialLoad.current) {
      if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else if (center && center.lat && center.lng) {
        map.setView([center.lat, center.lng], zoom);
      }
      isInitialLoad.current = false;
      return;
    }

    if (recenterTrigger !== undefined && recenterTrigger !== prevRecenterTrigger.current) {
      prevRecenterTrigger.current = recenterTrigger;
      if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else if (center && center.lat && center.lng) {
        map.setView([center.lat, center.lng], zoom);
      }
    }
  }, [recenterTrigger, bounds, map, center, zoom]);

  return null;
}

export interface MapProps {
  markers?: MapMarker[];
  center?: Coordinates;
  zoom?: number;
  height?: string | number;
  showTraffic?: boolean;
  showUserLocation?: boolean;
  onMapClick?: (e: any) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  directions?: any;
  polyline?: string;
  polylines?: string[];
  routeCoordinates?: Coordinates[];
  recenterTrigger?: number;
  isFallbackRoute?: boolean;
  routeStatus?: 'road' | 'direct' | 'none';
}

const getIconForType = (type: string) => {
  let url = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
  if (type === 'restaurant') url = 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png';
  else if (type === 'customer') url = 'https://cdn-icons-png.flaticon.com/512/25/25694.png';
  else if (type === 'partner') url = 'https://cdn-icons-png.flaticon.com/512/3209/3209865.png';
  else if (type === 'current') url = 'https://cdn-icons-png.flaticon.com/512/1008/1008928.png';
  return new L.Icon({ iconUrl: url, iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -38] });
};

const Map: React.FC<MapProps> = ({
  markers = [],
  center = { lat: 19.0760, lng: 72.8777 },
  zoom = 13,
  height = '400px',
  showUserLocation = false,
  onMarkerClick,
  polyline,
  routeCoordinates,
  recenterTrigger,
  isFallbackRoute = false,
  routeStatus
}) => {
  const [userLocation, setUserLocation] = React.useState<Coordinates | null>(null);

  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (err) => console.error(err)
      );
    }
  }, [showUserLocation]);

  let allRouteCoords: Coordinates[] = routeCoordinates ? [...routeCoordinates] : [];
  if (polyline) allRouteCoords = decodePolyline(polyline);

  let bounds: L.LatLngBoundsExpression | undefined = undefined;
  const pointsToBound: [number, number][] = [];
  if (allRouteCoords.length > 0) {
    allRouteCoords.forEach(c => {
      if (c && typeof c.lat === 'number' && typeof c.lng === 'number' && (c.lat !== 0 || c.lng !== 0)) {
        pointsToBound.push([c.lat, c.lng]);
      }
    });
  }
  markers.forEach(m => {
    if (m.position && typeof m.position.lat === 'number' && typeof m.position.lng === 'number' && (m.position.lat !== 0 || m.position.lng !== 0)) {
      pointsToBound.push([m.position.lat, m.position.lng]);
    }
  });
  if (pointsToBound.length > 1) {
    bounds = L.latLngBounds(pointsToBound);
  }

  const safeCenter = (center && typeof center.lat === 'number' && typeof center.lng === 'number')
    ? center
    : { lat: 12.9716, lng: 77.5946 };

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      <MapContainer
        center={[safeCenter.lat, safeCenter.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <MapController center={safeCenter} zoom={zoom} bounds={bounds} recenterTrigger={recenterTrigger} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showUserLocation && userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={getIconForType('current')} />
        )}
        {markers.map((marker) => {
          if (!marker.position || (marker.position.lat === 0 && marker.position.lng === 0)) return null;
          return (
            <Marker
              key={marker.id}
              position={[marker.position.lat, marker.position.lng]}
              icon={getIconForType(marker.type)}
              eventHandlers={{ click: () => onMarkerClick && onMarkerClick(marker) }}
            >
              {(marker.title || marker.info) && (
                <Popup>
                  <Box>
                    {marker.title && <Typography variant="subtitle2" fontWeight="bold">{marker.title}</Typography>}
                    {marker.info && <Typography variant="body2">{marker.info}</Typography>}
                  </Box>
                </Popup>
              )}
            </Marker>
          );
        })}
        {allRouteCoords.length > 1 && (
          <Polyline
            positions={allRouteCoords.map(c => [c.lat, c.lng])}
            color={isFallbackRoute ? "#ff9800" : "#2196F3"}
            dashArray={isFallbackRoute ? "8, 8" : undefined}
            weight={isFallbackRoute ? 3 : 5}
            opacity={0.85}
          />
        )}
      </MapContainer>

      {routeStatus && routeStatus !== 'none' && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, pointerEvents: 'none' }}>
          <Chip
            size="small"
            label={routeStatus === 'road' ? 'Road Route Active' : 'Direct Path (Road Routing Offline)'}
            color={routeStatus === 'road' ? 'primary' : 'warning'}
            variant="filled"
            sx={{ fontWeight: 600, boxShadow: 1 }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Map;