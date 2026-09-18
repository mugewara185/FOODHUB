# FOODHUB — END-TO-END REALTIME DELIVERY VERTICAL SLICE

## CONTEXT

You are working directly in:

* Repository: `mugewara185/FOODHUB`
* Branch: `dev/main`

Do NOT assume the repository architecture from this prompt alone. You must inspect the existing repository before modifying anything.

The previous Delivery Partner implementation claimed the following:

* Redux `deliveryPartnerSlice`
* Partner dashboard/history/earnings wiring
* Active Delivery state progression
* GPS simulation
* Socket.IO emits
* Shared map visualization

However, after inspection, the current implementation is still primarily a **frontend/local Redux simulation**.

The goal of this task is NOT simply to polish the Delivery Partner pages.

The goal is:

> **Turn the current delivery implementation into a coherent end-to-end delivery domain where the GPS movement is simulated, but the delivery state, partner identity, order relationship, realtime events, customer tracking, admin fleet tracking, and notifications behave like a real application.**

The final showcase should demonstrate:

```text
DELIVERY PARTNER
      │
      │ status/location
      ▼
 BACKEND DELIVERY DOMAIN
      │
      │ Socket.IO
      ├───────────────┐
      ▼               ▼
 CUSTOMER          ADMIN
 TRACKING          FLEET
      │
      ▼
 NOTIFICATIONS
```

The only intentionally simulated portion should be GPS movement.

Do not fake the rest of the architecture merely to make the UI look complete.

---

# 1. FIRST: INSPECT BEFORE CODING

Before changing anything, inspect and understand:

### Frontend

At minimum:

```text
web/src/features/deliveryPartner/
web/src/pages/_deliveryPartner/
web/src/features/orders/
web/src/pages/Orders/
web/src/shared/components/maps/
web/src/shared/layout/PartnerLayout.tsx
web/src/shared/layout/MainLayout.tsx
web/src/core/notifications/
web/src/core/ui/draggable/
web/src/core/ui/buttons/FloatingTrigger.tsx
web/src/core/dev/
web/src/app/store/
web/src/services/socket.ts
web/src/core/utils/api.ts
web/src/core/types/
```

Also locate the actual active versions of:

* Home
* Restaurant Listing
* Restaurant Details
* Orders
* Order Tracking

Do not modify historical/dev versions unless they are actually active.

### Backend

Find the actual backend/API root yourself.

Inspect:

* User model
* Order model
* restaurant model
* delivery-partner-related models
* controllers
* services
* routes
* Socket.IO initialization
* Socket.IO event handlers
* authentication middleware
* authorization/RBAC
* seed/factory data
* MongoDB connection
* existing order status logic

Do not assume the backend directory is called `server`, `backend`, or anything else.

### Existing architecture document

Use the repository's existing data architecture as context, but treat the actual current code as authoritative where it has evolved.

The architecture document already defines:

* `Order`
* delivery information
* `DeliveryPartner`
* order tracking
* Socket.IO tracking
* MongoDB collections

The document describes the intended order tracking flow as:

```text
Orders
  ↓
Track Order
  ↓
Socket.IO
  ↓
Delivery partner location
  ↓
Order status timeline
```

Preserve that architectural direction rather than introducing an unrelated system.

---

# 2. VERY IMPORTANT: DO NOT CREATE A SECOND ONLINE/OFFLINE TOGGLE

There is already an Online/Offline toggle in:

```text
web/src/shared/layout/PartnerLayout.tsx
```

The current code incorrectly keeps local state:

```ts
const [isOnline, setIsOnline] = useState(true);
```

while `deliveryPartnerSlice` separately owns:

```ts
status
isOnline
```

This creates two competing sources of truth.

Fix this.

## Required behavior

The partner availability state should conceptually be:

```text
OFFLINE
   │
   │ Go Online
   ▼
ONLINE
   │
   │ Accept Assignment
   ▼
ON_DELIVERY
   │
   │ Delivered
   ▼
ONLINE
   │
   │ Go Offline
   ▼
OFFLINE
```

The sidebar/global toggle is the single availability control.

Do NOT add another Online/Offline toggle to `ActiveDelivery`.

When the partner is:

```text
ON_DELIVERY
```

the sidebar should reflect that state.

Decide the appropriate UX for attempting to go offline during an active delivery. Prefer preventing an invalid transition and explaining why rather than silently corrupting state.

The state machine must not allow:

```text
ON_DELIVERY → OFFLINE
```

while an active delivery exists unless the domain explicitly supports an emergency/exception workflow.

---

# 3. ESTABLISH A REAL DELIVERY DOMAIN MODEL

The current frontend `DeliveryAssignment` is too UI-specific and contains mocked data.

Inspect the existing backend schema first.

Then establish the smallest appropriate delivery-domain representation.

Conceptually the domain needs to represent:

```text
Delivery
{
  id
  orderId
  partnerId

  status

  pickupLocation
  dropoffLocation
  currentLocation

  assignedAt
  acceptedAt
  pickedUpAt
  deliveredAt

  estimatedDeliveryTime
  updatedAt
}
```

Do NOT blindly copy this exact schema.

Adapt it to the existing backend architecture.

The critical relationships are:

```text
User
  │
  └── delivery_partner identity

Order
  │
  └── Delivery
        ├── partnerId
        ├── status
        ├── pickup
        ├── dropoff
        └── currentLocation
```

An Order and Delivery are related domain concepts but should not be conflated unnecessarily.

---

# 4. BACKEND MUST BE AUTHORITATIVE FOR DELIVERY STATE

The current frontend Redux slice performs state transitions locally.

That is not sufficient.

The backend should become authoritative for:

* assignment
* acceptance
* delivery status
* partner availability
* current delivery
* current location
* delivery ownership

Redux should become the frontend representation/cache of server state.

Use:

```text
Component
  ↓
Feature hook
  ↓
Delivery service
  ↓
API / Mock provider
  ↓
Backend
  ↓
MongoDB
```

and:

```text
Backend
  ↓
Socket.IO
  ↓
Redux/UI
```

Do not let UI components directly manipulate domain state in a way that bypasses the backend in API mode.

---

# 5. PRESERVE MOCK/API SWITCHING

FoodHub intentionally supports mock/API switching.

Do NOT remove this capability.

Use the existing environment configuration and provider/service architecture.

The desired architecture is:

```text
DeliveryRepository / DeliveryService
       │
       ├── API implementation
       │
       └── Mock implementation
```

or the simplest equivalent that fits the existing architecture.

Do not introduce a huge generic repository framework if the existing project does not need one.

## API mode

Real backend calls.

## Mock mode

The UI should still behave realistically.

Mock mode may simulate:

* assignments
* delivery state
* GPS movement
* realtime events

but should do so deterministically and through the same domain interfaces as API mode.

Do not scatter:

```ts
if (isMock) ...
```

through every component.

---

# 6. FIX THE PARTNER ID / ORDER ID CONFUSION

Inspect the current:

```text
web/src/pages/_deliveryPartner/ActiveDelivery.tsx
web/src/services/socket.ts
```

The current ActiveDelivery implementation calls:

```ts
socketService.updatePartnerLocation(activeAssignment.id, newLoc);
```

But `activeAssignment.id` represents the assignment/order identifier.

The socket method expects a partner identifier.

This is a domain-contract bug.

Fix the identity model.

Every realtime payload must make it clear whether an identifier means:

```text
orderId
deliveryId
partnerId
userId
```

Do not rely on ambiguous `id` fields.

Prefer explicit payloads such as:

```ts
{
  deliveryId,
  orderId,
  partnerId,
  location
}
```

where appropriate.

---

# 7. DEFINE ONE CANONICAL DELIVERY STATE MACHINE

The current partner states and customer states do not perfectly align.

Partner currently uses:

```text
assigned
accepted
arrived_pickup
picked_up
out_for_delivery
delivered
```

Customer tracking currently uses:

```text
preparing
ready
partner_assigned
picked_up
on_the_way
nearby
delivered
```

Do NOT simply rename random strings until everything compiles.

Define a canonical domain state model.

Then create adapters for presentation-specific terminology if necessary.

For example, conceptually:

```text
ORDER_CONFIRMED
PREPARING
READY_FOR_PICKUP
PARTNER_ASSIGNED
PARTNER_ARRIVED_PICKUP
PICKED_UP
OUT_FOR_DELIVERY
NEARBY
DELIVERED
```

Use the actual project terminology where possible.

The backend must validate legal transitions.

Examples:

```text
assigned → accepted
accepted → arrived_pickup
arrived_pickup → picked_up
picked_up → out_for_delivery
out_for_delivery → nearby
nearby → delivered
```

Do not allow arbitrary status mutation from the client.

---

# 8. PARTNER FLOW

Implement this complete flow:

```text
Partner Login
    ↓
Partner Dashboard
    ↓
Go Online
    ↓
Available Orders
    ↓
Assignment appears
    ↓
Accept
    ↓
ON_DELIVERY
    ↓
Active Delivery
    ↓
Arrived at Restaurant
    ↓
Confirm Pickup
    ↓
Start Delivery
    ↓
GPS simulator starts
    ↓
Socket location updates
    ↓
Customer sees movement
    ↓
Admin sees movement
    ↓
Partner marks Delivered
    ↓
Backend persists completion
    ↓
Customer receives delivered event
    ↓
Admin receives delivered event
    ↓
Partner returns ONLINE
    ↓
History/Earnings update
```

Every transition should be reflected through the domain/API/realtime architecture.

---

# 9. GPS SIMULATION

Keep GPS simulation.

It is useful for development and demonstration.

But isolate it as a reusable development capability.

Conceptually:

```text
GPS Simulator
    ↓
Location update
    ↓
Delivery service
    ↓
Backend/socket
```

Do NOT make `ActiveDelivery.tsx` itself responsible for the entire simulation engine.

Create the smallest reusable utility/hook/service appropriate to the project.

Requirements:

* deterministic movement
* configurable interval
* configurable speed/step
* pickup → customer movement
* stop when delivered
* cleanup on unmount
* no duplicate intervals
* no movement when not in the appropriate delivery state

Do not use random coordinates.

---

# 10. REALTIME SOCKET.IO CONTRACT

Inspect the actual backend Socket.IO implementation before changing event names.

Do not assume that the current frontend event names are correct.

Current frontend code references events such as:

```text
join_user_room
join_order_room
leave_order_room
order_status_update
order:status_changed
partner:location_updated
delivery:assigned
delivery:location
delivery:status
join_admin_fleet
leave_admin_fleet
notification
```

Determine which events actually exist server-side.

Then establish a coherent contract.

The important realtime flows are:

### Partner → backend

```text
partner location
delivery status
availability
```

### Backend → customer

```text
delivery assigned
delivery location
delivery status
```

### Backend → admin

```text
fleet location
fleet status
risk events
```

### Backend → user/partner

```text
notifications
```

Do not emit an event from the frontend merely because a similarly named listener exists.

Every event must have:

* clear producer
* clear consumer
* typed payload
* lifecycle
* authorization

---

# 11. SOCKET LIFECYCLE MUST BE CORRECT

Inspect:

```text
web/src/services/socket.ts
```

The current service is a singleton and has several broad listener methods.

Improve it without creating another socket framework.

Requirements:

* one connection per application context
* correct authentication identity
* reconnect handling
* room join after reconnect
* explicit room leave
* listener cleanup
* no duplicate listeners
* no broad `off(event)` that accidentally removes another feature's listener
* typed callbacks where practical

Pay special attention to:

```ts
unsubscribeFromOrder()
```

and the current pattern of removing listeners without always knowing which callback belongs to which consumer.

A customer tracking component must not accidentally remove an admin or another order's listeners.

---

# 12. CUSTOMER TRACKING — REUSE THE EXISTING IMPLEMENTATION

Do NOT create a second customer tracking feature.

The existing implementation is:

```text
web/src/features/orders/hooks/useDeliveryTracking.ts
web/src/features/orders/components/tracking/LiveDeliveryTracker.tsx
```

Reuse and improve it.

It already supports:

* partner information
* ETA
* distance
* status
* map
* floating/PIP mode
* draggable PIP

The goal is to make its data source real.

Desired flow:

```text
Partner GPS simulator
       ↓
Backend
       ↓
Socket.IO
       ↓
useDeliveryTracking()
       ↓
LiveDeliveryTracker
       ↓
moving partner marker
```

The customer should NOT receive the partner's simulated location by directly reading the partner's Redux store.

The realtime boundary must be respected.

---

# 13. USER MAP / PIP EXPERIENCE

Preserve the existing PIP concept.

The customer should be able to:

```text
Full tracking view
      ↓
Minimize
      ↓
Floating live map
```

The floating map should:

* remain live
* show partner movement
* show current status
* show ETA
* be draggable
* remain within viewport bounds
* remember position through existing draggable infrastructure
* restore to full tracking
* work on mobile
* not block important controls

Do not create a second drag system.

Reuse:

```text
core/ui/draggable/DraggableContainer
```

where appropriate.

---

# 14. SHARED MAP COMPONENT

The active shared map is:

```text
web/src/shared/components/maps/Map.tsx
```

It currently uses:

```text
Leaflet
react-leaflet
Carto raster tiles
```

Do NOT introduce another mapping library.

Do NOT blindly switch to Google Maps.

Improve the existing shared map.

Requirements:

* markers
* partner movement
* restaurant
* customer
* route
* popup information
* fit bounds
* recenter
* stable camera behavior
* loading/error handling where realistically possible

IMPORTANT:

The current route representation can be a straight polyline.

Do not present that as a real road navigation route.

If an existing routing backend/provider is already available, integrate it appropriately.

Otherwise clearly treat the line as the simulated/demo route.

Do not introduce an unnecessarily expensive mapping/routing service just for this task.

---

# 15. MAP CAMERA BEHAVIOR

The current `MapController` can continuously react to `center` changes.

For live delivery this can result in an unpleasant camera that constantly moves whenever the partner moves.

Improve the UX.

Desired behavior:

* initial fit to relevant points
* user can manually pan/zoom
* do not forcibly recenter on every GPS update
* provide a clear "recenter" control
* optionally provide "fit route" behavior
* preserve user interaction

This matters especially for the customer PIP map.

---

# 16. ADMIN DELIVERY DASHBOARD

The current:

```text
web/src/pages/admin/delivery/index.tsx
```

contains:

```ts
const mockFleet = [...]
```

This must NOT remain the source of truth in API mode.

Make Admin consume the same delivery domain.

Desired architecture:

```text
GET initial fleet snapshot
        +
Socket.IO fleet updates
        ↓
Admin delivery state
        ↓
Fleet map
        ↓
Partner details
        ↓
Operational metrics
```

The admin page should show:

* active deliveries
* online partners
* partner locations
* delivery status
* selected partner
* last update
* meaningful delivery metrics
* socket connection state
* loading state
* empty state
* error state

The fleet map should update when the partner GPS simulator moves.

Therefore:

```text
Partner Browser
       ↓
Backend
       ↓
Socket.IO
       ↓
Admin Browser
```

must actually work.

---

# 17. ADMIN COPILOT

The existing admin delivery page contains hardcoded statements such as:

```text
High Demand Zone Detected
Bandra West is experiencing 40% higher volume.
Recommending +₹20 surge pricing
Batching 3 orders...
```

Do not present fabricated operational intelligence as if it came from a real backend.

Inspect the existing Admin AI/Copilot infrastructure.

If a real endpoint/service exists, consume it.

If not, clearly classify the content as development/demo data or move it behind the existing mock provider.

Do not invent a fake AI backend merely to make the card dynamic.

The Admin AI page already exists elsewhere in the application. Reuse existing AI infrastructure where appropriate rather than creating another AI architecture.

---

# 18. NOTIFICATIONS — USE THE EXISTING CORE SYSTEM

There is already:

```text
web/src/core/notifications/notificationSlice.ts
```

with:

* notifications
* unreadCount
* markAsRead
* markAllAsRead
* clearAll

There is also:

```text
socketService.onNotification()
```

Use this.

The PartnerLayout currently has:

```tsx
<Badge badgeContent={3}>
```

This is hardcoded.

Replace it with the existing notification state.

The notification bell should become functional.

At minimum:

```text
Socket notification
      ↓
notificationSlice.addNotification()
      ↓
unreadCount
      ↓
AppBar badge
      ↓
Notification UI
```

Use meaningful delivery events.

### Partner examples

```text
New delivery available
Order assigned
Delivery accepted
Restaurant pickup reminder
Delivery completed
Earnings credited
Support/system alert
```

### Customer examples

```text
Order confirmed
Restaurant preparing
Partner assigned
Order picked up
Partner approaching
Order delivered
```

### Admin examples

```text
Delivery delayed
Partner offline during active delivery
Delivery risk
Fleet event
```

Do not spam notifications for every GPS update.

---

# 19. NOTIFICATION NAVIGATION

Notifications related to an order/delivery should be actionable.

For example:

```text
Partner delivery notification
      ↓
/partner/active
```

and:

```text
Customer delivery notification
      ↓
/orders/tracking/:id
```

Use the existing `orderId` field already present in `AppNotification`.

Do not invent an unrelated notification navigation system.

---

# 20. NOTIFICATION PERSISTENCE

`Store_V.ts` currently persists:

```ts
whitelist: ["cart", "notifications"]
```

Keep notification persistence.

But do NOT solve delivery persistence by blindly persisting the entire `deliveryPartner` slice.

Distinguish:

### Server-owned

```text
availability
active delivery
delivery status
current location
assignment
history
earnings
```

### Client-owned

```text
temporary UI state
PIP position
presentation preferences
```

Server-owned delivery state should be hydrated from API/backend.

Redux persistence should not become a fake database.

---

# 21. PARTNER DASHBOARD / HISTORY / EARNINGS

The current Redux implementation seeds values such as:

```text
todayDeliveries: 4
todayEarnings: 450
onlineHours: 3.5
avgRating: 4.8
acceptanceRate: 95
weeklyEarnings: 2100
totalEarnings: 15400
```

Inspect whether these values are currently mock-only.

In API mode:

* do not claim these are backend values if they aren't
* fetch real partner metrics if backend support exists
* otherwise clearly use mock provider values

After a completed delivery:

```text
backend delivery completion
      ↓
history
      ↓
earnings/metrics
```

should update coherently.

Do not rely only on local Redux increments if API mode is active.

---

# 22. ACTIVE DELIVERY ACTIONS MUST BE SERVER-VALIDATED

Current UI actions include:

```text
Arrived at Restaurant
Confirm Pickup
Start Delivery
Mark Delivered
```

Keep this UX.

But API mode must follow:

```text
button
 ↓
domain command
 ↓
backend validation
 ↓
MongoDB update
 ↓
Socket event
 ↓
all clients update
```

Do not allow the UI to claim:

```text
delivered
```

if the backend rejects the transition.

The backend should reject illegal transitions.

The frontend should display the error cleanly.

---

# 23. AUTHORIZATION

This is important.

A customer must not be able to subscribe to arbitrary delivery data.

A partner must not be able to mutate another partner's delivery.

An admin may access fleet data according to existing RBAC.

Enforce:

```text
Customer
  → own order/delivery

Delivery Partner
  → assigned deliveries

Admin
  → fleet/operational data
```

Use the existing authentication and authorization middleware.

Do not build a parallel permission system.

---

# 24. COORDINATE NORMALIZATION

Inspect all existing coordinate representations.

The project may contain:

```text
{ lat, lng }
```

and MongoDB/GeoJSON representations:

```text
{
  type: "Point",
  coordinates: [lng, lat]
}
```

Do NOT let both formats leak randomly throughout the application.

Normalize coordinates at the API/domain boundary.

Frontend map code should consistently receive:

```ts
{
  lat: number;
  lng: number;
}
```

Backend persistence may use GeoJSON.

If conversion is needed, centralize it.

This is a reusable Core capability worth keeping.

---

# 25. DO NOT CREATE DIRECT COMPONENT FETCHING

Avoid patterns like:

```ts
fetch(...)
axios(...)
socket.emit(...)
```

scattered directly through page components.

Prefer:

```text
Component
 ↓
Hook
 ↓
Service
 ↓
Provider/API
```

Components should primarily deal with:

* presentation
* user interaction
* dispatching domain commands
* displaying state

This is one of the main architectural objectives of this project.

---

# 26. ERROR / LOADING / EMPTY STATES

Every delivery surface should handle:

### Loading

```text
Loading delivery...
Loading fleet...
Connecting to live tracking...
```

### Error

```text
Unable to load delivery
Live tracking disconnected
Unable to update delivery
```

### Empty

```text
No active delivery
No available assignments
No active fleet deliveries
```

Do not leave blank screens.

---

# 27. REALTIME DISCONNECT UX

If Socket.IO disconnects:

Customer:

```text
Live tracking temporarily disconnected
Retrying...
```

Partner:

```text
Connection lost
Location updates paused
Reconnecting...
```

Admin:

```text
Fleet realtime connection lost
```

When reconnected:

* rejoin required rooms
* fetch/reconcile current state if necessary
* resume realtime updates
* avoid duplicate listeners

This should be resilient rather than merely optimistic.

---

# 28. LOGGER / OBSERVABILITY

Use the project's existing structured logger.

Do not create another logging framework.

Meaningful delivery events should include things such as:

```text
DELIVERY_TRACKING_STARTED
DELIVERY_TRACKING_STOPPED
DELIVERY_SOCKET_CONNECTED
DELIVERY_SOCKET_DISCONNECTED
DELIVERY_SOCKET_ERROR
DELIVERY_LOCATION_UPDATED
DELIVERY_STATUS_CHANGED
DELIVERY_ASSIGNED
DELIVERY_COMPLETED
MAP_INITIALIZED
MAP_LOAD_FAILED
DELIVERY_ROUTE_UPDATED
DELIVERY_PROVIDER_CHANGED
```

Do not log every GPS update at full frequency if that creates noise.

Throttle/sample high-frequency location logs.

Avoid replacing structured logging with random `console.log`.

There are currently some `console.log` statements in Redux/socket infrastructure. Clean up meaningful production-path logging where appropriate, but don't perform an unrelated logger rewrite.

---

# 29. FLOATINGTRIGGER / LOGGER UI

While touching Core UI, inspect:

```text
web/src/core/ui/buttons/FloatingTrigger.tsx
web/src/core/ui/draggable/DraggableContainer
web/src/core/dev/
```

The existing `FloatingTrigger` already exposes:

```ts
onClick
onDoubleClick
```

and uses `DraggableContainer`.

Preserve existing consumers.

If the intended interaction is:

```text
single click → open logger
double click → reset position
drag → move
```

implement that without breaking drag behavior.

If triple-click/reset is already the intended product behavior elsewhere, preserve the existing contract rather than inventing a conflicting one.

Important:

* distinguish click from drag
* avoid accidental single-click when double-clicking
* support mouse/touch
* preserve keyboard accessibility
* cleanup timers/listeners

Then ensure the logger console itself can use the existing draggable infrastructure.

Do NOT add another drag library.

---

# 30. IMAGE FALLBACK

This task can also clean up the obvious image reliability issue across the active showcase.

Create/reuse a small reusable image fallback mechanism for:

* restaurant cards
* food item cards
* restaurant details
* partner avatars

It must handle:

```text
undefined
null
empty string
invalid URL
image load error
```

Do not duplicate `onError` handlers across dozens of components.

Use an appropriate existing placeholder/fallback asset if one exists.

---

# 31. FAVORITES

On active restaurant cards:

* remove restaurant favorite button if that is the intended current UX
* remove dead imports/handlers

For food item cards:

* add favorite toggle if the active design contains an appropriate control

But do NOT implement:

```ts
const [favorite, setFavorite] = useState(false)
```

as the source of truth.

The architecture document already defines a possible Favorite entity with:

```text
userId
restaurantId?
foodItemId?
createdAt
```

If backend support exists, wire it.

If backend support does not exist, use the existing mock/API architecture and clearly isolate the mock implementation.

The state should remain consistent across:

```text
Restaurant Details
Favorites
Home/listing
food cards
```

Do not create a second favorite system.

---

# 32. GLOBAL SEARCH DUPLICATION

Inspect the active:

```text
Home
Restaurants
Restaurant Details
Search
MainLayout/AppBar
```

If the active page already has a prominent search control serving the same purpose as the global AppBar search:

```text
hide/collapse the duplicate global search
```

Do not scatter large pathname-specific `if/else` blocks throughout the layout.

If a small page capability/context mechanism is genuinely useful, introduce one.

Keep it simple.

---

# 33. DO NOT TOUCH UNRELATED DOMAINS

For this implementation pass:

### Priority

```text
Core / Dev
Delivery Partner
User Orders / Tracking
Admin Delivery
Notifications
```

Do not spend the quota redesigning:

* Owner
* unrelated admin pages
* unrelated authentication screens
* unrelated UI versions

Only touch another domain if it is required to complete the delivery vertical slice.

MCP is OUT OF SCOPE.

---

# 34. IMPORTANT: DO NOT OVER-ENGINEER

Do NOT introduce:

* microservices
* CQRS
* event sourcing
* Kafka
* elaborate message brokers
* generic enterprise GIS abstraction
* second map library
* second socket framework
* second notification framework
* second drag framework
* speculative repository abstractions everywhere

Use:

```text
simple
→ reusable
→ extensible
```

Build reusable abstractions only where this delivery feature demonstrates a recurring engineering problem.

---

# 35. ACTIVE PAGE SCOPE

Only polish active/default implementations.

Do not spend the task rewriting old historical versions simply because they exist in the repository.

For each affected domain:

1. identify the route
2. identify the actual rendered component/version
3. modify that implementation
4. verify the route

---

# 36. TEST THE ACTUAL PRODUCT, NOT JUST TYPESCRIPT

`tsc --noEmit` is useful but insufficient.

At minimum run:

```bash
npm install
npm run build
npm run lint
```

in the appropriate frontend/backend locations as applicable.

Run existing tests.

Fix errors introduced by your changes.

Then perform manual E2E verification.

---

# 37. REQUIRED E2E VERIFICATION

Use separate browser sessions/accounts where necessary.

## Browser A — Delivery Partner

```text
Login as delivery partner
        ↓
Partner Dashboard
        ↓
Go Online
        ↓
Available Orders
        ↓
Assignment appears
        ↓
Accept
        ↓
Active Delivery
        ↓
Arrived at restaurant
        ↓
Confirm pickup
        ↓
Start delivery
        ↓
GPS simulation begins
```

Verify:

* partner marker moves
* backend receives updates
* partner UI reflects state
* socket connection remains healthy

---

## Browser B — Customer

```text
Login as customer
        ↓
Orders
        ↓
Track active order
        ↓
Live Delivery Tracker
```

Verify:

* partner appears
* marker moves
* status changes
* ETA changes
* distance changes where supported
* PIP works
* minimize/restore works
* drag works
* no duplicate updates

---

## Browser C — Admin

```text
Login as admin
        ↓
/admin/delivery
```

Verify:

* partner appears
* fleet count updates
* partner marker moves
* status changes
* selected partner details update
* realtime disconnect state is visible
* no hardcoded fleet remains in API mode

---

# 38. DELIVERY COMPLETION TEST

From Browser A:

```text
Mark Delivered
```

Then verify across all clients:

### Partner

```text
active delivery cleared
status → ONLINE
history updated
earnings updated
```

### Customer

```text
delivery → DELIVERED
ETA → complete/zero/appropriate final state
map/tracking reflects completion
notification appears
```

### Admin

```text
delivery no longer active
fleet metrics update
partner status updates
```

This must happen through the domain/backend/realtime flow, not by directly mutating unrelated browser Redux states.

---

# 39. REFRESH / RECONNECT TEST

While delivery is active:

```text
refresh Partner browser
refresh Customer browser
disconnect/reconnect socket
```

Verify that the system can recover from server/API state.

Do not rely on Redux persistence as the authoritative delivery database.

After refresh:

```text
GET current delivery state
+
join appropriate socket room
+
receive future updates
```

should restore the UI.

---

# 40. MOCK MODE TEST

Switch:

```text
VITE_DATA_SOURCE=mock
```

and verify the complete delivery experience still works.

The same UI should operate through the mock provider.

Then switch back to:

```text
VITE_DATA_SOURCE=api
```

and verify the backend path.

Do not duplicate the UI implementation between mock/API modes.

---

# 41. FINAL ARCHITECTURE SHOULD LOOK APPROXIMATELY LIKE THIS

```text
                    ┌──────────────────────┐
                    │ Delivery Partner UI  │
                    └──────────┬───────────┘
                               │
                         domain commands
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Delivery Service     │
                    └──────────┬───────────┘
                               │
                     ┌─────────┴─────────┐
                     ▼                   ▼
                Mock Provider       API Provider
                     │                   │
                     │                   ▼
                     │             Backend Delivery
                     │                   │
                     │             MongoDB / DB
                     │                   │
                     │             Socket.IO
                     │                   │
                     └─────────┬─────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
             Partner        Customer       Admin
              Redux         Redux         Redux/UI
                 │             │             │
                 ▼             ▼             ▼
             Active         Tracking       Fleet
             Delivery         Map            Map
                 │
                 ▼
           GPS Simulator
```

The simulator is development infrastructure.

The delivery state itself is not.

---

# 42. IMPLEMENTATION ORDER

Work in this exact order.

## P0 — Understand

Inspect:

* backend
* current delivery code
* socket implementation
* notification infrastructure
* order tracking
* admin delivery
* authentication/RBAC
* map
* mock/API switching

Document important findings briefly before modifying code.

## P1 — Delivery domain contract

Implement:

* canonical delivery model
* canonical status transitions
* partner/order/delivery identity
* coordinate normalization

## P2 — Backend/API

Implement:

* delivery persistence/relationship
* assignment
* status mutation
* location update
* partner availability
* authorization
* initial delivery/fleet queries

Only add collections/models if the existing schema genuinely requires them.

## P3 — Socket.IO

Implement:

* typed event contract
* rooms
* lifecycle
* reconnect
* cleanup
* customer updates
* partner updates
* admin fleet updates

## P4 — Partner UI

Remove duplicate Online/Offline state.

Wire:

```text
sidebar
→ delivery domain
→ API/mock
→ backend
```

Then finish ActiveDelivery.

## P5 — Customer UI

Wire existing:

```text
useDeliveryTracking
LiveDeliveryTracker
```

to the realtime delivery stream.

## P6 — Admin

Replace API-mode hardcoded `mockFleet`.

Use initial snapshot + realtime events.

## P7 — Notifications

Connect socket notifications to the existing notification slice and AppBar.

## P8 — Core/UI refinements

Only after the delivery flow works:

* logger dragging
* FloatingTrigger interaction
* image fallback
* favorites
* search duplication
* map UX polish

## P9 — Verification

Run:

```text
build
lint
tests
2-client E2E
3-client E2E
refresh
reconnect
mock mode
API mode
```

---

# 43. CODE QUALITY REQUIREMENTS

Maintain:

* strict TypeScript
* typed API responses
* typed socket payloads
* clear feature boundaries
* server-authoritative mutations
* reusable services/hooks
* proper cleanup
* meaningful error states
* no dead imports
* no unused handlers
* no accidental duplicate listeners
* no unnecessary `any`
* no random mock state generated during renders

Do not rewrite large unrelated parts of the application.

Prefer small vertical slices that can be verified.

---

# 44. FINAL REPORT REQUIRED

At the end, provide a concise but technically accurate report containing:

## A. What you inspected

Backend:

```text
models
controllers
routes
socket implementation
auth/RBAC
```

Frontend:

```text
delivery
tracking
map
notifications
admin
partner layout
```

## B. What changed

List actual files.

Separate:

```text
Core/reusable
Delivery Partner
Backend
Customer Tracking
Admin
Notifications
UI polish
```

## C. Architecture

Show the final:

```text
Partner → Backend → Socket.IO → Customer/Admin
```

flow.

## D. Mock/API behavior

Explain exactly what is mocked and what is real.

The intended answer should be:

```text
GPS movement = mocked
delivery domain = real in API mode
state transitions = backend-authoritative
realtime = Socket.IO
customer/admin = realtime consumers
```

if the implementation successfully reaches that state.

## E. Verification

Report:

```text
TypeScript
Build
Lint
Tests
Partner → Customer realtime
Partner → Admin realtime
Notifications
Refresh
Reconnect
Mock mode
API mode
```

Do NOT claim something is verified if you only inspected the code.

Use:

```text
VERIFIED
UNVERIFIED
BLOCKED
```

accurately.

## F. Remaining limitations

List only genuine remaining limitations.

Do not hide architectural gaps behind phrases such as:

> "statically verified"

if the feature has not been runtime tested.

---

# FINAL SUCCESS CRITERION

Do not consider this implementation complete merely because:

```text
tsc passes
Redux works
mock data renders
GPS moves locally
```

Consider the delivery vertical slice complete only when the following conceptual flow works:

```text
Partner goes ONLINE
       ↓
receives assignment
       ↓
accepts assignment
       ↓
backend records delivery
       ↓
partner progresses delivery
       ↓
mock GPS moves partner
       ↓
backend receives location
       ↓
Socket.IO broadcasts location
       ├───────────────┐
       ▼               ▼
Customer map        Admin fleet
moves               map moves
       │               │
       └───────┬───────┘
               ▼
        partner completes
        delivery
               ↓
        backend records
        delivered
               ↓
      Socket.IO broadcasts
               ↓
      Customer + Admin update
               ↓
       Partner returns ONLINE
               ↓
       History + earnings
               ↓
       Notifications
```

That is the target.

The purpose of this implementation is not to create more delivery UI.

The purpose is to establish a **real reusable realtime domain pattern** inside FoodHub that can later be reused for other operational domains.
