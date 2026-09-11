# Orders Domain Context

## Current State
The Order Domain is functionally complete for the customer flow. It bridges the cart selection, checkout process, order creation, order history, and real-time live tracking. It fully respects the \VITE_DATA_SOURCE\ environment variable (api vs mock).

## Architecture & Wiring
- **Redux Slice (\orderSlice.ts\)**: Uses \createAsyncThunk\ to interface with \orderApi.ts\. The slice tracks \items\ (history) and \currentOrder\ (most recently created or tracked order).
- **Real-Time Integration (\socket.ts\)**: A globally established Socket.io connection listens to \order_status_update\ events. \App.tsx\ handles the global listener and dispatches \updateOrderStatusLocally\ to seamlessly mutate the Redux state.
- **Notifications**: Backend pushes \
otification\ events directly to the user's socket room, which are intercepted globally and rendered using the shared \Toast\ component.
- **Backend Authority**: Prices and \	otalAmount\ are securely re-calculated on the backend (\order.controller.ts\) based on the authoritative \Restaurant.menu\, completely ignoring client-provided pricing.

## Important Decisions
- **Decoupling Tracking UI from Socket**: The \LiveDeliveryTracker\ shared component is dumb; it receives \orderStatus\ as a prop rather than binding to the socket itself. The \OrderTrackingContainer\ retrieves the live order from Redux.
- **Simulated Progression**: To demonstrate real-time functionality without an owner app, the backend's \createOrder\ controller currently starts a background simulation that automatically steps the order through [confirmed -> preparing -> out_for_delivery -> delivered] at 10-second intervals.

## Known Issues / Limitations
- Payment gateway is stubbed; currently defaults to 'cash'.
- Driver assignment and live driver GPS updates are mocked in the \LiveDeliveryTracker\.
- Real owner/admin application flows are required to replace the automated simulation script.

