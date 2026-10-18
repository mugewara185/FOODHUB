import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip, Stack } from '@mui/material';
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

export const isValidCoord = (c: any): c is Coordinates => {
  return (
    c !== null &&
    typeof c === 'object' &&
    typeof c.lat === 'number' &&
    typeof c.lng === 'number' &&
    !isNaN(c.lat) &&
    !isNaN(c.lng) &&
    c.lat >= -90 &&
    c.lat <= 90 &&
    c.lng >= -180 &&
    c.lng <= 180 &&
    (c.lat !== 0 || c.lng !== 0)
  );
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
  travelledCoordinates?: Coordinates[];
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
  travelledCoordinates,
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

  const validTravelledCoords: Coordinates[] = (travelledCoordinates || []).filter(isValidCoord);

  let rawRouteCoords: Coordinates[] = routeCoordinates ? [...routeCoordinates] : [];
  if (polyline) {
    try {
      rawRouteCoords = decodePolyline(polyline);
    } catch {
      rawRouteCoords = [];
    }
  }
  const validRouteCoords: Coordinates[] = rawRouteCoords.filter(isValidCoord);

  let bounds: L.LatLngBoundsExpression | undefined = undefined;
  const pointsToBound: [number, number][] = [];
  validTravelledCoords.forEach(c => pointsToBound.push([c.lat, c.lng]));
  validRouteCoords.forEach(c => pointsToBound.push([c.lat, c.lng]));
  markers.forEach(m => {
    if (m.position && isValidCoord(m.position)) {
      pointsToBound.push([m.position.lat, m.position.lng]);
    }
  });
  if (pointsToBound.length > 1) {
    bounds = L.latLngBounds(pointsToBound);
  }

  const safeCenter = (center && isValidCoord(center))
    ? center
    : { lat: 12.9716, lng: 77.5946 };

  const isDirectFallback = isFallbackRoute || routeStatus === 'direct';

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
          if (!marker.position || !isValidCoord(marker.position)) return null;
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

        {/* Travelled Trail: Solid blue line indicating path already covered by the courier */}
        {validTravelledCoords.length > 1 && (
          <Polyline
            positions={validTravelledCoords.map(c => [c.lat, c.lng])}
            color="#1976D2"
            weight={5}
            opacity={0.9}
          />
        )}

        {/* Remaining Planned Route: Visually distinct from travelled trail (dashed indigo/slate for road, dashed orange for direct fallback) */}
        {validRouteCoords.length > 1 && (
          <Polyline
            positions={validRouteCoords.map(c => [c.lat, c.lng])}
            color={isDirectFallback ? "#ff9800" : "#5C6BC0"}
            dashArray={isDirectFallback ? "8, 8" : "6, 6"}
            weight={isDirectFallback ? 3 : 4}
            opacity={0.85}
          />
        )}
      </MapContainer>

      {((validTravelledCoords.length > 1) || (routeStatus && routeStatus !== 'none')) && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, pointerEvents: 'none' }}>
          <Stack direction="row" spacing={1}>
            {validTravelledCoords.length > 1 && (
              <Chip
                size="small"
                label="Travelled Trail"
                sx={{ bgcolor: '#1976D2', color: '#fff', fontWeight: 600, boxShadow: 1 }}
              />
            )}
            {routeStatus && routeStatus !== 'none' && (
              <Chip
                size="small"
                label={routeStatus === 'road' ? 'Road Route Active' : 'Direct Path (Road Routing Offline)'}
                color={routeStatus === 'road' ? 'primary' : 'warning'}
                variant="filled"
                sx={{ fontWeight: 600, boxShadow: 1 }}
              />
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default Map;