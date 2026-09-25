# FoodHub — Deployment Runbook
> Azure Static Web Apps (frontend) + Render (backend) + MongoDB Atlas

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|-------|
| Azure subscription | Free tier sufficient; create at portal.azure.com |
| GitHub repo pushed | `git push origin dev/main` before any deployment step |
| MongoDB Atlas M0 cluster | Free forever; create at cloud.mongodb.com |
| Node ≥18 on build agents | Both Azure SWA and Render auto-provision this |

**Recommended:** Keep MongoDB Atlas for persistence; use Render free tier for API; use Azure SWA free tier for frontend. Total cost: \$0 for a portfolio demo.

---

## 2. MongoDB Atlas Setup

1. Create cluster → M0 (free). Region: closest to Render server.
2. Database → "foodhub" (or any name matching `MONGODB_URI`).
3. Network Access → Add IP: `0.0.0.0/0` (allow all — fine for portfolio).
4. Database User → Create user, copy password.
5. Connect → Drivers → copy connection string.
   Format: `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/foodhub?retryWrites=true&w=majority`

---

## 3. Backend on Render

### 3.1 Create Web Service

1. render.com → New → Web Service → connect GitHub repo.
2. Root directory: `API`
3. Build command: `npm install && npm run build`
4. Start command: `node dist/server.js` (verify `API/package.json` "main" or adjust)
5. Instance: Free (512 MB RAM, spins down after 15 min idle — acceptable for portfolio)

### 3.2 Environment Variables (set in Render dashboard → Environment)

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Atlas connection string from step 2.5 |
| `JWT_SECRET` | Any 32+ char random string |
| `CORS_ORIGIN` | Azure SWA URL (e.g. `https://mango-sky-abc123.azurestaticapps.net`) — set after step 4.2 |
| `NODE_ENV` | `production` |
| `PORT` | `5000` (Render overrides with its own; keep for local parity) |

> **CORS note:** After SWA URL is known, update `CORS_ORIGIN` and redeploy Render service (one click).
> Confirm `API/src/app.ts` reads `process.env.CORS_ORIGIN` and passes it to `cors({ origin: ... })`.
> Run: `Select-String -Path "API/src/app.ts" -Pattern "CORS_ORIGIN|cors"` to verify before deploying.

### 3.3 Verify Backend

After Render deploy completes:
```
curl https://<your-render-slug>.onrender.com/api/restaurants
```
Expected: JSON array (may be empty if no seed data).

---

## 4. Frontend on Azure Static Web Apps

### 4.1 Create SWA Resource

1. portal.azure.com → Create Resource → Static Web App.
2. Plan: Free.
3. Source: GitHub → select repo + branch (`dev/main`).
4. Build presets: Custom.
   - App location: `web`
   - Api location: *(leave empty — API is on Render)*
   - Output location: `dist`
5. Click Review + Create.

Azure auto-creates a GitHub Actions workflow at `.github/workflows/azure-static-web-apps-*.yml`.

### 4.2 Configure Environment Variables in Azure SWA

Azure portal → your SWA → Configuration → Application Settings:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://<your-render-slug>.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://<your-render-slug>.onrender.com` |
| `VITE_DATA_SOURCE` | `api` |
| `VITE_DEV_BYPASS_AUTH` | `false` |
| `VITE_GOOGLE_MAPS_API_KEY` | *(your key from console.cloud.google.com)* |

> ⚠️ `VITE_*` variables are baked into the bundle at build time. After changing them in Azure, trigger a new deployment: push an empty commit or use "Redeploy" in the Azure portal.

### 4.3 SPA Fallback (already in place)

Confirm `web/public/staticwebapp.config.json` (or `web/staticwebapp.config.json`) exists with:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/assets/*"]
  }
}
```
If missing, create it — without this, direct URL navigation breaks on refresh.

### 4.4 Build Command

The GitHub Actions workflow Azure generated runs:
```
npm run build
```
inside the `web` directory. Verify `web/package.json` has:
```json
"scripts": { "build": "vite build" }
```

---

## 5. Wiring Frontend → Backend

After both are deployed, socket connections need the backend URL.

`web/src/services/socket.ts:33` reads `import.meta.env.VITE_SOCKET_URL || ""`.
An empty string means socket.io will connect to the **same origin** as the frontend — this does NOT work when frontend and backend are on different domains.

**Required:** Set `VITE_SOCKET_URL=https://<your-render-slug>.onrender.com` in Azure SWA configuration (step 4.2) and redeploy.

---

## 6. Post-Deploy Verification (run the 15-step demo)

Walk the demo script from `docs/uiCompletionPlan.md Section 2` against the deployed URL.

Quick sanity checks before starting:

```
# No localhost in network requests
# Open DevTools → Network → Filter: XHR → confirm all /api calls go to render.com, not localhost

# Socket connects over wss://
# DevTools → Network → Filter: WS → confirm wss://your-render-slug.onrender.com

# DATA_SOURCE confirmed api
# DevTools → Application → Local Storage → (none) — or add a debug line to confirm via console
```

| Check | Pass criteria |
|-------|--------------|
| `/restaurants` loads | ≥1 restaurant from DB (or empty state if DB has no data — seed if needed) |
| Login works | JWT returned; redirect to home |
| Place order | `POST /api/orders` → 201; order ID shown |
| Owner queue updates | Socket `order:new` → new card appears |
| Partner available orders | Socket `delivery:available` → card appears |
| Admin dashboard | Charts render with data from `GET /api/admin/analytics/dashboard` |
| `/admin/delivery` accessible | Fleet Operations link in sidebar; page loads |
| Review form | Submits without 400 error; navigates back to `/orders` |

---

## 7. Rollback and Debugging

### Azure SWA
- Portal → your SWA → Environments → Deployment history → revert to previous.
- Logs: SWA doesn't stream app logs; runtime errors come from the browser console.

### Render
- Dashboard → your service → Logs (live stream available).
- Rollback: use "Rollback" button on a previous deploy.

### Common issues

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| API calls return 404 | `VITE_API_URL` missing `/api` suffix | Update env var, redeploy |
| CORS errors | `CORS_ORIGIN` on Render doesn't match SWA domain | Update Render env var |
| Sockets don't connect | `VITE_SOCKET_URL` empty or wrong | Update Azure env var, redeploy |
| All data is mock | `VITE_DATA_SOURCE` not set to `api` | Update Azure env var, redeploy |
| Render cold-start timeout | Free tier spins down; first request takes 30–60s | Add a keep-alive ping or upgrade |
| Review gives 400 | `orderId` missing or status not `delivered` | Confirm order lifecycle completed |

---

## 8. Cost Expectations

| Service | Plan | Limit | Overage |
|---------|------|-------|---------|
| Azure SWA | Free | 100 GB bandwidth/month, 2 custom domains | Upgrade to Standard \$9/mo |
| Render | Free | 750 hours/month, spins down after 15 min | Upgrade to Starter \$7/mo |
| MongoDB Atlas | M0 Free | 512 MB storage, shared cluster | Upgrade to M2 \$9/mo |

**Portfolio demo total: \$0/month** assuming low traffic.
