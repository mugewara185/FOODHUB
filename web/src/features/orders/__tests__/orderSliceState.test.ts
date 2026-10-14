import { expect, describe, it, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import orderReducer, { fetchOrdersThunk, fetchOrderByIdThunk } from '../orderSlice';
import { orderApi } from '../api/orderApi';

vi.mock('../api/orderApi', () => ({
  orderApi: {
    getUserOrders: vi.fn(),
    getById: vi.fn(),
  }
}));

describe('orderSlice async state machine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchOrdersThunk', () => {
    it('transitions idle -> loading -> success', async () => {
      vi.mocked(orderApi.getUserOrders).mockResolvedValue([{ id: '123' }] as any);
      
      const store = configureStore({
        reducer: { orders: orderReducer },
      });
      
      expect(store.getState().orders.fetchStatus).toBe('idle');
      
      const promise = store.dispatch(fetchOrdersThunk());
      
      expect(store.getState().orders.fetchStatus).toBe('loading');
      
      await promise;
      
      expect(store.getState().orders.fetchStatus).toBe('success');
      expect(store.getState().orders.items).toHaveLength(1);
    });

    it('transitions idle -> loading -> error', async () => {
      vi.mocked(orderApi.getUserOrders).mockRejectedValue(new Error('Network Error'));
      
      const store = configureStore({
        reducer: { orders: orderReducer },
      });
      
      const promise = store.dispatch(fetchOrdersThunk());
      expect(store.getState().orders.fetchStatus).toBe('loading');
      
      await promise;
      
      expect(store.getState().orders.fetchStatus).toBe('error');
      expect(store.getState().orders.error?.message).toBe('Network Error');
    });
  });

  describe('fetchOrderByIdThunk (Workstream B: Order detail Redux state)', () => {
    it('updates state.currentOrder and appends to state.items when order is not yet present', async () => {
      const mockOrder = {
        id: 'ord-456',
        restaurantName: 'Pizza Palace',
        total: 550,
        status: 'delivered',
        items: [],
      } as any;

      vi.mocked(orderApi.getById).mockResolvedValueOnce(mockOrder);

      const store = configureStore({
        reducer: { orders: orderReducer },
        preloadedState: {
          orders: {
            items: [{ id: 'ord-100', restaurantName: 'Burger Joint', total: 200 } as any],
            currentOrder: null,
            fetchStatus: 'idle',
            error: null,
          } as any,
        },
      });

      const promise = store.dispatch(fetchOrderByIdThunk('ord-456'));
      expect(store.getState().orders.fetchStatus).toBe('loading');
      expect(store.getState().orders.error).toBeNull();

      await promise;

      const state = store.getState().orders;
      expect(state.fetchStatus).toBe('success');
      expect(state.currentOrder).toEqual(mockOrder);
      expect(state.items).toHaveLength(2);
      expect(state.items[1]).toEqual(mockOrder);
    });

    it('updates state.currentOrder and updates existing order in state.items in-place without duplicating', async () => {
      const existingOrder = {
        id: 'ord-456',
        restaurantName: 'Pizza Palace',
        status: 'preparing',
        total: 550,
      } as any;

      const updatedOrder = {
        id: 'ord-456',
        restaurantName: 'Pizza Palace',
        status: 'out_for_delivery',
        total: 550,
      } as any;

      vi.mocked(orderApi.getById).mockResolvedValueOnce(updatedOrder);

      const store = configureStore({
        reducer: { orders: orderReducer },
        preloadedState: {
          orders: {
            items: [existingOrder, { id: 'ord-999', restaurantName: 'Taco Haven' } as any],
            currentOrder: existingOrder,
            fetchStatus: 'idle',
            error: null,
          } as any,
        },
      });

      await store.dispatch(fetchOrderByIdThunk('ord-456'));

      const state = store.getState().orders;
      expect(state.fetchStatus).toBe('success');
      expect(state.currentOrder).toEqual(updatedOrder);
      expect(state.items).toHaveLength(2);
      expect(state.items[0]).toEqual(updatedOrder);
      expect(state.items[0].status).toBe('out_for_delivery');
    });

    it('transitions to error state and preserves previous currentOrder on rejection', async () => {
      vi.mocked(orderApi.getById).mockRejectedValueOnce(new Error('Order not found'));

      const initialCurrentOrder = { id: 'ord-111', restaurantName: 'Safe Order' } as any;

      const store = configureStore({
        reducer: { orders: orderReducer },
        preloadedState: {
          orders: {
            items: [initialCurrentOrder],
            currentOrder: initialCurrentOrder,
            fetchStatus: 'idle',
            error: null,
          } as any,
        },
      });

      await store.dispatch(fetchOrderByIdThunk('ord-invalid'));

      const state = store.getState().orders;
      expect(state.fetchStatus).toBe('error');
      expect(state.error?.message).toBe('Order not found');
      expect(state.currentOrder).toEqual(initialCurrentOrder);
    });
  });
});
