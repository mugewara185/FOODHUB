## Contracted Imports Refactor Plan

1. Add layout barrel
   - create `src/shared/layout/index.ts`
   - export MainLayout, PartnerLayout, OwnerLayout, AdminLayout
   - update `src/app/routes/index.tsx` to `import { MainLayout, PartnerLayout, OwnerLayout, AdminLayout } from '@shared/layout'`

2. Expand page barrel exports
   - update `src/pages/index.ts`:
     - `export { default as Home } from './Home'`
     - `export { default as Login } from './Auth/Login'`
     - `export { default as Signup } from './Auth/Signup'`
     - `export { default as ForgotPassword } from './Auth/ForgotPassword'`
     - `export { default as ResetPassword } from './Auth/ResetPassword'`
     - `export { default as Cart } from './Cart'`
     - `export { default as Checkout } from './Cart/Checkout/Checkout'`
     - `export { default as Restaurants } from './restaurantListings'`
     - `export { default as RestaurantDetail } from './RestaurantDetails'`
     - `export { default as Orders } from './Orders'`
   - existing exports for Favourites/Profile/Notifications/SearchPage/Settings remain

3. Add role module barrels
   - `src/pages/_deliveryPartner/index.ts`
      - exports for PartnerDashboard, PartnerProfile, AvailableOrders, ActiveDelivery, DeliveryHistory, Earnings, Support, PartnerSettings
   - `src/pages/_ownerPages/index.ts`
      - OwnerDashboard, OwnerSettings
   - `src/pages/admin/index.ts` already has Promotions/Reports/Settings/Users

4. Update routes imports in `src/app/routes/index.tsx`
   - use:
     - `import { Home, Login, Signup, ForgotPassword, ResetPassword, Cart, Checkout, Restaurants, Orders } from '@pages'`
     - `import { Favourites, Profile, Notifications, SearchPage, Settings } from '@pages'`
     - `import { PartnerDashboard, PartnerProfile, AvailableOrders, ActiveDelivery, DeliveryHistory, Earnings, Support, PartnerSettings } from '@pages/_deliveryPartner'`
     - `import { OwnerDashboard, OwnerSettings } from '@pages/_ownerPages'`
     - `import { Promotions, Reports, Settings as AdminSettings, Users } from '@pages/admin'`
     - `import { MainLayout, PartnerLayout, OwnerLayout, AdminLayout } from '@shared/layout'`

5. Add tsconfig paths alias if missing
   - `tsconfig.app.json` to have:
     - `baseUrl: '.'`
     - `paths: { '@/*': ['src/*'], '@pages/*': ['src/pages/*'], '@shared/*': ['src/shared/*'], ... }`

6. Run validation
   - `npm run lint`
   - `npm run type-check` or `npm run build`
   - `npm run vitest`

7. Optional modular route files
   - `src/app/routes/userRoutes.tsx`, `partnerRoutes.tsx`, `ownerRoutes.tsx`, `adminRoutes.tsx`
   - keep `src/app/routes/index.tsx` as composition layer
