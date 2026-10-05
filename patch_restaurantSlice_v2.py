import os

path = 'web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts'
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
    "import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';",
    "import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';\nimport { normalizeError, type AsyncStatus, type NormalizedApiError } from '../../../../core/utils/asyncState';"
)

c = c.replace(
'''export interface RestaurantState {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  menuItems: FoodItem[];
  categories: Category[];
  featuredRestaurants: Restaurant[];
  loading: boolean;
  error: string | null;''',
'''export interface RestaurantState {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  menuItems: FoodItem[];
  categories: Category[];
  featuredRestaurants: Restaurant[];
  fetchStatus: AsyncStatus;
  fetchByIdStatus: AsyncStatus;
  error: NormalizedApiError | null;'''
)

c = c.replace(
'''  loading: false,
  error: null,''',
'''  fetchStatus: 'idle',
  fetchByIdStatus: 'idle',
  error: null,'''
)

c = c.replace("return rejectWithValue(`Failed to fetch restaurants:${error instanceof Error ? error.message : 'Unknown error'}`);", "return rejectWithValue(normalizeError(error));")
c = c.replace("return rejectWithValue(`Failed to fetch restaurant:${error instanceof Error ? error.message : 'Unknown error'}`);", "return rejectWithValue(normalizeError(error));")


c = c.replace(
'''.addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })''',
'''.addCase(fetchRestaurants.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })'''
)

c = c.replace(
'''.addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = action.payload;
        state.featuredRestaurants = action.payload.filter(r => r.isFeatured);
      })''',
'''.addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.fetchStatus = 'success';
        state.restaurants = action.payload;
        state.featuredRestaurants = action.payload.filter(r => r.isFeatured);
      })'''
)

c = c.replace(
'''.addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })''',
'''.addCase(fetchRestaurants.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })'''
)


c = c.replace(
'''.addCase(fetchRestaurantById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })''',
'''.addCase(fetchRestaurantById.pending, (state) => {
        state.fetchByIdStatus = 'loading';
        state.error = null;
      })'''
)

c = c.replace(
'''.addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRestaurant = action.payload;
      })''',
'''.addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.fetchByIdStatus = 'success';
        state.selectedRestaurant = action.payload;
      })'''
)

c = c.replace(
'''.addCase(fetchRestaurantById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })''',
'''.addCase(fetchRestaurantById.rejected, (state, action) => {
        state.fetchByIdStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })'''
)


c = c.replace(
    "export const selectRestaurantLoading = (state: RootState) => state.restaurants.loading;",
    "export const selectRestaurantLoading = (state: RootState) => state.restaurants.fetchStatus === 'loading';\nexport const selectFetchStatus = (state: RootState) => state.restaurants.fetchStatus;"
)

with open(path, 'w') as f:
    f.write(c)

print("Patched restaurantSlice")
