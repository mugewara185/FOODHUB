import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import deliveryPartnerReducer, {
  setOnlineStatusThunk,
  fetchPartnerStateThunk,
  acceptAssignmentThunk,
} from '../deliveryPartnerSlice';
import ActiveDelivery from '../../../pages/_deliveryPartner/ActiveDelivery';
import PartnerDashboard from '../../../pages/_deliveryPartner/PartnerDashboard';

// Mock uiSlice to spy on showToast
const mockShowToast = vi.fn();
vi.mock('../../ui/uiSlice', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    showToast: (payload: any) => {
      mockShowToast(payload);
      return { type: 'ui/showToast', payload };
    },
  };
});

const createStore = (initialState?: any) => configureStore({
  reducer: { 
    deliveryPartner: deliveryPartnerReducer,
    auth: (state = initialState?.auth || { user: { id: 'real-user-123' } }) => state
  },
  preloadedState: initialState
});

describe('Delivery Partner Bugs & API Contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockShowToast.mockClear();
  });

  describe('Bug 1: /partner/active redirect', () => {
    it('renders "No active delivery" if activeAssignment is null (does not redirect)', async () => {
      const store = createStore({
        deliveryPartner: {
          activeAssignment: null,
          isLoading: false,
        }
      });

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/partner/active']}>
            <Routes>
              <Route path="/partner/active" element={<ActiveDelivery />} />
              <Route path="/partner" element={<div data-testid="dashboard">Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // Verify no redirect to dashboard occurred
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
      // Verify fallback rendered
      expect(await screen.findByText('No active delivery')).toBeInTheDocument();
    });

    it('renders the UI if activeAssignment is loaded', async () => {
      const store = createStore({
        deliveryPartner: {
          activeAssignment: {
            id: 'del-1',
            deliveryId: 'del-1',
            orderId: 'ord-1',
            status: 'assigned',
            pickupLocation: { lat: 12.9716, lng: 77.5946 },
            dropoffLocation: { lat: 12.9916, lng: 77.6146 },
            currentLocation: { lat: 12.9716, lng: 77.5946 },
          },
          isLoading: false,
        }
      });

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/partner/active']}>
            <Routes>
              <Route path="/partner/active" element={<ActiveDelivery />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      expect(screen.queryByText('No active delivery')).not.toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Bug 2: Online/offline toggle endpoint', () => {
    it('uses /api/delivery/partner/me/status endpoint with JWT session', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { status: 'available' } })
      } as Response);

      const store = createStore({
        deliveryPartner: { isOnline: false, stats: {}, activeAssignment: null, availableAssignments: [] },
        auth: { user: { id: 'real-user-id-456' } }
      });

      await act(async () => {
        await store.dispatch(setOnlineStatusThunk(true));
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/delivery/partner/me/status'),
        expect.any(Object)
      );
    });

    it('dispatches to notificationSlice (showToast) on rejection, instead of native alert', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, message: 'Network failure' })
      } as Response);

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      const store = createStore();

      await act(async () => {
        await store.dispatch(setOnlineStatusThunk(true));
      });

      // No native alert
      expect(alertSpy).not.toHaveBeenCalled();
      
      // But a toast was dispatched
      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Network failure',
        type: 'error'
      });
    });
  });

  describe('Workstream A: API response envelope unwrapping', () => {
    it('fetchPartnerStateThunk populates state with unwrapped payload', async () => {
      const store = createStore();
      const mockPartner = {
        name: 'Raju Rider',
        phone: '9876543210',
        vehicle: 'Hero Splendor',
        rating: 4.9,
        status: 'available',
        isOnline: true,
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPartner,
        }),
      } as Response);

      await act(async () => {
        await store.dispatch(fetchPartnerStateThunk());
      });

      const state = store.getState().deliveryPartner;
      expect(state.name).toBe('Raju Rider');
      expect(state.phone).toBe('9876543210');
      expect(state.vehicle).toBe('Hero Splendor');
      expect(state.rating).toBe(4.9);
      expect(state.status).toBe('ONLINE');
      expect(state.isOnline).toBe(true);
    });

    it('fetchPartnerStateThunk safely handles double-wrapped payload without dropping fields', async () => {
      const store = createStore();
      const mockPartner = {
        name: 'Deepak Delivery',
        status: 'available',
        isOnline: true,
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            data: mockPartner,
          },
        }),
      } as Response);

      await act(async () => {
        await store.dispatch(fetchPartnerStateThunk());
      });

      const state = store.getState().deliveryPartner;
      expect(state.name).toBe('Deepak Delivery');
      expect(state.status).toBe('ONLINE');
    });

    it('acceptAssignmentThunk transitions to ON_DELIVERY and populates activeAssignment with unwrapped payload', async () => {
      const store = createStore({
        deliveryPartner: {
          availableAssignments: [
            {
              orderId: 'order-999',
              deliveryId: 'order-999',
              restaurant: 'Spicy Delight',
              amount: 250,
              items: [],
            },
          ],
        },
      });

      const mockDelivery = {
        _id: 'del-777',
        orderId: 'order-999',
        partnerId: 'partner-111',
        status: 'partner_assigned',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockDelivery,
        }),
      } as Response);

      await act(async () => {
        await store.dispatch(acceptAssignmentThunk({ orderId: 'order-999' }));
      });

      const state = store.getState().deliveryPartner;
      expect(state.status).toBe('ON_DELIVERY');
      expect(state.activeAssignment).not.toBeNull();
      expect(state.activeAssignment?.deliveryId).toBe('del-777');
      expect(state.activeAssignment?.orderId).toBe('order-999');
      expect(state.activeAssignment?.restaurant).toBe('Spicy Delight');
      expect(state.availableAssignments).toHaveLength(0);
    });
  });
});

