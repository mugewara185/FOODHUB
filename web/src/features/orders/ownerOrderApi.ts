import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../core/utils/api';
import { normalizeOrder } from './api/orderApi';
import type { Order } from '../../core/types/food';
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
      const response = await api.get<any>('orders/owned?status=pending_owner');
      if (!response.success) throw new Error(response.message);
      return response.data.map(normalizeOrder);
    } catch (err: any) {
      return handleThunkError(err, dispatch, rejectWithValue, 'Failed to fetch pending orders');
    }
  }
);

export const fetchOwnerActiveThunk = createAsyncThunk<Order[], void>(
  'ownerOrders/fetchActive',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get<any>('orders/owned?status=confirmed,preparing');
      if (!response.success) throw new Error(response.message);
      return response.data.map(normalizeOrder);
    } catch (err: any) {
      return handleThunkError(err, dispatch, rejectWithValue, 'Failed to fetch active orders');
    }
  }
);

export const acceptOrderThunk = createAsyncThunk<void, string>(
  'ownerOrders/acceptOrder',
  async (orderId, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.patch<any>(`orders/${orderId}/accept`);
      if (!response.success) throw new Error(response.message);
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
      const response = await api.patch<any>(`orders/${orderId}/reject`);
      if (!response.success) throw new Error(response.message);
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
      const response = await api.patch<any>(`orders/${orderId}/preparing`);
      if (!response.success) throw new Error(response.message);
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
      const response = await api.patch<any>(`orders/${orderId}/ready`);
      if (!response.success) throw new Error(response.message);
      dispatch(showToast({ message: 'Order marked as ready', type: 'success' }));
    } catch (err: any) {
      return handleThunkError(err, dispatch, rejectWithValue, 'Failed to mark order as ready');
    }
  }
);
