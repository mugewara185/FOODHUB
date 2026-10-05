import os

# 1. orderSlice.ts
path = 'web/src/features/orders/orderSlice.ts'
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
    "import { logger } from '../../core/dev/logger';",
    "import { logger } from '../../core/dev/logger';\nimport { normalizeError, type AsyncStatus, type NormalizedApiError } from '../../core/utils/asyncState';"
)

c = c.replace(
'''export interface OrderState {
  /** User's order history */
  items: Order[];
  /** The most recently placed order (for confirmation page) */
  currentOrder: Order | null;
  /** True while GET /api/orders is in-flight */
  loading: boolean;
  /** True while POST /api/orders is in-flight */
  creating: boolean;
  /** True while PATCH /api/orders/:id/cancel is in-flight */
  cancelling: boolean;
  error: string | null;
}''',
'''export interface OrderState {
  items: Order[];
  currentOrder: Order | null;
  fetchStatus: AsyncStatus;
  createStatus: AsyncStatus;
  cancelStatus: AsyncStatus;
  error: NormalizedApiError | null;
}'''
)

c = c.replace(
'''const initialState: OrderState = {
  items: [],
  currentOrder: null,
  loading: false,
  creating: false,
  cancelling: false,
  error: null,
};''',
'''const initialState: OrderState = {
  items: [],
  currentOrder: null,
  fetchStatus: 'idle',
  createStatus: 'idle',
  cancelStatus: 'idle',
  error: null,
};'''
)

c = c.replace("return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch orders');", "return rejectWithValue(normalizeError(err));")
c = c.replace("return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch order');", "return rejectWithValue(normalizeError(err));")
c = c.replace("return rejectWithValue(err instanceof Error ? err.message : 'Failed to place order');", "return rejectWithValue(normalizeError(err));")
c = c.replace("return rejectWithValue(err instanceof Error ? err.message : 'Failed to cancel order');", "return rejectWithValue(normalizeError(err));")
c = c.replace("return rejectWithValue(err instanceof Error ? err.message : 'Failed to submit review');", "return rejectWithValue(normalizeError(err));")

c = c.replace(
'''.addCase(fetchOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })''',
'''.addCase(fetchOrdersThunk.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })'''
)

c = c.replace(
'''.addCase(fetchOrdersThunk.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.loading = false;
        state.items = action.payload;
      })''',
'''.addCase(fetchOrdersThunk.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.fetchStatus = 'success';
        state.items = action.payload;
      })'''
)

c = c.replace(
'''.addCase(fetchOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })''',
'''.addCase(fetchOrdersThunk.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })'''
)

c = c.replace(
'''.addCase(fetchOrderByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })''',
'''.addCase(fetchOrderByIdThunk.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })'''
)

c = c.replace(
'''.addCase(fetchOrderByIdThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        // Upsert into items list
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })''',
'''.addCase(fetchOrderByIdThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.fetchStatus = 'success';
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })'''
)

c = c.replace(
'''.addCase(fetchOrderByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })''',
'''.addCase(fetchOrderByIdThunk.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })'''
)

c = c.replace(
'''.addCase(createOrderThunk.pending, (state) => {
        state.creating = true;
        state.error = null;
      })''',
'''.addCase(createOrderThunk.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })'''
)

c = c.replace(
'''.addCase(createOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.creating = false;
        state.currentOrder = action.payload;
        // Prepend to history list
        state.items.unshift(action.payload);
      })''',
'''.addCase(createOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.createStatus = 'success';
        state.currentOrder = action.payload;
        state.items.unshift(action.payload);
      })'''
)

c = c.replace(
'''.addCase(createOrderThunk.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })''',
'''.addCase(createOrderThunk.rejected, (state, action) => {
        state.createStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })'''
)

c = c.replace(
'''.addCase(cancelOrderThunk.pending, (state) => {
        state.cancelling = true;
        state.error = null;
      })''',
'''.addCase(cancelOrderThunk.pending, (state) => {
        state.cancelStatus = 'loading';
        state.error = null;
      })'''
)

c = c.replace(
'''.addCase(cancelOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.cancelling = false;
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })''',
'''.addCase(cancelOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.cancelStatus = 'success';
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })'''
)

c = c.replace(
'''.addCase(cancelOrderThunk.rejected, (state, action) => {
        state.cancelling = false;
        state.error = action.payload as string;
      })''',
'''.addCase(cancelOrderThunk.rejected, (state, action) => {
        state.cancelStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })'''
)

c = c.replace(
    "export const selectOrdersLoading = (state: RootState) => state.orders.loading;",
    "export const selectOrdersLoading = (state: RootState) => state.orders.fetchStatus === 'loading';"
)
c = c.replace(
    "export const selectOrderCreating = (state: RootState) => state.orders.creating;",
    "export const selectOrderCreating = (state: RootState) => state.orders.createStatus === 'loading';"
)
c = c.replace(
    "export const selectOrderCancelling = (state: RootState) => state.orders.cancelling;",
    "export const selectOrderCancelling = (state: RootState) => state.orders.cancelStatus === 'loading';"
)

if "selectFetchStatus" not in c:
    c += "\nexport const selectFetchStatus = (state: RootState) => state.orders.fetchStatus;\n"

with open(path, 'w') as f:
    f.write(c)

print("Patched orderSlice")
