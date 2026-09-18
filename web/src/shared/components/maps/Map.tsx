import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography } from '@mui/material';
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

function MapController({ center, zoom, bounds, recenterTrigger }: { center: Coordinates; zoom: number; bounds?: L.LatLngBoundsExpression; recenterTrigger?: number }) {
  const map = useMap();
  const isInitialLoad = React.useRef(true);
  
  useEffect(() => {
    if (isInitialLoad.current || recenterTrigger !== undefined) {
      if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
      else if (center) map.setView([center.lat, center.lng], zoom);
      isInitialLoad.current = false;
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
  recenterTrigger?: number; // Prop to manually trigger recenter
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
  markers = [], center = { lat: 19.0760, lng: 72.8777 }, zoom = 12, height = '400px',
  showUserLocation = false, onMarkerClick, polyline, polylines, routeCoordinates,
  recenterTrigger
}) => {
  const [userLocation, setUserLocation] = React.useState<Coordinates | null>(null);
  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }), (err) => console.error(err));
    }
  }, [showUserLocation]);

  let allRouteCoords: Coordinates[] = routeCoordinates ? [...routeCoordinates] : [];
  if (polyline) allRouteCoords = decodePolyline(polyline);

  let bounds: L.LatLngBoundsExpression | undefined = undefined;
  const pointsToBound: [number, number][] = [];
  if (allRouteCoords.length > 0) allRouteCoords.forEach(c => pointsToBound.push([c.lat, c.lng]));
  markers.forEach(m => { if (m.position) pointsToBound.push([m.position.lat, m.position.lng]); });
  if (pointsToBound.length > 1) bounds = L.latLngBounds(pointsToBound);

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <MapController center={center} zoom={zoom} bounds={bounds} recenterTrigger={recenterTrigger} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        {showUserLocation && userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={getIconForType('current')} />}
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.position.lat, marker.position.lng]} icon={getIconForType(marker.type)} eventHandlers={{ click: () => onMarkerClick && onMarkerClick(marker) }}>
            {(marker.title || marker.info) && (<Popup><Box>{marker.title && <Typography variant="subtitle2" fontWeight="bold">{marker.title}</Typography>}{marker.info && <Typography variant="body2">{marker.info}</Typography>}</Box></Popup>)}
          </Marker>
        ))}
        {allRouteCoords.length > 0 && <Polyline positions={allRouteCoords.map(c => [c.lat, c.lng])} color="#2196F3" weight={4} opacity={0.7} />}
      </MapContainer>
    </Box>
  );
};
export default Map;