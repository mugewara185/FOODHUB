import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import deliveryPartnerReducer, { setOnlineStatusThunk } from '../deliveryPartnerSlice';
import ActiveDelivery from '../../../pages/_deliveryPartner/ActiveDelivery';
import PartnerDashboard from '../../../pages/_deliveryPartner/PartnerDashboard';

// Mock uiSlice to spy on showToast
const mockShowToast = vi.fn();
vi.mock('../../ui/uiSlice', () => ({
  showToast: (payload: any) => {
    mockShowToast(payload);
    return { type: 'ui/showToast', payload };
  }
}));

const createStore = (initialState?: any) => configureStore({
  reducer: { 
    deliveryPartner: deliveryPartnerReducer,
    auth: (state = initialState?.auth || { user: { id: 'real-user-123' } }) => state
  },
  preloadedState: initialState
});

describe('Delivery Partner Bugs', () => {
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
          activeAssignment: { id: 'del-1' }, // Dummy active assignment
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

      // ActiveDelivery should render some element of the delivery UI. 
      // The word "Loading" or "No active delivery" should not be there.
      expect(screen.queryByText('No active delivery')).not.toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Bug 2: Online/offline toggle failure', () => {
    it('uses auth.user.id in the URL instead of hardcoded partner-123', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      const store = createStore({
        deliveryPartner: { isOnline: false, stats: {}, activeAssignment: null, availableAssignments: [] },
        auth: { user: { id: 'real-user-id-456' } }
      });

      await act(async () => {
        await store.dispatch(setOnlineStatusThunk(true));
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/delivery/partner/real-user-id-456/status'),
        expect.any(Object)
      );
    });

    it('dispatches to notificationSlice (showToast) on rejection, instead of native alert', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Network failure' })
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
});
