import re
with open('web/src/features/orders/orderSlice.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "import { logger } from '../../core/dev/logger';",
    "import { logger } from '../../core/dev/logger';\nimport { normalizeError, type AsyncStatus, type NormalizedApiError } from '../../core/utils/asyncState';"
)

c = re.sub(
    r'export interface OrderState \{[\s\S]*?error: string \| null;\n\}',
    '''export interface OrderState {
  items: Order[];
  currentOrder: Order | null;
  fetchStatus: AsyncStatus;
  createStatus: AsyncStatus;
  cancelStatus: AsyncStatus;
  error: NormalizedApiError | null;
}''',
    c
)

c = re.sub(
    r'const initialState: OrderState = \{[\s\S]*?error: null,\n\};',
    '''const initialState: OrderState = {
  items: [],
  currentOrder: null,
  fetchStatus: 'idle',
  createStatus: 'idle',
  cancelStatus: 'idle',
  error: null,
};''',
    c
)

c = c.replace("return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch orders');", "return rejectWithValue(normalizeError(err));")
c = c.replace("return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch order');", "return rejectWithValue(normalizeError(err));")
c = c.replace("return rejectWithValue(err instanceof Error ? err.message : 'Failed to place order');", "return rejectWithValue(normalizeError(err));")
c = c.replace("return rejectWithValue(err instanceof Error ? err.message : 'Failed to cancel order');", "return rejectWithValue(normalizeError(err));")
c = c.replace("return rejectWithValue(err instanceof Error ? err.message : 'Failed to submit review');", "return rejectWithValue(normalizeError(err));")

c = re.sub(
    r'\.addCase\(fetchOrdersThunk\.pending, \(state\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchOrdersThunk.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })''',
    c
)
c = re.sub(
    r'\.addCase\(fetchOrdersThunk\.fulfilled, \(state, action: PayloadAction<Order\[\]>\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchOrdersThunk.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.fetchStatus = 'success';
        state.items = action.payload;
      })''',
    c
)
c = re.sub(
    r'\.addCase\(fetchOrdersThunk\.rejected, \(state, action\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchOrdersThunk.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })''',
    c
)

c = re.sub(
    r'\.addCase\(fetchOrderByIdThunk\.pending, \(state\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchOrderByIdThunk.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })''',
    c
)
c = re.sub(
    r'\.addCase\(fetchOrderByIdThunk\.fulfilled, \(state, action: PayloadAction<Order>\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchOrderByIdThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.fetchStatus = 'success';
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })''',
    c
)
c = re.sub(
    r'\.addCase\(fetchOrderByIdThunk\.rejected, \(state, action\) => \{[\s\S]*?\}\)',
    '''.addCase(fetchOrderByIdThunk.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })''',
    c
)

c = re.sub(
    r'\.addCase\(createOrderThunk\.pending, \(state\) => \{[\s\S]*?\}\)',
    '''.addCase(createOrderThunk.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })''',
    c
)
c = re.sub(
    r'\.addCase\(createOrderThunk\.fulfilled, \(state, action: PayloadAction<Order>\) => \{[\s\S]*?\}\)',
    '''.addCase(createOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.createStatus = 'success';
        state.currentOrder = action.payload;
        state.items.unshift(action.payload);
      })''',
    c
)
c = re.sub(
    r'\.addCase\(createOrderThunk\.rejected, \(state, action\) => \{[\s\S]*?\}\)',
    '''.addCase(createOrderThunk.rejected, (state, action) => {
        state.createStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })''',
    c
)

c = re.sub(
    r'\.addCase\(cancelOrderThunk\.pending, \(state\) => \{[\s\S]*?\}\)',
    '''.addCase(cancelOrderThunk.pending, (state) => {
        state.cancelStatus = 'loading';
        state.error = null;
      })''',
    c
)
c = re.sub(
    r'\.addCase\(cancelOrderThunk\.fulfilled, \(state, action: PayloadAction<Order>\) => \{[\s\S]*?\}\)',
    '''.addCase(cancelOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.cancelStatus = 'success';
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })''',
    c
)
c = re.sub(
    r'\.addCase\(cancelOrderThunk\.rejected, \(state, action\) => \{[\s\S]*?\}\)',
    '''.addCase(cancelOrderThunk.rejected, (state, action) => {
        state.cancelStatus = 'error';
        state.error = action.payload as NormalizedApiError;
      })''',
    c
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

with open('web/src/features/orders/orderSlice.ts', 'w') as f:
    f.write(c)
