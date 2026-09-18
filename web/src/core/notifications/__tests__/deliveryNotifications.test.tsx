import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from '../notificationSlice';
import { useDeliveryNotifications } from '../hooks/useDeliveryNotifications';
import { socketService } from '../../../services/socket';
import type { DeliveryAssignedPayload, DeliveryStatusPayload, DeliveryLocationPayload } from '../../../core/types/socket.events';

vi.mock('../../../services/socket', () => ({
  socketService: {
    onDeliveryAssigned: vi.fn(),
    onDeliveryStatus: vi.fn(),
    onDeliveryLocation: vi.fn(),
    offDeliveryAssigned: vi.fn(),
    offDeliveryStatus: vi.fn(),
    offDeliveryLocation: vi.fn(),
    onConnectionChange: vi.fn(),
    offConnectionChange: vi.fn(),
    joinAdminFleet: vi.fn(),
    leaveAdminFleet: vi.fn(),
  }
}));

describe('useDeliveryNotifications Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupHook = (role: 'customer' | 'partner' | 'admin') => {
    const store = configureStore({
      reducer: {
        notifications: notificationReducer,
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { unmount } = renderHook(() => useDeliveryNotifications(role), { wrapper });

    return {
      store,
      unmount,
      onAssigned: vi.mocked(socketService.onDeliveryAssigned).mock.calls[0]?.[0],
      onStatus: vi.mocked(socketService.onDeliveryStatus).mock.calls[0]?.[0],
      onLocation: vi.mocked(socketService.onDeliveryLocation).mock.calls[0]?.[0],
    };
  };

  it('customer: dispatches notification on delivery:assigned with route', () => {
    const { store, onAssigned } = setupHook('customer');
    
    act(() => onAssigned({
      orderId: 'ord-123',
      deliveryId: 'del-1',
      partnerId: 'partner-1',
      partnerName: 'John',
      partnerPhone: '1234',
      status: 'assigned'
    }));

    const state = store.getState().notifications;
    expect(state.unreadCount).toBe(1);
    expect(state.items[0].targetPath).toBe('/orders/tracking/ord-123');
    expect(state.items[0].title).toBe('Order Assigned');
  });

  it('customer: dispatches notification on delivery:status -> delivered', () => {
    const { store, onStatus } = setupHook('customer');
    
    act(() => onStatus({
      orderId: 'ord-123',
      deliveryId: 'del-1',
      partnerId: 'partner-1',
      status: 'delivered',
      timestamp: new Date().toISOString()
    }));

    const state = store.getState().notifications;
    expect(state.unreadCount).toBe(1);
    expect(state.items[0].targetPath).toBe('/orders/tracking/ord-123');
    expect(state.items[0].title).toBe('Order Delivered');
    expect(state.items[0].type).toBe('success');
  });

  it('admin: dispatches notification with admin routes', () => {
    const { store, onAssigned } = setupHook('admin');
    
    act(() => onAssigned({
      orderId: 'ord-999',
      deliveryId: 'del-2',
      partnerId: 'partner-2',
      partnerName: 'Jane',
      partnerPhone: '5555',
      status: 'assigned'
    }));

    const state = store.getState().notifications;
    expect(state.unreadCount).toBe(1);
    expect(state.items[0].targetPath).toBe('/admin/delivery');
    expect(state.items[0].title).toBe('Delivery Assigned');
  });

  it('does NOT dispatch on delivery:location', () => {
    const { store, onLocation } = setupHook('customer');
    
    // onLocation might be undefined since useDeliveryNotifications doesn't subscribe to it
    if (onLocation) {
      act(() => onLocation({
        orderId: 'ord-123',
        deliveryId: 'del-1',
        partnerId: 'partner-1',
        location: { lat: 0, lng: 0 }
      }));
    }

    const state = store.getState().notifications;
    expect(state.unreadCount).toBe(0);
    expect(state.items.length).toBe(0);
  });
});
