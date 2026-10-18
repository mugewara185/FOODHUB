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

/**
 * DEMO: straight-line estimate, not road-network ETA.
 */
export const estimateStraightLineETA = (
  point1: Coordinates,
  point2: Coordinates,
  averageSpeed: number = 30 // km/h
): number => {
  const dist = calculateDistance(point1, point2);
  return estimateDeliveryTime(dist, averageSpeed);
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

const routeCache = new Map<string, Coordinates[]>();

/**
 * Optional, bounded road route fetcher.
 * Uses a strict timeout (default 3s). If OSRM is unreachable, offline, or times out,
 * it safely and immediately returns the straight-line fallback without blocking.
 */
export const fetchRoadRoute = async (
  start: Coordinates,
  end: Coordinates,
  timeoutMs: number = 3000
): Promise<{ coordinates: Coordinates[]; isRoadRoute: boolean }> => {
  if (!start || !end || typeof start.lat !== 'number' || typeof end.lat !== 'number') {
    return { coordinates: [], isRoadRoute: false };
  }

  const fallback: Coordinates[] = [start, end];
  const cacheKey = `${start.lat.toFixed(4)},${start.lng.toFixed(4)};${end.lat.toFixed(4)},${end.lng.toFixed(4)}`;

  if (routeCache.has(cacheKey)) {
    return { coordinates: routeCache.get(cacheKey)!, isRoadRoute: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return { coordinates: fallback, isRoadRoute: false };
    }

    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]?.geometry?.coordinates?.length > 1) {
      const roadCoords: Coordinates[] = data.routes[0].geometry.coordinates.map(
        (c: [number, number]) => ({ lat: c[1], lng: c[0] })
      );
      routeCache.set(cacheKey, roadCoords);
      return { coordinates: roadCoords, isRoadRoute: true };
    }
    return { coordinates: fallback, isRoadRoute: false };
  } catch {
    clearTimeout(timer);
    return { coordinates: fallback, isRoadRoute: false };
  }
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

/**
 * Smooths the remaining route by connecting the courier's live position
 * to upcoming route waypoints without requiring full network rerouting.
 * Discards traversed waypoints ahead of the courier.
 */
export const smoothRouteOrigin = (
  prevCoords: Coordinates[],
  currentPos: Coordinates
): Coordinates[] => {
  if (!isValidCoord(currentPos)) {
    return prevCoords || [];
  }
  if (!prevCoords || prevCoords.length === 0) {
    return [currentPos];
  }
  if (prevCoords.length === 1) {
    return [currentPos, prevCoords[0]];
  }
  if (prevCoords.length === 2) {
    return [currentPos, prevCoords[1]];
  }

  let closestIdx = 0;
  let minDist = Infinity;
  const searchLimit = Math.min(prevCoords.length - 1, 15);
  for (let i = 0; i < searchLimit; i++) {
    const pt = prevCoords[i];
    if (isValidCoord(pt)) {
      const d = calculateDistance(currentPos, pt);
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    }
  }

  const remainder = prevCoords.slice(closestIdx + 1);
  if (remainder.length > 0) {
    return [currentPos, ...remainder];
  }
  return [currentPos, prevCoords[prevCoords.length - 1]];
};