# Delivery Partner Domain Context

## Current State
The Delivery Partner Domain is functionally complete, modeling the operational workflow from availability state to delivery completion.

## Architecture & Wiring
- **Redux Slice (`deliveryPartnerSlice.ts`)**: Manages the core operational state including `status` (OFFLINE/ONLINE/ON_DELIVERY), `activeAssignment`, `availableAssignments`, driver location, history, and earnings stats.
- **Availability State**: Managed locally via Redux. Going online fetches initial simulated mock orders for demo purposes.
- **State Machine**: 
  - `assigned` -> partner sees in `AvailableOrders`
  - `accepted` -> moves to `ActiveDelivery`
  - `arrived_pickup` -> UI advances
  - `picked_up` -> UI advances
  - `out_for_delivery` -> map simulation begins moving marker
  - `delivered` -> adds to history, calculates earnings, goes back to `ONLINE`
- **GPS Simulation**: Controlled on the frontend in `ActiveDelivery.tsx`. A `setInterval` simulates gradual interpolation from driver location towards the next targeted destination (pickup or dropoff) and emits real-time updates.
- **Real-Time Integration (`socket.ts`)**: The frontend emits `delivery_status_update` and `driver_location_update` events whenever state transitions occur or GPS simulation ticks.
- **Observability**: Uses the existing application socket context to log and propagate events.

## Known Limitations & Future Work
- The simulation handles happy-paths well, but edge cases like network disconnects during `ON_DELIVERY` will wipe the redux state unless redux-persist whitelists this slice.
- Real API endpoints need to be wired once the backend architecture supports delivery partner assignments natively.
- Driver assignment is currently self-served (mocking available orders pool).
- Real GPS plugin is pending mobile wrapper implementation.
