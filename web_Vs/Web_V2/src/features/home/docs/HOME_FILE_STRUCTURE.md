# 📁 Home Page Dev Renderer - File Structure & Architecture

## Complete Overview

```
web/
├── src/
│   ├── pages/Home/
│   │   ├── index.tsx ⭐ ← ENTRY POINT (Uses DevVersionRenderer)
│   │   │
│   │   ├── versions/ 📦 ← ALL SWAPPABLE VERSIONS
│   │   │   ├── Home_V.tsx      (Production - Default)
│   │   │   └── Home_V2.tsx     (Dev Showcase with Console)
│   │   │
│   │   ├── components/ 🧩 ← SHARED BY ALL VERSIONS
│   │   │   ├── PromoSection.tsx
│   │   │   ├── StatsSection.tsx
│   │   │   ├── CuisinesSection.tsx
│   │   │   ├── QuickDeliverySection.tsx
│   │   │   ├── TopDishesSection.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   ├── TestimonialsSection.tsx
│   │   │   └── FeaturedRestaurantsSection.tsx
│   │   │
│   │   └── V/ 🗂️ ← LEGACY (Can delete after testing)
│   │       └── Home_V.tsx (Original before refactor)
│   │
│   ├── core/dev/ 🚀 ← FRAMEWORK (Already integrated)
│   │   ├── contexts/
│   │   │   └── DevContext.tsx
│   │   │       ├── DevProvider (in main.tsx)
│   │   │       ├── availableVersions state
│   │   │       ├── selectedVersions state
│   │   │       └── registerVersions() method
│   │   │
│   │   └── components/
│   │       ├── DevVersionRenderer.tsx   (Hot-swap logic)
│   │       ├── DevVersionSwitcher.tsx   (Toolbar icon/menu)
│   │       └── DevErrorBoundary.tsx     (Error handling)
│   │
│   └── shared/layout/
│       ├── MainLayout.tsx (Has DevVersionSwitcher in toolbar)
│       ├── AdminLayout.tsx (Has DevVersionSwitcher)
│       └── PartnerLayout.tsx (Has DevVersionSwitcher)
│
├── main.tsx ✅ (Already has DevProvider wrapper)
│
└── HOME_*.md 📚 (Documentation)
    ├── HOME_PAGE_WIRING_GUIDE.md (Component integration)
    ├── DEV_RENDERER_GUIDE.md (Comprehensive reference)
    └── HOME_DEV_QUICK_START.md (This file's companion)
```

---

## 🔑 Key Files & Their Roles

### 1. **`src/pages/Home/index.tsx`** ⭐ ENTRY POINT
```typescript
// What it does: Orchestrates version switching
// Exports: DevVersionRenderer component
// Uses: import.meta.glob() to auto-discover versions
// Result: Hot-swappable home page

import { DevVersionRenderer } from '../../core/dev/components/DevVersionRenderer';

export default function Home() {
  const versionImports = import.meta.glob('./versions/*.tsx', { eager: false });
  
  return (
    <DevVersionRenderer
      pageKey="Home"
      defaultVersion="Home_V"
      imports={versionImports}
    />
  );
}
```

**Router imports this:** Pages are loaded via React Router → imports Home/index.tsx

---

### 2. **`src/pages/Home/versions/Home_V.tsx`** 📍 PRODUCTION
```typescript
// Status: Stable, production-ready
// Features: 
//   - 8 rich home sections (Stats, Promo, Cuisines, etc.)
//   - Redux integration (restaurant fetching)
//   - Full navigation functionality
//   - Clean, minimal UI

const HomeV: React.FC = () => {
  // All 8 sections rendered
  return (
    <Box>
      {/* Hero */}
      <StatsSection />
      <PromoSection />
      {/* ... etc */}
    </Box>
  );
};
```

---

### 3. **`src/pages/Home/versions/Home_V2.tsx`** 💻 DEVELOPER SHOWCASE
```typescript
// Status: Feature showcase with debugging
// Additional Features:
//   - Dev Console Panel (top 350px)
//   - State Overview (Redux metrics)
//   - Component Versions registry
//   - Redux Store inspector
//   - Framework info tabs

const HomeV2: React.FC = () => {
  const { availableVersions, selectedVersions } = useDevContext();
  const [tabValue, setTabValue] = useState(0);
  
  return (
    <Box>
      {/* Dev Console Panel with Tabs */}
      <Paper sx={{ mb: 6, border: '2px solid', borderColor: 'warning.main' }}>
        {/* Tabs: State Overview, Versions, Redux, Info */}
      </Paper>
      
      {/* All 8 sections below console */}
      <StatsSection />
      <PromoSection />
      {/* ... etc */}
    </Box>
  );
};
```

---

### 4. **`src/pages/Home/components/*`** 🧩 SHARED SECTIONS
Each section is a standalone component that works with **any version**:

```typescript
// All these can be used in any Home_V*.tsx file:
- StatsSection.tsx       (Key metrics)
- PromoSection.tsx       (Discount codes)
- CuisinesSection.tsx    (Food categories)
- QuickDeliverySection.tsx (Fast delivery items)
- TopDishesSection.tsx   (Popular dishes)
- HowItWorksSection.tsx  (4-step process)
- TestimonialsSection.tsx (Customer reviews)
- FeaturedRestaurantsSection.tsx (Top restaurants)
```

**Example usage:**
```tsx
import PromoSection from '../components/PromoSection';

const HomeV3 = () => (
  <Box>
    {/* Move sections around */}
    <TopDishesSection />
    <PromoSection />
    <StatsSection />
    {/* ... reorder as desired */}
  </Box>
);
```

---

### 5. **`src/core/dev/contexts/DevContext.tsx`** 🎛️ STATE MANAGEMENT
```typescript
interface DevContextType {
  // Map: pageKey → available versions
  availableVersions: Record<string, string[]>;
  
  // Map: pageKey → currently selected version
  selectedVersions: Record<string, string>;
  
  // Methods
  registerVersions(pageKey: string, versions: string[]): void;
  setVersion(pageKey: string, version: string): void;
}

// Usage in components:
const { availableVersions, selectedVersions, setVersion } = useDevContext();
```

**LocalStorage:**
```javascript
localStorage.getItem('zom2_dev_versions');
// Returns: { "Home": "Home_V2", "RestaurantDetails": "RestaurantDetail_V" }
```

---

### 6. **`src/core/dev/components/DevVersionRenderer.tsx`** 🔄 HOT-SWAP ENGINE
```typescript
interface DevVersionRendererProps {
  pageKey: string;                    // "Home", "Orders", etc.
  defaultVersion: string;             // "Home_V" fallback
  imports: Record<...>;               // Vite glob imports
}

// What it does:
// 1. Extracts version names from glob imports
// 2. Registers versions in DevContext
// 3. Watches selectedVersions from context
// 4. Lazy-loads active version component
// 5. Wraps in Suspense + ErrorBoundary
```

**Flow:**
```
import.meta.glob('./versions/*.tsx')
        ↓
['Home_V', 'Home_V2']
        ↓
DevVersionRenderer extracts names
        ↓
Registers in DevContext
        ↓
User selects version via menu
        ↓
DevContext updates selectedVersions
        ↓
Component re-renders with new version
        ↓
No page reload! ⚡
```

---

### 7. **`src/core/dev/components/DevVersionSwitcher.tsx`** 🎮 UI MENU
```typescript
// Shows in toolbar only if user is dev@
// Click icon to open menu showing:
// - All registered pages
// - Available versions per page
// - Currently active version (✓ checkmark)
// - Environment settings (isolation toggle)

if (!user || user.email !== 'dev@') {
  return null; // Hidden for regular users
}
```

**UI:**
```
┌─ Developer Icon (⚙️) with Badge
│  │
│  └─ Click → Menu Opens
│     │
│     ├─ ACTIVE COMPONENTS
│     │  ├─ HOME
│     │  │  ├─ Home_V          ✓
│     │  │  └─ Home_V2
│     │  ├─ RESTAURANT_DETAILS
│     │  │  └─ RestaurantDetail_V ✓
│     │  └─ ...more pages
│     │
│     └─ ENVIRONMENT SETTINGS
│        └─ Session Isolation [Toggle]
```

---

### 8. **`main.tsx`** ✅ BOOTSTRAP
```typescript
// Already configured (no changes needed):
import { DevProvider } from './core/dev/contexts/DevContext';

ReactDOM.createRoot(...).render(
  <BrowserRouter>
    <Provider store={store}>
      <DevProvider>  ← Already wraps entire app!
        <App />
      </DevProvider>
    </Provider>
  </BrowserRouter>
);
```

---

## 🔀 Data Flow Architecture

### Version Selection → Component Loading
```
Browser Storage
└── localStorage['zom2_dev_versions']
    ↓
DevContext.selectedVersions
    ↓
DevVersionRenderer watches selectedVersions
    ↓
Triggers React.lazy() load for new version
    ↓
Suspense shows loading spinner
    ↓
Component mounts with new version
    ↓
ErrorBoundary catches any errors
```

### Redux Store → All Versions
```
Redux Store (shared)
├── restaurants: []
├── featured: []
├── loading: boolean
└── ...

↓ (available to all versions)

Home_V              Home_V2           Home_V3
├── useSelector()   ├── useSelector()  ├── useSelector()
├── dispatch()      ├── dispatch()     ├── dispatch()
└── Same data       └── Same data      └── Same data
```

---

## 🛠️ Adding New Versions

### Minimal Example: Create `Home_V3.tsx`

```typescript
// File: src/pages/Home/versions/Home_V3.tsx

import React from 'react';
import { Box } from '@mui/material';

// Import shared sections
import StatsSection from '../components/StatsSection';
import PromoSection from '../components/PromoSection';

const HomeV3: React.FC = () => {
  return (
    <Box>
      {/* Your custom layout */}
      <PromoSection />
      <StatsSection />
      {/* Add more sections or custom UI */}
    </Box>
  );
};

export default HomeV3;
```

**That's it!** On page reload:
1. Vite glob finds `Home_V3.tsx`
2. DevVersionRenderer registers it
3. DevVersionSwitcher shows it
4. Click to test immediately ✨

---

## 📊 Comparison Table

| Aspect | Home_V | Home_V2 | Custom Version |
|--------|--------|---------|-----------------|
| **Default** | ✅ | ❌ | ❌ |
| **Dev Console** | ❌ | ✅ | Optional |
| **Production Ready** | ✅ | ✅ | Depends |
| **Debugging Tools** | ❌ | ✅ | Add manually |
| **Redux Integration** | ✅ | ✅ | Shared |
| **Components Available** | ✅ All 8 | ✅ All 8 | ✅ All 8 |

---

## 🚀 Typical Workflow

### Day 1: Exploration
1. Login as dev@
2. Switch between Home_V and Home_V2
3. Inspect state in Home_V2 console
4. Understand Redux data structure

### Day 2: Experimentation
1. Create Home_V_Redesign.tsx
2. Copy sections from Home_V
3. Rearrange them differently
4. Switch to compare UI

### Day 3: Optimization
1. Create Home_V_LazyLoaded.tsx
2. Implement lazy-loading for sections
3. Compare performance metrics
4. Switch between versions for comparison

### Day 4: Rollout
1. Keep best version as default
2. Keep variants for A/B testing
3. Deploy to production
4. Toggle variants via DevVersionSwitcher

---

## ⚠️ Important Notes

### What's Shared Between Versions
- ✅ Redux store (single source of truth)
- ✅ React Router (navigation)
- ✅ Material-UI theme
- ✅ Auth context (same user)
- ✅ All component utilities

### What's Different Between Versions
- ❌ Component tree (different JSX)
- ❌ Section ordering
- ❌ Custom styling
- ❌ Additional components/features
- ❌ Dev tools (only in V2)

### Dev Mode Only
- Only visible to `dev@` user
- Disabled in production builds
- NO performance impact on users
- Safe to commit to version control

---

## 📚 Documentation Map

```
HOME_PAGE_WIRING_GUIDE.md
 ├─ How to install/setup ✅
 ├─ Component APIs
 ├─ Redux dispatch examples
 └─ Advanced customization

DEV_RENDERER_GUIDE.md
 ├─ Complete architecture
 ├─ Use cases (A/B testing, rollout, etc.)
 ├─ Error handling
 └─ Performance considerations

HOME_DEV_QUICK_START.md (this file)
 ├─ Quick reference
 ├─ File structure
 ├─ Troubleshooting
 └─ Verification checklist
```

---

## ✅ Files Already in Place

```typescript
✅ src/pages/Home/index.tsx        (DevVersionRenderer wrapper)
✅ src/pages/Home/versions/Home_V.tsx         (Production version)
✅ src/pages/Home/versions/Home_V2.tsx        (Dev version with console)
✅ src/pages/Home/components/           (All 8 shared sections)
✅ src/core/dev/contexts/DevContext.tsx      (State management)
✅ src/core/dev/components/DevVersionRenderer.tsx   (Hot-swap logic)
✅ src/core/dev/components/DevVersionSwitcher.tsx   (Toolbar menu)
✅ main.tsx                          (DevProvider already set up)
```

---

## 🎯 Next Steps

1. **Test it**: npm run dev → Login as dev@ → Click ⚙️ icon
2. **Explore**: Switch between Home_V and Home_V2
3. **Create**: Make your first Home_V3.tsx variant
4. **Compare**: Use dev console to inspect state differences
5. **Deploy**: When ready, make one version the production default

---

**Ready to start? Open HOME_DEV_QUICK_START.md or go to the browser and test!**
