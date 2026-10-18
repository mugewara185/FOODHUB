import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { InteractiveDemos } from '../components/InteractiveDemos';
import { socketService } from '../../../services/socket';
import api from '../../../core/utils/api';
import ActiveDelivery from '../../../pages/_deliveryPartner/ActiveDelivery';
import deliveryPartnerReducer from '../../deliveryPartner/deliveryPartnerSlice';

// Mock Leaflet Map
vi.mock('../../../shared/components/maps/Map', () => ({
  default: () => <div data-testid="mock-leaflet-map">Mock Map</div>,
}));

const createShowcaseStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }) => state,
      orders: (state = { items: [], currentOrder: null }) => state,
      cart: (state = { items: [] }) => state,
    },
  });

const createPartnerStore = (initialAssignment: any = null) =>
  configureStore({
    reducer: {
      deliveryPartner: deliveryPartnerReducer,
      auth: (state = { user: { id: 'partner-user-1' } }) => state,
    },
    preloadedState: {
      deliveryPartner: {
        activeAssignment: initialAssignment,
        isLoading: false,
        partnerState: null,
        currentLocation: null,
      } as any,
    },
  });

describe('Phase 15: Showcase & Partner Recovery Synchronization Regression Tests', () => {
  let apiRequestSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    apiRequestSpy?.mockRestore();
    (socketService as any).connectionChangeListeners?.clear();
  });

  it('1. Showcase page fetches active demo state on initial load and renders in-progress stage', async () => {
    apiRequestSpy = vi.spyOn(api, 'request').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/dev/demo/active-order') {
        return {
          order: {
            _id: 'ord-active-123',
            status: 'partner_assigned',
            restaurantName: 'Auto Active Diner',
            deliveryAddress: '123 Showcase Way',
          },
          delivery: {
            _id: 'del-active-123',
            status: 'partner_assigned',
            distanceRemainingMeters: 800,
            etaSeconds: 110,
            currentLocation: { coordinates: [77.5900, 12.9680] },
          },
          isTerminal: false,
        } as any;
      }
      return {} as any;
    });

    const store = createShowcaseStore();

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
    });

    // Verify initial load fetch was performed
    expect(apiRequestSpy).toHaveBeenCalledWith('/dev/demo/active-order');

    // Telemetry and active status should immediately render
    await waitFor(() => {
      expect(screen.getByText('● LIVE IN PROGRESS')).toBeInTheDocument();
      expect(screen.getByText(/STAGE 5 OF 9: COURIER ASSIGNED/i)).toBeInTheDocument();
      expect(screen.getByText('Auto Active Diner')).toBeInTheDocument();
      expect(screen.getByText('800 m')).toBeInTheDocument();
    });
  });

  it('2. An existing eligible demo progresses beyond Step 5 when authoritative updates arrive', async () => {
    apiRequestSpy = vi.spyOn(api, 'request').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/dev/demo/active-order') {
        return {
          order: {
            _id: 'ord-active-456',
            status: 'partner_assigned',
            restaurantName: 'Express Bistro',
          },
          delivery: {
            _id: 'del-active-456',
            status: 'partner_assigned',
            distanceRemainingMeters: 500,
            etaSeconds: 70,
            currentLocation: { coordinates: [77.5900, 12.9680] },
          },
          isTerminal: false,
        } as any;
      }
      return {} as any;
    });

    const store = createShowcaseStore();

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/STAGE 5 OF 9: COURIER ASSIGNED/i)).toBeInTheDocument();
    });

    // Authoritative socket event arrives: picked_up (Stage 7)
    act(() => {
      (socketService as any).registeredListeners?.get('delivery:status')?.forEach((cb: any) => {
        cb({
          orderId: 'ord-active-456',
          deliveryId: 'del-active-456',
          status: 'picked_up',
          location: { lat: 12.9720, lng: 77.5950 },
          etaSeconds: 150,
          distanceRemainingMeters: 900,
        });
      });
    });

    // Must progress to Stage 7
    expect(screen.getByText(/STAGE 7 OF 9: FOOD PICKED UP/i)).toBeInTheDocument();

    // Next authoritative socket event: nearby (Stage 8)
    act(() => {
      (socketService as any).registeredListeners?.get('delivery:status')?.forEach((cb: any) => {
        cb({
          orderId: 'ord-active-456',
          deliveryId: 'del-active-456',
          status: 'nearby',
          location: { lat: 12.9800, lng: 77.6050 },
          etaSeconds: 30,
          distanceRemainingMeters: 200,
        });
      });
    });

    // Must progress to Stage 8 (Out for Delivery / Nearby)
    expect(screen.getByText(/STAGE 8 OF 9: OUT FOR DELIVERY \(GPS ACTIVE\)/i)).toBeInTheDocument();
  });

  it('3. Socket reconnection triggers authoritative-state reconciliation in Showcase', async () => {
    let callCount = 0;
    apiRequestSpy = vi.spyOn(api, 'request').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/dev/demo/active-order') {
        callCount++;
        return {
          order: { _id: 'ord-reconn-1', status: 'partner_assigned' },
          delivery: { _id: 'del-reconn-1', status: 'partner_assigned' },
          isTerminal: false,
        } as any;
      }
      return {} as any;
    });

    const store = createShowcaseStore();

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
    });

    const countBeforeReconnect = callCount;
    expect(countBeforeReconnect).toBeGreaterThanOrEqual(1);

    // Simulate socket reconnect using the actual notifyConnectionState
    act(() => {
      (socketService as any).notifyConnectionState('connected');
    });

    // Reconnection must trigger re-fetch to reconcile state
    expect(callCount).toBe(countBeforeReconnect + 1);
  });

  it('4. Partner Active Delivery page refreshes its state after socket reconnects', async () => {
    let meFetchCount = 0;
    apiRequestSpy = vi.spyOn(api, 'request').mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('delivery/partner/me')) {
        meFetchCount++;
        return {
          success: true,
          data: {
            activeAssignment: {
              deliveryId: 'del-part-1',
              orderId: 'ord-part-1',
              status: 'partner_assigned',
              pickupLocation: { lat: 12.9716, lng: 77.5946 },
              dropoffLocation: { lat: 12.9916, lng: 77.6146 },
            },
          },
        } as any;
      }
      return {} as any;
    });

    const store = createPartnerStore({
      deliveryId: 'del-part-1',
      orderId: 'ord-part-1',
      status: 'partner_assigned',
      pickupLocation: { lat: 12.9716, lng: 77.5946 },
      dropoffLocation: { lat: 12.9916, lng: 77.6146 },
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <ActiveDelivery />
          </MemoryRouter>
        </Provider>
      );
    });

    const initialFetchCount = meFetchCount;

    // Simulate socket reconnect event through notifyConnectionState
    act(() => {
      (socketService as any).notifyConnectionState('connected');
    });

    // Must re-dispatch fetchPartnerStateThunk on reconnect
    expect(meFetchCount).toBeGreaterThan(initialFetchCount);
  });

  it('5. Bounded fallback polling is started and cleaned up correctly in Showcase', async () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    apiRequestSpy = vi.spyOn(api, 'request').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/dev/demo/active-order') {
        return {
          order: { _id: 'ord-poll-1', status: 'partner_assigned' },
          delivery: { _id: 'del-poll-1', status: 'partner_assigned' },
          isTerminal: false,
        } as any;
      }
      return {} as any;
    });

    const store = createShowcaseStore();

    let unmountFn: any;
    await act(async () => {
      const { unmount } = render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
      unmountFn = unmount;
    });

    // Check that 5000ms polling interval was established
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

    // Unmount and verify clearInterval was called
    act(() => {
      unmountFn();
    });

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('6. Terminal delivery stops unnecessary recovery polling in Showcase', async () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval');

    apiRequestSpy = vi.spyOn(api, 'request').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/dev/demo/active-order') {
        return {
          order: { _id: 'ord-term-1', status: 'delivered' },
          delivery: { _id: 'del-term-1', status: 'delivered' },
          isTerminal: true,
        } as any;
      }
      return {} as any;
    });

    const store = createShowcaseStore();

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
    });

    // Initial render of a terminal order must NOT start 5000ms polling
    const pollingCalls = setIntervalSpy.mock.calls.filter((c) => c[1] === 5000);
    expect(pollingCalls.length).toBe(0);
  });

  it('7. Stale events or responses do not regress the displayed lifecycle stage (monotonic forward guard)', async () => {
    apiRequestSpy = vi.spyOn(api, 'request').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/dev/demo/active-order') {
        return {
          order: { _id: 'ord-mono-1', status: 'picked_up' },
          delivery: { _id: 'del-mono-1', status: 'picked_up' },
          isTerminal: false,
        } as any;
      }
      return {} as any;
    });

    const store = createShowcaseStore();

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/STAGE 7 OF 9: FOOD PICKED UP/i)).toBeInTheDocument();
    });

    // Emit out-of-order or stale socket event with partner_assigned (Stage 5)
    act(() => {
      (socketService as any).registeredListeners?.get('delivery:status')?.forEach((cb: any) => {
        cb({
          orderId: 'ord-mono-1',
          deliveryId: 'del-mono-1',
          status: 'partner_assigned',
        });
      });
    });

    // Monotonic guard ensures state remains at Stage 7
    expect(screen.getByText(/STAGE 7 OF 9: FOOD PICKED UP/i)).toBeInTheDocument();
    expect(screen.queryByText(/STAGE 5 OF 9: COURIER ASSIGNED/i)).not.toBeInTheDocument();

    // Emit stale order_status_update with 'preparing' (Stage 3)
    act(() => {
      (socketService as any).registeredListeners?.get('order_status_update')?.forEach((cb: any) => {
        cb({
          orderId: 'ord-mono-1',
          status: 'preparing',
        });
      });
    });

    // Monotonic guard ensures state STILL remains at Stage 7
    expect(screen.getByText(/STAGE 7 OF 9: FOOD PICKED UP/i)).toBeInTheDocument();
  });

  it('8. Automatic handoff does not cause competing or invalid transitions when confirm-handoff is idempotent', async () => {
    apiRequestSpy = vi.spyOn(api, 'request').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/dev/demo/active-order') {
        return {
          order: { _id: 'ord-handoff-1', status: 'partner_assigned' },
          delivery: { _id: 'del-handoff-1', status: 'arrived_pickup' },
          isTerminal: false,
        } as any;
      }
      if (endpoint === '/dev/demo/confirm-handoff') {
        // Return idempotent success (server auto-handoff already executed)
        return {
          success: true,
          message: 'Kitchen handoff already confirmed; courier is en route to customer',
          data: {
            order: { _id: 'ord-handoff-1', status: 'picked_up' },
            delivery: { _id: 'del-handoff-1', status: 'picked_up' },
            alreadyHandedOff: true,
          },
        } as any;
      }
      return {} as any;
    });

    const store = createShowcaseStore();

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter>
            <InteractiveDemos />
          </MemoryRouter>
        </Provider>
      );
    });

    // Check that arrived_pickup triggers handoff banner
    await waitFor(() => {
      expect(screen.getByText(/Courier arrived at restaurant kitchen!/i)).toBeInTheDocument();
    });

    // Trigger handoff confirmation
    const handoffButton = screen.getByRole('button', { name: /Hand Off Food Now/i });
    await act(async () => {
      handoffButton.click();
    });

    // Component smoothly updates to picked_up without error
    await waitFor(() => {
      expect(screen.getByText(/STAGE 7 OF 9: FOOD PICKED UP/i)).toBeInTheDocument();
      expect(screen.queryByText(/Courier arrived at restaurant kitchen!/i)).not.toBeInTheDocument();
    });
  });
});
