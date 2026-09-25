# SESSION U-Notification — Notification Bell Refinement

Reference: docs/uiCompletionPlan.md Section 8, "U-Notification" and Section 7

Four targeted fixes: (1) `App.tsx` dispatches only `showToast` for the generic `notification` socket event — also dispatch `addNotification` so it reaches the persistent bell. (2) `notificationSlice.addNotification` has no deduplication — skip if matching `orderId+status` pair exists within the last 60 seconds. (3) `NotificationBell.tsx` Popover is fixed at 360px width — overflows on 375px mobile. (4) Partner notification message is generic — include restaurant context when payload carries it. Note: if U2 already applied fix (1), skip it and record "already applied by U2".

## HARD RULES
- Editor tool ONLY for source writes. No node -e, python -c, base64, here-strings, Set-Content, shell redirection to source.
- Do NOT commit. Leave the working tree dirty.
- Do NOT touch files outside the scope list below.
- Raw output only in the report. No narrative summaries.
- If a step requires a banned method, STOP and say so.

## FILES IN SCOPE
```
web/src/App.tsx
web/src/core/notifications/notificationSlice.ts
web/src/core/notifications/components/NotificationBell.tsx
web/src/core/notifications/hooks/useDeliveryNotifications.ts
```

## PHASE 1 — Read and confirm

1. Read `web/src/App.tsx` lines 57–75.
   Record lines 57–75 verbatim. Check whether `addNotification` is already dispatched in `handleNotification`.
   If yes, record "Fix 1 already applied by U2 — skip Step 2.1".

2. Read `web/src/core/notifications/notificationSlice.ts` fully (74 lines).
   Record:
   - The `addNotification` reducer body verbatim.
   - The state shape of each notification item (fields: `id`, `orderId`, `status`, `isRead`, `createdAt`, etc.).
   - Whether any deduplication logic exists.

3. Read `web/src/core/notifications/components/NotificationBell.tsx` lines 75–92.
   Record the `Popover` `PaperProps` `sx` value verbatim.

4. Read `web/src/core/notifications/hooks/useDeliveryNotifications.ts` lines 1–50.
   Find the block that dispatches `addNotification` for the `delivery:assigned` event to the partner role.
   Record the exact message string used for partners.

5. Run:
   ```powershell
   Select-String -Path "web/src/core/notifications/notificationSlice.ts" -Pattern "orderId|status|deduplicate|find\("
   ```
   Record verbatim.

6. Run:
   ```powershell
   Select-String -Path "web/src/App.tsx" -Pattern "addNotification"
   ```
   Record verbatim. If empty → Fix 1 needed. If results → Fix 1 already done.

## PHASE 2 — Apply

### Step 2.1 — Fix App.tsx dual dispatch (skip if already applied)

If Phase 1 step 6 showed `addNotification` already present in `App.tsx`: record "skipped — already applied" and move to Step 2.2.

Otherwise, open `web/src/App.tsx`:

1. Add `addNotification` to the import from `notificationSlice` (find existing import line using Phase 1 step 1 data).
2. In `handleNotification`, after `dispatch(showToast({ message: data.message, type: notifType }))`, add:
   ```typescript
   dispatch(addNotification({
     title: data.title,
     message: data.message,
     type: notifType,
     targetPath: data.orderId ? `/orders/tracking/${data.orderId}` : undefined,
   }));
   ```

### Step 2.2 — Add deduplication to notificationSlice.addNotification

Open `web/src/core/notifications/notificationSlice.ts`.

In the `addNotification` reducer, before the `state.items.unshift(...)` call (or equivalent push), add a deduplication check:
```typescript
// Deduplicate: skip if same orderId+status pair exists within the last 60 seconds
const sixtySecondsAgo = Date.now() - 60_000;
const isDuplicate = state.items.some(
  n =>
    n.orderId === action.payload.orderId &&
    n.status === action.payload.status &&
    new Date(n.createdAt).getTime() > sixtySecondsAgo
);
if (isDuplicate) return;
```
Adapt field names to match the actual notification item type found in Phase 1 step 2.
If the notification item does not have `orderId` or `status` fields, record this and skip the deduplication — do not fabricate fields.

### Step 2.3 — Fix NotificationBell Popover mobile width

Open `web/src/core/notifications/components/NotificationBell.tsx`.

Find the `PaperProps` on the `Popover` component (around line 88–90). Change:
```typescript
sx: { width: 360, maxHeight: 500, display: 'flex', flexDirection: 'column' }
```
to:
```typescript
sx: { width: { xs: '90vw', sm: 360 }, maxWidth: '90vw', maxHeight: 500, display: 'flex', flexDirection: 'column' }
```
Do not change any other Popover prop.

### Step 2.4 — Enrich partner notification message

Open `web/src/core/notifications/hooks/useDeliveryNotifications.ts`.

Find the block that adds a notification for the `delivery:assigned` event when `role === 'partner'` (or the partner branch of the role switch/if chain).

Change the `message` field from generic text (e.g. "You have been assigned a new delivery") to:
```typescript
message: payload.restaurantName
  ? `New delivery from ${payload.restaurantName} — Order #${String(payload.orderId).slice(-6).toUpperCase()}`
  : `New delivery assigned — Order #${String(payload.orderId).slice(-6).toUpperCase()}`,
```
Adapt `payload.restaurantName` and `payload.orderId` to the actual field names in the `DeliveryAssignedPayload` type (confirmed in Phase 1 step 4). Do not change the notification for any other role.

## PHASE 3 — Verify (raw output only)

1. Run:
   ```powershell
   npx tsc --noEmit -p web/tsconfig.app.json 2>&1 | Select-String "App\.tsx|notificationSlice|NotificationBell|useDeliveryNotifications"
   ```
   Record verbatim. Expected: empty.

2. Run:
   ```powershell
   Select-String -Path "web/src/core/notifications/notificationSlice.ts" -Pattern "isDuplicate|deduplic"
   ```
   Expected: the deduplication variable name (if fix was applied; or "skipped" note).

3. Run:
   ```powershell
   Select-String -Path "web/src/core/notifications/components/NotificationBell.tsx" -Pattern "90vw"
   ```
   Expected: 1 result (the new PaperProps).

4. Run:
   ```powershell
   Select-String -Path "web/src/core/notifications/hooks/useDeliveryNotifications.ts" -Pattern "restaurantName"
   ```
   Expected: 1 result (the enriched partner message).

5. Run:
   ```powershell
   Push-Location web; npx vite build 2>&1 | Select-Object -Last 15; Pop-Location
   ```
   Record last 15 lines.

## PHASE 4 — Report (raw only)

1. `App.tsx` lines 57–75 BEFORE (from Phase 1)
2. `App.tsx` lines 57–75 AFTER (if changed) or "skipped — already applied"
3. `notificationSlice.ts` `addNotification` reducer BEFORE (full body)
4. `notificationSlice.ts` `addNotification` reducer AFTER (full body with dedup or "skipped — no orderId field")
5. `NotificationBell.tsx` PaperProps `sx` BEFORE
6. `NotificationBell.tsx` PaperProps `sx` AFTER
7. Partner notification message BEFORE
8. Partner notification message AFTER
9. TSC filter output (Phase 3 step 1)
10. `isDuplicate` grep (Phase 3 step 2)
11. `90vw` grep (Phase 3 step 3)
12. `restaurantName` grep (Phase 3 step 4)
13. Vite build last 15 lines (Phase 3 step 5)
14. `git diff --stat` raw output

Working tree left dirty. No commit made.

## STOP CONDITIONS
- STOP if `addNotification` action does not exist in `notificationSlice.ts` — record and escalate.
- STOP if the notification item shape has no `orderId` or `status` field (deduplication cannot be applied safely) — record item shape and skip Step 2.2 only; continue with Steps 2.3–2.4.
- STOP if `DeliveryAssignedPayload` does not have an `orderId`-equivalent field — record actual type and adapt or skip Step 2.4.
- STOP if TSC errors appear after any step — paste full TSC output and stop.
- STOP if vite build exits non-zero — paste full build output and stop.
