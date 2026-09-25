# FoodHub — Testing Strategy
> Reference for all U-session Phase 3 verification steps.
> Commit baseline: `0b34297d404b1f68f9c25fcf50423cb0534e2d42`

---

## 1. Test Layers

Three layers exist. Only Layers 1 and 2 are exercised by U-sessions. Layer 3 is the human's responsibility after all sessions are committed.

### Layer 1 — Unit (reducers + pure helpers)
**What belongs here:** Redux reducer logic, selector computations, pure utility functions (normalizers, formatters).
**What the U-sessions touch:** `orderSlice.updateOrderStatusLocally`, `notificationSlice.addNotification` (dedup logic), `deliveryPartnerSlice.deliveryCompleted`.
**Tool:** `npx tsc --noEmit` on touched files is the minimum bar. Actual jest unit tests are out of scope for portfolio delivery.
**Verification command pattern:**
```powershell
npx tsc --noEmit -p web/tsconfig.app.json 2>&1 | Select-String "<touched-file-basename>"
```
Expected: empty output (no errors in touched files).

### Layer 2 — Integration (thunk + API + slice round-trip)
**What belongs here:** An async thunk is dispatched → real HTTP call is made → backend responds → slice state is updated.
**What the U-sessions touch:** U0 (env gate), U1 (adminGetAllOrders), U3 (ownerRestaurant thunk), U6 (submitReview).
**Tool:** A headless Node script that hits the running local backend directly. No browser. No Redux store — just `fetch` + assertions. See Section 5 for the skeleton.
**Verification command pattern:**
```powershell
node docs/scripts/<session>-verify.mjs 2>&1
```
The script exits 0 on pass, 1 on failure, and prints raw step output.

### Layer 3 — E2E Headless (full multi-role flow)
**What belongs here:** The 15-step demo script from `docs/uiCompletionPlan.md Section 2`. Requires all four roles, running backend, running frontend dev server.
**Not run by Gemini.** Run by the human after committing all sessions. Use Playwright or manual browser walkthrough.

---

## 2. What NOT to Test

These are explicitly out of scope for U-session verification:

| Out of scope | Reason |
|-------------|--------|
| MUI component rendering (React Testing Library) | No RTL infrastructure set up; portfolio scope |
| Style / layout assertions | Not verifiable without a browser |
| Redux action creators in isolation | Verifying `dispatch(setX(v))` sets `state.x = v` is circular |
| socket.io-client internals | Third-party library; not our code |
| Auth middleware logic (protect, authorize) | Backend unit tests — separate concern |
| TypeScript type narrowing | Covered by `tsc --noEmit` |
| Browser-specific rendering | Layer 3 only |

---

## 3. Test Fixture Pattern

Every integration verification script must use this shared setup. Gemini should instantiate it at the top of each Layer 2 script before any assertions.

**Conceptual shape (not an importable file — inline it per script):**

```
MongoFixture
  .connect(MONGODB_URI)              // connects to local or Atlas
  .loadUsers()                       // finds one doc per role from users collection
  .signTokens(JWT_SECRET)            // signs JWTs with same secret as backend
  .expose:
      token.user     — JWT for role 'user'
      token.owner    — JWT for role 'owner'
      token.partner  — JWT for role 'partner'
      token.admin    — JWT for role 'admin'
      userId.user    — ObjectId string
      userId.owner   — ObjectId string
      userId.partner — ObjectId string
      userId.admin   — ObjectId string

request(path, method, body, token)
  — fetch(`${BASE_URL}${path}`, { method, body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })
  — returns { status, body } (body parsed as JSON)
  — does NOT throw on non-2xx; let the step() assertion handle it

connectSocket(token)
  — io(SOCKET_URL, { auth: { token }, transports: ['websocket'] })
  — returns socket instance
  — call .disconnect() in finally block

step(name, fn)
  — prints "STEP: <name>"
  — awaits fn()
  — on throw: prints "FAIL: <name>" + error.message, exits process with code 1
  — on pass: prints "PASS: <name>"
```

**Environment variables the script reads (not from web/.env — set in shell):**
```
MONGODB_URI=mongodb://localhost:27017/foodhub
JWT_SECRET=<same value as backend .env>
BASE_URL=http://localhost:5000/api
SOCKET_URL=http://localhost:5000
```

---

## 4. Per-Session Verification Contract

The minimum passing bar for each session type. Gemini MUST run all items in the relevant category before reporting.

### Data-display sessions (U1, U3)

| # | Check | Command pattern | Pass criterion |
|---|-------|----------------|---------------|
| 1 | TypeScript clean | `npx tsc --noEmit ... \| Select-String "<files>"` | Empty output |
| 2 | Build passes | `npx vite build ... \| Select-Object -Last 15` | Last line contains "built in" |
| 3 | Mock removed | `Select-String -Path "<file>" -Pattern "<mock-import>"` | No results |
| 4 | Real import present | `Select-String -Path "<file>" -Pattern "<real-fn>"` | ≥1 result |
| 5 | Endpoint returns 200 | Layer 2 script: `GET /api/orders/owned` with admin token | `status === 200` and `body.data.length > 0` (or at least `status === 200`) |

### Socket-driven sessions (U2, U4)

All data-display checks plus:

| # | Check | Command pattern | Pass criterion |
|---|-------|----------------|---------------|
| 6 | Socket event fires | Layer 2 script: emit trigger → listen for event | Event received within 3000 ms |
| 7 | Payload shape | Script asserts expected fields exist | No missing fields |
| 8 | Reducer binding | `Select-String -Path "App.tsx","socket.ts" -Pattern "<event-name>"` | Event name present in both files |

### Route-registration sessions (U6)

| # | Check | Command pattern | Pass criterion |
|---|-------|----------------|---------------|
| 1 | TypeScript clean | `npx tsc --noEmit ... \| Select-String "routes"` | Empty output |
| 2 | Build passes | `npx vite build ... \| Select-Object -Last 15` | Last line contains "built in" |
| 3 | Route registered | `Select-String -Path "routes/index.tsx" -Pattern "review\|OrderReview"` | ≥2 results (import + route) |
| 4 | Endpoint returns 201 | Layer 2 script: POST /api/reviews with delivered orderId | `status === 201` |

### Refinement sessions (U5, U-Notification)

| # | Check | Pass criterion |
|---|-------|---------------|
| 1 | TypeScript clean | Empty |
| 2 | Build passes | "built in" present |
| 3 | One targeted grep per bullet | Each grep returns expected result count (stated in session prompt) |

---

## 5. Script Skeleton

Gemini must adapt this for each Layer 2 verification. Target: under 120 lines per script.

```javascript
// docs/scripts/<session>-verify.mjs
// Run: node docs/scripts/<session>-verify.mjs
// Requires: MONGODB_URI, JWT_SECRET, BASE_URL, SOCKET_URL in environment

import { MongoClient, ObjectId } from 'mongodb';
import { createRequire } from 'module';
import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { once } from 'events';

const {
  MONGODB_URI = 'mongodb://localhost:27017/foodhub',
  JWT_SECRET,
  BASE_URL = 'http://localhost:5000/api',
  SOCKET_URL = 'http://localhost:5000',
} = process.env;

if (!JWT_SECRET) { console.error('JWT_SECRET required'); process.exit(1); }

const mongo = new MongoClient(MONGODB_URI);
let socket;

// ---------- helpers ----------

async function loadTokens() {
  const db = mongo.db();
  const users = db.collection('users');
  const roles = ['user', 'owner', 'partner', 'admin'];
  const tokens = {};
  const ids = {};
  for (const role of roles) {
    const doc = await users.findOne({ roles: role });
    if (!doc) throw new Error(`No user with role '${role}' in DB`);
    tokens[role] = jwt.sign({ id: doc._id.toString(), roles: [role] }, JWT_SECRET, { expiresIn: '1h' });
    ids[role] = doc._id.toString();
  }
  return { tokens, ids };
}

async function request(path, method = 'GET', body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json };
}

function connectSocket(token) {
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  });
  return socket;
}

async function waitForEvent(emitter, event, timeoutMs = 3000) {
  return Promise.race([
    once(emitter, event),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out waiting for '${event}' after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

async function step(name, fn) {
  process.stdout.write(`STEP: ${name} ... `);
  try {
    await fn();
    console.log('PASS');
  } catch (err) {
    console.log(`FAIL\n  ${err.message}`);
    process.exit(1);
  }
}

// ---------- main ----------

async function main() {
  await mongo.connect();
  const { tokens, ids } = await loadTokens();

  // ---- session-specific steps go here ----

  await step('admin can fetch orders', async () => {
    const { status, body } = await request('/orders/owned', 'GET', undefined, tokens.admin);
    if (status !== 200) throw new Error(`Expected 200, got ${status}: ${JSON.stringify(body)}`);
    if (!Array.isArray(body.data ?? body)) throw new Error('Response is not an array');
  });

  // ---- add more steps above this line ----
}

main()
  .catch(err => { console.error('UNHANDLED:', err.message); process.exit(1); })
  .finally(async () => {
    socket?.disconnect();
    await mongo.close();
  });
```

**Usage notes for Gemini:**
- Replace the `admin can fetch orders` step with session-specific assertions.
- Do not run `npm install` inside the script — dependencies (`mongodb`, `jsonwebtoken`, `socket.io-client`) must already be present in the project root or API devDependencies.
- Script runs with `node --experimental-vm-modules` if ESM imports fail; fall back to CJS (`require`) if needed.
- Exit code 0 = all steps passed. Exit code 1 = first failing step (script stops there).

---

## 6. Failure Discipline

If any verification step fails:

1. **Paste raw stdout** of the failing command — complete, untruncated.
2. **Paste the failing request** — exact URL, HTTP method, request payload, response status + body.
3. **Stop.** Do not attempt to fix by guessing. Do not retry with modified inputs.
4. Report under Phase 4 item labeled "FAILURE:" followed by step number.

The human or planning AI will diagnose from the raw output. Guessing wastes sessions.

---

## 7. Environment Assumptions

Every verification script assumes:

| Variable | Expected value | Where set |
|----------|---------------|----------|
| Backend | Running on `http://localhost:5000` | `cd API && npm run dev` |
| MongoDB | Running on `mongodb://localhost:27017` | Local mongod or Atlas URI override |
| `VITE_DATA_SOURCE` | `api` | `web/.env` (set by U0) |
| `JWT_SECRET` | Matches `API/.env` value | Shell env before running script |
| Test users | One user per role exists in `users` collection | Seeded via README seed script |
| No prior state pollution | Each script is idempotent or uses a dedicated test order | New order created per run if needed |

**Seed check before any Layer 2 script:**
```powershell
# Confirm one user per role exists
mongosh foodhub --quiet --eval "['user','owner','partner','admin'].forEach(r => print(r, db.users.countDocuments({roles:r})))"
```
Expected output: each role prints `1` or higher. If any role shows `0`, run the seed script before proceeding.
