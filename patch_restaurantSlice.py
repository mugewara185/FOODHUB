import re
with open('web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts', 'r') as f:
    c = f.read()

c = re.sub(
    r'export interface RestaurantState \{[\s\S]*?loading: boolean;\n    error: string \| null;',
    '''import { type AsyncStatus, type NormalizedApiError } from '../../../../core/utils/asyncState';

export interface RestaurantState {
    restaurants: Restaurant[];
    selectedRestaurant: Restaurant | null;
    menuItems: FoodItem[];
    categories: Category[];
    featuredRestaurants: Restaurant[];
    fetchStatus: AsyncStatus;
    fetchByIdStatus: AsyncStatus;
    error: NormalizedApiError | null;''',
    c
)

c = re.sub(
    r'loading: false,\n    error: null,',
    "fetchStatus: 'idle',\n    fetchByIdStatus: 'idle',\n    error: null,",
    c
)

c = c.replace("return rejectWithValue(`Failed to fetch restaurants:${error instanceof Error ? error.message : 'Unknown error'}`);", "return rejectWithValue(normalizeError(error));")
c = c.replace("return rejectWithValue(`Failed to fetch restaurant:${error instanceof Error ? error.message : 'Unknown error'}`);", "return rejectWithValue(normalizeError(error));")

c = c.replace(
    "import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';",
    "import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';\nimport { normalizeError } from '../../../../core/utils/asyncState';"
)

c = re.sub(
    r'\.addCase\(fetchRestaurants\.pending, \(state\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchRestaurants.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })''',
    c
)
c = re.sub(
    r'\.addCase\(fetchRestaurants\.fulfilled, \(state, action\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.fetchStatus = 'success';
        state.restaurants = action.payload;
        state.featuredRestaurants = action.payload.filter(r => r.isFeatured);
      })''',
    c
)
c = re.sub(
    r'\.addCase\(fetchRestaurants\.rejected, \(state, action\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchRestaurants.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })''',
    c
)

c = re.sub(
    r'\.addCase\(fetchRestaurantById\.pending, \(state\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchRestaurantById.pending, (state) => {
        state.fetchByIdStatus = 'loading';
        state.error = null;
      })''',
    c
)
c = re.sub(
    r'\.addCase\(fetchRestaurantById\.fulfilled, \(state, action\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.fetchByIdStatus = 'success';
        state.selectedRestaurant = action.payload;
      })''',
    c
)
c = re.sub(
    r'\.addCase\(fetchRestaurantById\.rejected, \(state, action\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchRestaurantById.rejected, (state, action) => {
        state.fetchByIdStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })''',
    c
)

c = c.replace(
    "export const selectRestaurantLoading = (state: RootState) => state.restaurants.loading;",
    "export const selectRestaurantLoading = (state: RootState) => state.restaurants.fetchStatus === 'loading';\nexport const selectFetchStatus = (state: RootState) => state.restaurants.fetchStatus;"
)
c = c.replace(
    "export const selectRestaurantError = (state: RootState) => state.restaurants.error;",
    "export const selectRestaurantError = (state: RootState) => state.restaurants.error;"
)

with open('web/src/features/restaurant/restaurantSlice/V/restaurantSlice_V.ts', 'w') as f:
    f.write(c)
