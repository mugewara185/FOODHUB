import type { Coordinates, DeliveryRoute } from '../../data/types/location';
import { getDistance, getPreciseDistance } from 'geolib';

export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  return getDistance(
    { latitude: point1.lat, longitude: point1.lng },
    { latitude: point2.lat, longitude: point2.lng }
  );
};

export const calculatePreciseDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  return getPreciseDistance(
    { latitude: point1.lat, longitude: point1.lng },
    { latitude: point2.lat, longitude: point2.lng }
  );
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} hr ${minutes} min`;
};

export const estimateDeliveryTime = (
  distance: number,
  averageSpeed: number = 30 // km/h
): number => {
  const distanceKm = distance / 1000;
  const timeHours = distanceKm / averageSpeed;
  return timeHours * 3600; // return in seconds
};

export const decodePolyline = (encoded: string): Coordinates[] => {
  const points: Coordinates[] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
};

export const getMarkerIcon = (type: string, status?: string) => {
  switch (type) {
    case 'restaurant':
      return 'https://maps.google.com/mapfiles/ms/icons/restaurant.png';
    case 'customer':
      return 'https://maps.google.com/mapfiles/ms/icons/home.png';
    case 'partner':
      if (status === 'on_delivery') {
        return 'https://maps.google.com/mapfiles/ms/icons/truck.png';
      }
      return 'https://maps.google.com/mapfiles/ms/icons/man.png';
    case 'current':
      return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    default:
      return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }
};