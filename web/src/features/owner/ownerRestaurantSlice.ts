import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../core/utils/api';

export interface OwnerRestaurantState {
  data: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OwnerRestaurantState = {
  data: null,
  isLoading: false,
  error: null,
};

export const fetchOwnerRestaurantThunk = createAsyncThunk(
  'ownerRestaurant/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get('restaurants/mine');
      if (data.success === false) {
        throw new Error(data.message || 'Failed to fetch restaurant');
      }
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const ownerRestaurantSlice = createSlice({
  name: 'ownerRestaurant',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchOwnerRestaurantThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchOwnerRestaurantThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });
    builder.addCase(fetchOwnerRestaurantThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export default ownerRestaurantSlice.reducer;
