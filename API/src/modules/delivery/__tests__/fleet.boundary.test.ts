import { toLatLng } from '../../../utils/geo';
import { describe, it, expect } from 'vitest';

describe('Fleet Boundary Mapping', () => {
  it('maps GeoJSON [lng, lat] from partner document to { lat, lng } correctly', () => {
    // This perfectly matches what GET /api/delivery/fleet uses internally
    const mockGeoJSON = {
      type: 'Point' as const,
      coordinates: [72.8777, 19.0760] as [number, number]
    };
    
    const result = toLatLng(mockGeoJSON);
    
    expect(result).toEqual({
      lat: 19.0760,
      lng: 72.8777
    });
  });
});
