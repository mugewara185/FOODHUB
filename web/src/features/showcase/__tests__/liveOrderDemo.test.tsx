import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { InteractiveDemos } from '../components/InteractiveDemos';
import { socketService } from '../../../services/socket';
import api from '../../../core/utils/api';

// Mock Leaflet Map
vi.mock('../../../shared/components/maps/Map', () => ({
  default: () => <div data-testid="mock-map">Mock Leaflet Map</div>,
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }) => state,
      orders: (state = { items: [], currentOrder: null }) => state,
      cart: (state = { items: [] }) => state,
    },
  });

const mockLaunchResponse = {
  order: {
    _id: '64e8e50f3c5f4a1b8c1a9908',
    status: 'partner_assigned',
    restaurantName: 'Showcase Spice Kitchen',
    deliveryAddress: 'Flat 402, Showcase Heights, Bangalore',
  },
  delivery: {
    _id: '64e8e50f3c5f4a1b8c1a990a',
    status: 'partner_assigned',
    distanceRemainingMeters: 650,
    etaSeconds: 95,
  },
  restaurant: {
    id: '64e8e50f3c5f4a1b8c1a9905',
    name: 'Showcase Spice Kitchen',
    location: { lat: 12.9716, lng: 77.5946 },
  },
  customer: {
    id: '64e8e50f3c5f4a1b8c1a9901',
    name: 'Showcase Customer',
    destinationLocation: { lat: 12.9866, lng: 77.6096 },
  },
  partner: {
    id: '64e8e50f3c5f4a1b8c1a9907',
    name: 'Ramesh Rider',
    currentLocation: { lat: 12.9680, lng: 77.5900 },
  },
};

describe('Showcase Interactive Live Order Demo Component', () => {
  let apiRequestSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    apiRequestSpy = vi.spyOn(api, 'request').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/dev/demo/active-order') {
        return { order: null, delivery: null, isTerminal: false } as any;
      }
      if (endpoint === '/dev/demo/launch-live-order') {
        return mockLaunchResponse as any;
      }
      if (endpoint === '/dev/demo/confirm-handoff') {
        return {
          order: { _id: '64e8e50f3c5f4a1b8c1a9908', status: 'picked_up' },
        } as any;
      }
      return {} as any;
    });
  });

  afterEach(() => {
    apiRequestSpy?.mockRestore();
  });

  it('renders initial idle state before demo launch', async () => {
    const store = createTestStore();

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
    });

    expect(screen.getByText('Server-Authoritative Live Order Demo')).toBeInTheDocument();
    expect(screen.getByText('READY TO LAUNCH')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /▶ Launch Live Order Demo/i })).toBeInTheDocument();
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
    expect(screen.getByText(/READY TO START: CLICK "LAUNCH LIVE ORDER DEMO"/i)).toBeInTheDocument();
  });

  it('launches live order demo, displays telemetry, active stage and multi-actor deep links', async () => {
    const store = createTestStore();

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
    });

    const launchButton = screen.getByRole('button', { name: /▶ Launch Live Order Demo/i });

    await act(async () => {
      fireEvent.click(launchButton);
    });

    // Verify status chip updates
    await waitFor(() => {
      expect(screen.getByText('● LIVE IN PROGRESS')).toBeInTheDocument();
    });

    // Telemetry cards check
    expect(screen.getByText('ORDER ID & STATUS')).toBeInTheDocument();
    expect(screen.getByText('Showcase Spice Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Ramesh Rider')).toBeInTheDocument();
    expect(screen.getByText('650 m')).toBeInTheDocument();
    expect(screen.getByText('2 mins')).toBeInTheDocument();

    // Verify stage text
    expect(screen.getByText(/STAGE 5 OF 9: COURIER ASSIGNED/i)).toBeInTheDocument();

    // Verify deep links to inspect synchronized multi-actor views
    expect(screen.getByText('Customer Live Tracking')).toBeInTheDocument();
    expect(screen.getByText('Merchant Kitchen View')).toBeInTheDocument();
    expect(screen.getByText('Courier Navigation View')).toBeInTheDocument();

    const customerLink = screen.getByText('Customer Live Tracking').closest('a');
    expect(customerLink).toHaveAttribute('href', expect.stringContaining('/orders/tracking/'));
    expect(customerLink).toHaveAttribute('target', '_blank');

    const ownerLink = screen.getByText('Merchant Kitchen View').closest('a');
    expect(ownerLink).toHaveAttribute('href', '/owner');

    const partnerLink = screen.getByText('Courier Navigation View').closest('a');
    expect(partnerLink).toHaveAttribute('href', '/partner/active');
  });

  it('renders kitchen handoff banner on arrived_pickup and handles handoff confirmation', async () => {
    const store = createTestStore();

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
    });

    // Launch demo first
    const launchButton = screen.getByRole('button', { name: /▶ Launch Live Order Demo/i });
    await act(async () => {
      fireEvent.click(launchButton);
    });

    await waitFor(() => {
      expect(screen.getByText('● LIVE IN PROGRESS')).toBeInTheDocument();
    });

    // Simulate socket event: arrived_pickup
    act(() => {
      (socketService as any).registeredListeners.get('delivery:status')?.forEach((cb: any) => {
        cb({
          orderId: '64e8e50f3c5f4a1b8c1a9908',
          deliveryId: '64e8e50f3c5f4a1b8c1a990a',
          status: 'arrived_pickup',
          location: { lat: 12.9716, lng: 77.5946 },
          etaSeconds: 0,
          distanceRemainingMeters: 0,
        });
      });
    });

    // Handoff banner should now be visible
    expect(screen.getByText(/Courier arrived at restaurant kitchen!/i)).toBeInTheDocument();
    const handoffButton = screen.getByRole('button', { name: /Hand Off Food Now/i });
    expect(handoffButton).toBeInTheDocument();

    // Click Hand Off Food Now
    await act(async () => {
      fireEvent.click(handoffButton);
    });

    // Simulate socket confirmation: picked_up
    act(() => {
      (socketService as any).registeredListeners.get('delivery:status')?.forEach((cb: any) => {
        cb({
          orderId: '64e8e50f3c5f4a1b8c1a9908',
          deliveryId: '64e8e50f3c5f4a1b8c1a990a',
          status: 'picked_up',
          location: { lat: 12.9720, lng: 77.5950 },
          etaSeconds: 180,
          distanceRemainingMeters: 1200,
        });
      });
    });

    // Handoff banner dismissed
    expect(screen.queryByText(/Courier arrived at restaurant kitchen!/i)).not.toBeInTheDocument();
    expect(screen.getByText(/STAGE 7 OF 9: FOOD PICKED UP/i)).toBeInTheDocument();
  });

  it('renders completion banner and elapsed metrics when order is delivered', async () => {
    const store = createTestStore();

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
    });

    // Launch demo
    const launchButton = screen.getByRole('button', { name: /▶ Launch Live Order Demo/i });
    await act(async () => {
      fireEvent.click(launchButton);
    });

    await waitFor(() => {
      expect(screen.getByText('● LIVE IN PROGRESS')).toBeInTheDocument();
    });

    // Simulate delivered event over socket
    act(() => {
      (socketService as any).registeredListeners.get('delivery:status')?.forEach((cb: any) => {
        cb({
          orderId: '64e8e50f3c5f4a1b8c1a9908',
          deliveryId: '64e8e50f3c5f4a1b8c1a990a',
          status: 'delivered',
          actualTransitMinutes: 4,
          location: { lat: 12.9866, lng: 77.6096 },
          etaSeconds: 0,
          distanceRemainingMeters: 0,
        });
      });
    });

    expect(screen.getByText(/Order Successfully Delivered!/i)).toBeInTheDocument();
    expect(screen.getByText(/Total elapsed transit time: 4 min/i)).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Another Demo/i })).toBeInTheDocument();
  });
});
