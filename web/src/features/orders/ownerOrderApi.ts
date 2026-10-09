import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../core/utils/api';
import { normalizeOrder } from './api/orderApi';
import type { Order } from '../../core/types';
import { showToast } from '../ui/uiSlice';

// Helper for thunk errors
const handleThunkError = (error: any, dispatch: any, rejectWithValue: any, defaultMsg: string) => {
  const msg = error.message || defaultMsg;
  dispatch(showToast({ message: msg, type: 'error' }));
  return rejectWithValue(msg);
};

export const fetchOwnerQueueThunk = createAsyncThunk<Order[], void>(
  'ownerOrders/fetchQueue',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const orders = await api.get<any[]>('orders/owned?status=pending_owner');
      return orders.map(normalizeOrder);
    } catch (err: any) {
      return handleThunkError(err, dispatch, rejectWithValue, 'Failed to fetch pending orders');
    }
  }
);

export const OWNER_ACTIVE_STATUSES = [
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'awaiting_partner',
  'partner_assigned',
  'picked_up',
  'out_for_delivery'
];

export const fetchOwnerActiveThunk = createAsyncThunk<Order[], void>(
  'ownerOrders/fetchActive',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const orders = await api.get<any[]>(`orders/owned?status=${OWNER_ACTIVE_STATUSES.join(',')}`);
      return orders.map(normalizeOrder);
    } catch (err: any) {
      return handleThunkError(err, dispatch, rejectWithValue, 'Failed to fetch active orders');
    }
  }
);

export const acceptOrderThunk = createAsyncThunk<void, string>(
  'ownerOrders/acceptOrder',
  async (orderId, { dispatch, rejectWithValue }) => {
    try {
      await api.patch<any>(`orders/${orderId}/accept`);
      dispatch(showToast({ message: 'Order accepted', type: 'success' }));
    } catch (err: any) {
      return handleThunkError(err, dispatch, rejectWithValue, 'Failed to accept order');
    }
  }
);

export const rejectOrderThunk = createAsyncThunk<void, string>(
  'ownerOrders/rejectOrder',
  async (orderId, { dispatch, rejectWithValue }) => {
    try {
      await api.patch<any>(`orders/${orderId}/reject`);
      dispatch(showToast({ message: 'Order rejected', type: 'success' }));
    } catch (err: any) {
      return handleThunkError(err, dispatch, rejectWithValue, 'Failed to reject order');
    }
  }
);

export const markPreparingThunk = createAsyncThunk<void, string>(
  'ownerOrders/markPreparing',
  async (orderId, { dispatch, rejectWithValue }) => {
    try {
      await api.patch<any>(`orders/${orderId}/preparing`);
      dispatch(showToast({ message: 'Order marked as preparing', type: 'success' }));
    } catch (err: any) {
      return handleThunkError(err, dispatch, rejectWithValue, 'Failed to mark order as preparing');
    }
  }
);

export const markReadyThunk = createAsyncThunk<void, string>(
  'ownerOrders/markReady',
  async (orderId, { dispatch, rejectWithValue }) => {
    try {
      await api.patch<any>(`orders/${orderId}/ready`);
      dispatch(showToast({ message: 'Order marked as ready', type: 'success' }));
    } catch (err: any) {
      return handleThunkError(err, dispatch, rejectWithValue, 'Failed to mark order as ready');
    }
  }
);

export const confirmHandoffThunk = createAsyncThunk<void, string>(
  'ownerOrders/confirmHandoff',
  async (orderId, { dispatch, rejectWithValue }) => {
    try {
      await api.patch<any>(`orders/${orderId}/picked_up`);
      dispatch(showToast({ message: 'Order handoff confirmed', type: 'success' }));
    } catch (err: any) {
      return handleThunkError(err, dispatch, rejectWithValue, 'Failed to confirm handoff');
    }
  }
);
