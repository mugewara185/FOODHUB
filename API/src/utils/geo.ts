/**
 * Centralized coordinate normalization for the Delivery domain.
 * Frontend and general systems use `{ lat, lng }` (Google Maps format).
 * Mongoose/MongoDB use `[longitude, latitude]` (GeoJSON Point format).
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

/**
 * Converts { lat, lng } to a GeoJSON Point object.
 */
export function toGeoJSON(coords: LatLng): GeoJSONPoint {
  if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    throw new Error(`Invalid LatLng provided for conversion: ${JSON.stringify(coords)}`);
  }
  return {
    type: 'Point',
    coordinates: [coords.lng, coords.lat] // GeoJSON strictly uses [longitude, latitude]
  };
}

/**
 * Converts a GeoJSON Point or raw [lng, lat] array to { lat, lng }.
 */
export function toLatLng(point: GeoJSONPoint | [number, number]): LatLng {
  const coords = Array.isArray(point) ? point : point.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) {
    throw new Error(`Invalid GeoJSON provided for conversion: ${JSON.stringify(point)}`);
  }
  return {
    lat: coords[1],
    lng: coords[0]
  };
}
