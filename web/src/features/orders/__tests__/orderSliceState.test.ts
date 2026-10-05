import { expect, describe, it, vi, beforeAll } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';



import orderReducer, { fetchOrdersThunk } from '../orderSlice';
import { orderApi } from '../api/orderApi';

vi.mock('../api/orderApi', () => ({
  orderApi: {
    getUserOrders: vi.fn(),
  }
}));

describe('orderSlice async state machine', () => {
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
