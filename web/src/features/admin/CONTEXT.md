# Admin Domain Context

## Architecture
The Admin Domain follows a unified boundary architecture designed to be ready for MCP and AI-agent integrations.

UI components **never** fetch data manually, nor do they define mock structures inline. Every page delegates to either a direct services/api/ real API client or a eatures/admin/data/ mock provider.

## Boundaries
- **REAL / DB-BACKED**
  - **Dashboard**: AdminDashboard.tsx -> nalytics/dashboard API -> Backend Analytics Service
  - **Restaurants**: RestaurantsList.tsx -> estaurantApi.ts -> Backend Restaurants Service
  - **Users**: UsersList.tsx -> usersApi.ts -> Backend Users Service
  - **Profile**: AdminProfile.tsx -> Redux state.auth -> Backend Auth Service

- **MOCK / PROVIDER-BACKED** (Ready to swap out for real API)
  - **Orders**: OrdersList.tsx -> orders.provider.ts
  - **Promotions**: Coupons.tsx -> promotions.provider.ts
  - **Reports**: Analytics.tsx -> eports.provider.ts
  - **Settings**: GeneralSettings.tsx -> settings.provider.ts
  - **Menu**: AdminMenu.tsx -> menu.provider.ts

## Authentication
Authentication relies on the zom2.auth.session LocalStorage key, which is maintained by uthSlice.ts.
An extraction utility, getAuthToken() in services/api/apiUtils.ts, is used to safely retrieve the JWT token and pass it as a Bearer token.

## MCP Readiness
All mock providers return explicitly typed domain boundaries (Coupon, AdminSettings, Order).
An MCP tool can directly wrap these existing providers (getAdminSettings(), getCoupons()), and the data shape will remain identical when real backend endpoints are wired.
