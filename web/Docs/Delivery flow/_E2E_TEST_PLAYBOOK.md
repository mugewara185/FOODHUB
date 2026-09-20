# Foodhub Delivery — End-to-End Test Playbook

This playbook provides step-by-step instructions for verifying the full delivery pipeline. It is designed to be executed manually by a developer or QA tester.

### Global Prerequisites
- MongoDB is running locally.
- Backend API server is running (`cd API && npx ts-node src/server.ts`).
- Frontend Vite server is running (`cd web && npm run dev`).
- Open three separate browser profiles (or use incognito/different browsers) to represent:
  - **Browser A (Partner)**: Logged in as `admin0@test.zom` (or equivalent partner user).
  - **Browser B (Customer)**: Logged in as a standard user.
  - **Browser C (Admin)**: Logged in as `admin0@test.zom` (or equivalent admin user).

---

### Scenario 1 — Partner Goes Online

**Preconditions:**
- Browser A is on `/partner/active`.
- Network tab is open.

**Steps:**
- [ ] In Browser A, verify the map renders and the current status is `OFFLINE`.
- [ ] Click the toggle button to go **ONLINE**.

**Pass Criteria:**
- [ ] The toggle switches to ONLINE visually.
- [ ] Network tab shows a successful `PATCH /api/delivery/partner/me/status` with `200 OK`.
- [ ] A success toast/notification appears confirming status change.

**Common Failure Modes:**
- *401/403 Error*: The user token does not have `delivery_partner` roles.
- *500 Error*: The frontend sent an invalid token (e.g., `"Bearer null"`).

---

### Scenario 2 — Dev Endpoint Creates a Delivery

**Preconditions:**
- The partner is online.
- The dev endpoint `/api/dev/assign-partner` is accessible.

**Steps:**
- [ ] In a terminal, run the dev endpoint to assign an existing unassigned order to the partner:
  ```bash
  curl -X POST http://localhost:5000/api/dev/assign-partner
  ```
*(Note: If no unassigned orders exist, create a new order from Browser B first via the normal checkout flow).*

**Pass Criteria:**
- [ ] The curl response returns `200 OK` with the assigned `deliveryId`.

**Common Failure Modes:**
- *404 Error*: No unassigned orders or no online partners available. Make sure Scenario 1 succeeded.

---

### Scenario 3 — Partner Sees the Active Delivery

**Preconditions:**
- Scenario 2 just completed.

**Steps:**
- [ ] Switch to Browser A (`/partner/active`).
- [ ] Observe the UI automatically without refreshing the page.

**Pass Criteria:**
- [ ] The UI updates immediately to show the "Order Details" and map routing without needing a manual refresh.
- [ ] Three markers are visible: Your Location (Partner), Restaurant, and Customer.

**Common Failure Modes:**
- *No UI update*: The socket `delivery:assigned` event failed to emit to the partner's room, or the frontend socket hook isn't catching it.

---

### Scenario 4 — Partner Starts GPS Simulation

**Preconditions:**
- Partner has an active delivery on the screen.

**Steps:**
- [ ] In Browser A, ensure the GPS simulation triggers (either automatically on load of the active delivery or via a button if configured).
- [ ] Watch the map on Browser A.

**Pass Criteria:**
- [ ] The Partner marker moves steadily along the route toward the restaurant.

**Common Failure Modes:**
- *Marker static*: The simulator condition (`!!activeAssignment && !!targetLoc`) isn't met or the hook is disabled.

---

### Scenario 5 — Customer Sees the Partner Marker Move

**Preconditions:**
- Customer has placed the order assigned in Scenario 2.
- Browser B is on the order tracking page (`/orders/track/{orderId}`).

**Steps:**
- [ ] In Browser B, observe the live tracking map.
- [ ] Compare the Partner marker position in Browser B with the marker position in Browser A.

**Pass Criteria:**
- [ ] The Partner marker in Browser B moves in real-time, syncing with Browser A's movement.

**Common Failure Modes:**
- *No marker rendering*: The customer frontend isn't subscribing to `delivery:location`.
- *Marker static*: The backend isn't broadcasting the location to the order room.

---

### Scenario 6 — Admin Fleet Sees the Partner Marker Move

**Preconditions:**
- Browser C is on the Admin Delivery Dashboard (`/admin/delivery`).

**Steps:**
- [ ] In Browser C, observe the fleet map.
- [ ] Locate the marker for the active partner.

**Pass Criteria:**
- [ ] The marker moves in real-time in sync with the simulator running in Browser A.
- [ ] The partner's status chip in the list shows `on_delivery` or `assigned`.

**Common Failure Modes:**
- *Marker missing*: The admin hook `useAdminFleet` isn't mapping `p.currentLocation` properly.
- *Marker static*: The admin didn't successfully join the `admin_fleet` socket room.

---

### Scenario 7 — Partner Marks Delivered, All Three Browsers Update

**Preconditions:**
- Partner is actively simulating delivery.

**Steps:**
- [ ] In Browser A, simulate picking up the order and dropping it off (click "Picked Up" and then "Mark Delivered").
- [ ] Observe Browsers A, B, and C simultaneously.

**Pass Criteria:**
- [ ] **Browser A (Partner)**: Resets to the idle online state looking for new orders.
- [ ] **Browser B (Customer)**: Transitions to the "Delivered" state (e.g., success message, no map).
- [ ] **Browser C (Admin)**: The partner drops off the "active deliveries" list and their status returns to `available` (online).
- [ ] **Database**: Verify in MongoDB:
  ```javascript
  db.deliveries.findOne({ partnerId: <partnerId> }).status // should be 'delivered'
  ```

---

### Scenario 8 — Refresh Recovery

**Preconditions:**
- Run Scenario 2 to assign a new active delivery to the partner.
- The simulator is actively moving.

**Steps:**
- [ ] Run the following query in MongoDB to inspect the exact database state:
  ```javascript
  // Connect via mongosh to FOODHUB2
  db.deliveries.findOne({ status: { $in: ['assigned', 'on_delivery'] } }, { status: 1, currentLocation: 1 })
  ```
- [ ] Refresh Browser B (Customer).
- [ ] Refresh Browser C (Admin).
- [ ] Refresh Browser A (Partner).

**Pass Criteria:**
- [ ] After refreshing, all three browsers instantly recover the exact same active state (map markers render exactly where the DB query showed they should be).
- [ ] The GPS simulator cleanly resumes emitting from the recovered location in Browser A.

---

### Scenario 9 — Socket Disconnect and Reconnect

**Preconditions:**
- Active delivery in progress.

**Steps:**
- [ ] In Browser A, stop the API server terminal temporarily (Ctrl+C).
- [ ] Observe the socket connection indicator in the UI (if exposed by `useDeliverySocket`, typically a Wi-Fi icon turning red or offline).
- [ ] Restart the API server (`cd API && npx ts-node src/server.ts`).
- [ ] Observe the connection indicator.

**Pass Criteria:**
- [ ] The UI reflects the offline state when the server dies.
- [ ] The UI cleanly transitions back to the connected state automatically when the server comes back online.
- [ ] Live tracking safely resumes without a hard page reload.

---

### Scenario 10 — Confirm the Data is REAL, Not Mocked

**Preconditions:**
- Active delivery is assigned and GPS simulator is running in Browser A.

**Steps:**
- [ ] At Time T1, visually note the exact intersection/street the partner marker is on in Browser B (Customer).
- [ ] In a terminal, run this exact MongoDB query to fetch the canonical backend coordinate:
  ```bash
  mongosh FOODHUB2 --eval "db.deliveries.findOne({ status: { `$in`: ['assigned', 'on_delivery'] } }, { currentLocation: 1 }).currentLocation.coordinates"
  ```
- [ ] **Verify T1**: The printed `[lng, lat]` arrays from MongoDB must geometrically match the visual marker in the browser.
- [ ] Wait 10 seconds (allow the simulator to move the marker further down the route).
- [ ] At Time T2, re-run the exact same `mongosh` query.

**Pass Criteria:**
- [ ] The returned MongoDB coordinates have strictly **CHANGED**.
- [ ] This conclusively proves that the simulator isn't just a client-side visual trick — it is actively pushing telemetry across the network, saving it to disk, and rebroadcasting it to the customer.

---

### Scenario 11 — Kill the Dev Endpoint (Prod Simulation)

**Preconditions:**
- A production environment configuration (set `NODE_ENV=production`).

**Steps:**
- [ ] Attempt to call the dev assignment endpoint:
  ```bash
  curl -X POST http://localhost:5000/api/dev/assign-partner
  ```

**Pass Criteria:**
- [ ] The API rejects the request with a `403 Forbidden` or `404 Not Found` (as the dev routes should be entirely stripped or locked out in prod environments).

---

### Scenario 12 — Partner Tries to Go Offline While on Delivery

**Preconditions:**
- Browser A is actively assigned to an order.

**Steps:**
- [ ] In Browser A, attempt to click the toggle button to go **OFFLINE**.

**Pass Criteria:**
- [ ] The API rejects the status change with a `400 Bad Request` ("Cannot go offline while on delivery").
- [ ] A failure toast is displayed to the partner.
- [ ] The UI toggle reverts / remains on **ONLINE**.
