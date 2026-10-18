import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Map, { decodePolyline, isValidCoord } from '../Map';
import type { Coordinates, MapMarker } from '../../../../data/types/location';

// Mock Leaflet and React-Leaflet to isolate coordinate & polyline logic
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }: any) => (
    <div data-testid="map-marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="map-popup">{children}</div>,
  Polyline: ({ positions, color, dashArray, weight, opacity }: any) => (
    <div
      data-testid="map-polyline"
      data-color={color}
      data-dasharray={dashArray || 'solid'}
      data-weight={weight}
      data-opacity={opacity}
      data-positions={JSON.stringify(positions)}
    />
  ),
  useMap: () => ({
    invalidateSize: vi.fn(),
    setView: vi.fn(),
    fitBounds: vi.fn(),
  }),
}));

vi.mock('leaflet', () => {
  const Icon = vi.fn();
  (Icon as any).Default = {
    prototype: {},
    mergeOptions: vi.fn(),
  };
  return {
    default: {
      Icon,
      latLngBounds: vi.fn((points) => points),
    },
    Icon,
    latLngBounds: vi.fn((points) => points),
  };
});

describe('Map Component: Route Refinement & Travelled Trail Invariants', () => {
  const mockTravelledTrail: Coordinates[] = [
    { lat: 12.9716, lng: 77.5946 },
    { lat: 12.9725, lng: 77.5955 },
    { lat: 12.9735, lng: 77.5965 },
  ];

  const mockRemainingRoadRoute: Coordinates[] = [
    { lat: 12.9735, lng: 77.5965 },
    { lat: 12.9750, lng: 77.5980 },
    { lat: 12.9780, lng: 77.6010 },
  ];

  const mockDirectFallbackRoute: Coordinates[] = [
    { lat: 12.9716, lng: 77.5946 },
    { lat: 12.9780, lng: 77.6010 },
  ];

  it('1. Renders travelled courier trail as solid blue line (#1976D2, weight 5, no dash)', () => {
    render(
      <Map
        travelledCoordinates={mockTravelledTrail}
        center={{ lat: 12.9716, lng: 77.5946 }}
      />
    );

    const polylines = screen.getAllByTestId('map-polyline');
    expect(polylines).toHaveLength(1);

    const trailLine = polylines[0];
    expect(trailLine).toHaveAttribute('data-color', '#1976D2');
    expect(trailLine).toHaveAttribute('data-dasharray', 'solid');
    expect(trailLine).toHaveAttribute('data-weight', '5');
    expect(trailLine).toHaveAttribute('data-opacity', '0.9');

    // Truthful status chip for travelled trail is displayed
    expect(screen.getByText('Travelled Trail')).toBeInTheDocument();
  });

  it('2. Renders remaining road route with visually distinct dashed styling (#5C6BC0, dash 6,6)', () => {
    render(
      <Map
        routeCoordinates={mockRemainingRoadRoute}
        isFallbackRoute={false}
        routeStatus="road"
        center={{ lat: 12.9716, lng: 77.5946 }}
      />
    );

    const polylines = screen.getAllByTestId('map-polyline');
    expect(polylines).toHaveLength(1);

    const routeLine = polylines[0];
    expect(routeLine).toHaveAttribute('data-color', '#5C6BC0');
    expect(routeLine).toHaveAttribute('data-dasharray', '6, 6');
    expect(routeLine).toHaveAttribute('data-weight', '4');

    expect(screen.getByText('Road Route Active')).toBeInTheDocument();
  });

  it('3. Renders truthful direct fallback as orange dashed line (#ff9800, dash 8,8) when routing offline', () => {
    render(
      <Map
        routeCoordinates={mockDirectFallbackRoute}
        isFallbackRoute={true}
        routeStatus="direct"
        center={{ lat: 12.9716, lng: 77.5946 }}
      />
    );

    const polylines = screen.getAllByTestId('map-polyline');
    expect(polylines).toHaveLength(1);

    const fallbackLine = polylines[0];
    expect(fallbackLine).toHaveAttribute('data-color', '#ff9800');
    expect(fallbackLine).toHaveAttribute('data-dasharray', '8, 8');
    expect(fallbackLine).toHaveAttribute('data-weight', '3');

    // Must truthfully indicate offline fallback rather than falsely claiming road routing
    expect(screen.getByText('Direct Path (Road Routing Offline)')).toBeInTheDocument();
    expect(screen.queryByText('Road Route Active')).not.toBeInTheDocument();
  });

  it('4. Concurrently renders both solid blue travelled trail and dashed remaining route without collision', () => {
    render(
      <Map
        travelledCoordinates={mockTravelledTrail}
        routeCoordinates={mockRemainingRoadRoute}
        routeStatus="road"
        isFallbackRoute={false}
        center={{ lat: 12.9716, lng: 77.5946 }}
      />
    );

    const polylines = screen.getAllByTestId('map-polyline');
    expect(polylines).toHaveLength(2);

    const [trailLine, routeLine] = polylines;
    expect(trailLine).toHaveAttribute('data-color', '#1976D2');
    expect(trailLine).toHaveAttribute('data-dasharray', 'solid');

    expect(routeLine).toHaveAttribute('data-color', '#5C6BC0');
    expect(routeLine).toHaveAttribute('data-dasharray', '6, 6');

    // Both status chips are present and distinguishable
    expect(screen.getByText('Travelled Trail')).toBeInTheDocument();
    expect(screen.getByText('Road Route Active')).toBeInTheDocument();
  });

  it('5. Safe fallback: malformed coordinates, NaNs, and single-point arrays do not crash or produce invalid polylines', () => {
    const malformedCoords: any[] = [
      null,
      undefined,
      { lat: NaN, lng: 77.59 },
      { lat: 12.97, lng: NaN },
      { lat: 0, lng: 0 },
      { lat: 999, lng: 77.59 }, // out of range
      { lat: 12.9716, lng: 77.5946 }, // only 1 valid point
    ];

    render(
      <Map
        travelledCoordinates={malformedCoords}
        routeCoordinates={[]}
        center={{ lat: NaN, lng: NaN } as any}
      />
    );

    // No polyline rendered when fewer than 2 valid coordinates exist
    expect(screen.queryByTestId('map-polyline')).not.toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('6. isValidCoord utility function correctly discriminates valid geographic coordinates', () => {
    expect(isValidCoord({ lat: 12.9716, lng: 77.5946 })).toBe(true);
    expect(isValidCoord({ lat: -34.6037, lng: -58.3816 })).toBe(true);
    expect(isValidCoord(null)).toBe(false);
    expect(isValidCoord(undefined)).toBe(false);
    expect(isValidCoord({ lat: 0, lng: 0 })).toBe(false);
    expect(isValidCoord({ lat: NaN, lng: 77.59 })).toBe(false);
    expect(isValidCoord({ lat: 91, lng: 77.59 })).toBe(false);
    expect(isValidCoord({ lat: 12.97, lng: 181 })).toBe(false);
    expect(isValidCoord('not an object')).toBe(false);
  });

  it('7. decodePolyline correctly decodes Google Encoded Polyline algorithm', () => {
    // Encodes: (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const decoded = decodePolyline(encoded);
    expect(decoded.length).toBe(3);
    expect(decoded[0].lat).toBeCloseTo(38.5, 3);
    expect(decoded[0].lng).toBeCloseTo(-120.2, 3);
  });
});
