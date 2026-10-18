import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useOwnerSocket } from '../hooks/useOwnerSocket';
import ownerOrderReducer from '../ownerOrderSlice';
import { socketService } from '../../../services/socket';

describe('useOwnerSocket & Realtime Owner Order Invariants', () => {
  let store: ReturnType<typeof createTestStore>;
  let orderNewHandler: ((payload: any) => void) | null = null;
  let orderStatusChangedHandler: ((payload: any) => void) | null = null;
  let deliveryStatusChangedHandler: ((payload: any) => void) | null = null;

  const createTestStore = () =>
    configureStore({
      reducer: {
        ownerOrders: ownerOrderReducer,
      },
    });

  beforeEach(() => {
    store = createTestStore();
    orderNewHandler = null;
    orderStatusChangedHandler = null;
    deliveryStatusChangedHandler = null;

    vi.spyOn(socketService, 'onOrderNew').mockImplementation((cb: any) => {
      orderNewHandler = cb;
    });
    vi.spyOn(socketService, 'onOrderStatusChanged').mockImplementation((cb: any) => {
      orderStatusChangedHandler = cb;
    });
    vi.spyOn(socketService, 'onDeliveryStatusChanged').mockImplementation((cb: any) => {
      deliveryStatusChangedHandler = cb;
    });
    vi.spyOn(socketService, 'offOrderNew').mockImplementation(() => {
      orderNewHandler = null;
    });
    vi.spyOn(socketService, 'offOrderStatusChanged').mockImplementation(() => {
      orderStatusChangedHandler = null;
    });
    vi.spyOn(socketService, 'offDeliveryStatusChanged').mockImplementation(() => {
      deliveryStatusChangedHandler = null;
    });
    vi.spyOn(socketService, 'onConnectionChange').mockImplementation(() => {});
    vi.spyOn(socketService, 'offConnectionChange').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  it('1. Registers socket event listeners immediately on hook mount without gating on isConnected', () => {
    // Force socketService to report disconnected initially via getter spy
    vi.spyOn(socketService, 'isConnected', 'get').mockReturnValue(false);

    renderHook(() => useOwnerSocket(), { wrapper });

    // Invariant: Listeners MUST be registered immediately to prevent dropped events during boot/reconnect
    expect(orderNewHandler).toBeTypeOf('function');
    expect(orderStatusChangedHandler).toBeTypeOf('function');
    expect(deliveryStatusChangedHandler).toBeTypeOf('function');
  });

  it('2. Live order arrival: order:new payload reaches Redux and unshifts into pendingOrders without manual refresh', () => {
    renderHook(() => useOwnerSocket(), { wrapper });

    const newOrderPayload = {
      _id: 'ord-socket-001',
      restaurantId: 'rest-123',
      restaurantName: 'Test Kitchen',
      customerName: 'Anand Kumar',
      status: 'pending_owner',
      totalAmount: 450,
      items: [{ menuItemId: 'm1', name: 'Butter Chicken', price: 450, quantity: 1 }],
      createdAt: new Date().toISOString(),
    };

    act(() => {
      orderNewHandler!(newOrderPayload);
    });

    const state = store.getState().ownerOrders;
    expect(state.pendingOrders).toHaveLength(1);
    expect(state.pendingOrders[0].id).toBe('ord-socket-001');
    expect(state.pendingOrders[0].status).toBe('pending_owner');
  });

  it('3. Defensive envelope parsing: handles enveloped payloads (order.data or order.order) gracefully', () => {
    renderHook(() => useOwnerSocket(), { wrapper });

    const envelopedPayload = {
      order: {
        _id: 'ord-enveloped-002',
        status: 'pending_owner',
        totalAmount: 320,
        items: [],
      },
    };

    act(() => {
      orderNewHandler!(envelopedPayload);
    });

    const state = store.getState().ownerOrders;
    const found = state.pendingOrders.find((o) => o.id === 'ord-enveloped-002');
    expect(found).toBeDefined();
    expect(found?.status).toBe('pending_owner');
  });

  it('4. Realtime status transition: order:status_changed moves order from pendingOrders to activeOrders', () => {
    renderHook(() => useOwnerSocket(), { wrapper });

    // Seed initial pending order
    act(() => {
      orderNewHandler!({
        _id: 'ord-move-003',
        status: 'pending_owner',
        totalAmount: 200,
      });
    });

    expect(store.getState().ownerOrders.pendingOrders).toHaveLength(1);
    expect(store.getState().ownerOrders.activeOrders).toHaveLength(0);

    // Socket broadcasts owner acceptance -> confirmed
    act(() => {
      orderStatusChangedHandler!({
        orderId: 'ord-move-003',
        status: 'confirmed',
      });
    });

    const state = store.getState().ownerOrders;
    expect(state.pendingOrders).toHaveLength(0);
    expect(state.activeOrders).toHaveLength(1);
    expect(state.activeOrders[0].id).toBe('ord-move-003');
    expect(state.activeOrders[0].status).toBe('confirmed');
  });

  it('5. Delivery status updates: delivery:status syncs deliveryStatus field on active order', () => {
    renderHook(() => useOwnerSocket(), { wrapper });

    // Add and confirm order
    act(() => {
      orderNewHandler!({ _id: 'ord-del-004', status: 'pending_owner' });
      orderStatusChangedHandler!({ orderId: 'ord-del-004', status: 'ready_for_pickup' });
    });

    // Courier arrives at kitchen
    act(() => {
      deliveryStatusChangedHandler!({
        orderId: 'ord-del-004',
        status: 'arrived_pickup',
      });
    });

    const active = store.getState().ownerOrders.activeOrders;
    expect(active[0].deliveryStatus).toBe('arrived_pickup');
  });

  it('6. Cleans up all socket listeners on unmount without leaks', () => {
    const { unmount } = renderHook(() => useOwnerSocket(), { wrapper });

    expect(orderNewHandler).not.toBeNull();
    unmount();

    // Invariant: Unmounting component detaches socket listeners to prevent duplicate dispatches
    expect(orderNewHandler).toBeNull();
    expect(orderStatusChangedHandler).toBeNull();
    expect(deliveryStatusChangedHandler).toBeNull();
  });
});
