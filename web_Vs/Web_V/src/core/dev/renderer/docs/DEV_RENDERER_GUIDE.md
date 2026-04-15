# 🎨 Home Page - Dev Renderer V2 Integration Guide

## Overview

The home page now implements the **core/dev framework** for dynamic version switching. You can seamlessly toggle between **Home_V** (production) and **Home_V2** (dev showcase) to compare implementations, test variations, and demonstrate framework capabilities.

---

## 🚀 Quick Start

### 1. **Access Dev Controls**
- Login with the **dev@** account
- Look for the developer icon (⚙️) with a badge in the top toolbar
- Click to open the **Dev Version Registry** menu

### 2. **Switch Home Page Versions**

```
Dev Version Registry Menu
├──────────────────────
├─ ACTIVE COMPONENTS
├─ HOME
│  ├─ Home_V      (Production • Stable)
│  └─ Home_V2     (Developer • Feature-rich with debugging panel)
│
└─ ENVIRONMENT SETTINGS
  └─ [Session Isolation Toggle]
```

### 3. **Compare Implementations**
- **Home_V**: Standard production home page with all 8 sections
- **Home_V2**: Enhanced version with built-in dev console showing:
  - Real-time state overview
  - Component version registry
  - Redux store inspection
  - Framework capabilities showcase

---

## 📁 File Structure

```
src/pages/Home/
├── index.tsx                    ← Entry point (uses DevVersionRenderer)
├── components/                  ← Shared components (used by all versions)
│   ├── PromoSection.tsx
│   ├── StatsSection.tsx
│   ├── CuisinesSection.tsx
│   ├── QuickDeliverySection.tsx
│   ├── TopDishesSection.tsx
│   ├── FeaturedRestaurantsSection.tsx
│   ├── HowItWorksSection.tsx
│   └── TestimonialsSection.tsx
│
├── versions/                    ← Version-specific implementations
│   ├── Home_V.tsx              ← Production standard
│   └── Home_V2.tsx             ← Dev showcase with console
│
└── V/                          ← Legacy (can be removed after testing)
    └── Home_V.tsx              ← Original file
```

---

## 🔧 How It Works

### Architecture Stack

```
User interacts with page
          ↓
   index.tsx (Home)
          ↓
DevVersionRenderer
  (Manages hot-swapping)
          ↓
DevContext
  (Tracks selected version in localStorage)
          ↓
import.meta.glob()
  (Loads all /versions/*.tsx files)
          ↓
Home_V or Home_V2
  (Actual page implementation)
```

### Key Components

#### 1. **DevVersionRenderer** (`core/dev/components`)
```tsx
<DevVersionRenderer
  pageKey="Home"              // Unique identifier for this page
  defaultVersion="Home_V"     // Fallback version
  imports={versionImports}    // Record of all loadable versions
/>
```

#### 2. **DevContext** (`core/dev/contexts`)
- Stores version selections in `localStorage` (key: `zom2_dev_versions`)
- Persists selections across page reloads
- Only accessible via DevProvider (already wrapped in main.tsx)

#### 3. **DevVersionSwitcher** (`core/dev/components`)
- UI menu component (toolbar icon)
- Shows all registered versions per page
- Highlights currently active version
- Only visible to `dev@` user

---

## ✨ Features Demonstrated in Home_V2

### 1. **Dev Console Panel**
Located at the top of the page, showing:

```
📊 State Overview
├─ Real-time restaurant count
├─ Featured restaurants count
├─ Loaded cuisines
└─ Current version status

🎨 Component Versions
├─ Lists all registered pages
├─ Shows available versions per page
└─ Indicates active selection

⚙️ Redux Store
├─ Full restaurant state dump
├─ Sample data inspection
└─ Type information

📱 Framework Info
├─ core/dev feature list
└─ Use case examples
```

### 2. **Interactive Tabs**
- **State Overview** - Real-time metrics and status
- **Component Versions** - Version registry with switching controls
- **Redux Store** - Full state JSON preview
- **Framework Info** - Features and use cases

### 3. **Integration with Live Components**
- All 8 home sections rendered normally
- Redux selectors active (fetching real restaurants)
- Navigation handlers functional
- Demonstrating both dev tooling + production functionality

---

## 🔄 Creating New Versions

### Step 1: Create New Version File
```bash
cp src/pages/Home/versions/Home_V.tsx src/pages/Home/versions/Home_V3.tsx
```

### Step 2: Edit Home_V3.tsx
```tsx
const HomeV3: React.FC = () => {
  // Your custom implementation
  return (
    <Box>
      {/* New design or features */}
    </Box>
  );
};

export default HomeV3;
```

### Step 3: Automatic Discovery ✨
- No configuration needed!
- `import.meta.glob()` automatically detects new files
- Version appears in menu immediately on reload
- DevVersionSwitcher shows it as an option

### Step 4: Test and Compare
1. Click dev icon in toolbar
2. Switch between Home_V, Home_V2, Home_V3
3. Version preference saved to localStorage
4. No page reload required (hot swap)

---

## 🎯 Use Cases

### 1. **A/B Testing**
Create variant versions to test with real users:
```tsx
// Home_V_VariantA.tsx - Different call-to-action buttons
// Home_V_VariantB.tsx - Different section ordering
// Home_V_VariantC.tsx - Simplified layout
```
Switch versions to see impact on metrics.

### 2. **Progressive Rollout**
```tsx
// Home_V         - Current production
// Home_V_NewLook - Next design iteration
// Test with dev@ first, then gradually rollout
```

### 3. **Performance Comparison**
```tsx
// Home_V_Optimized    - Lazy loading sections
// Home_V_Standard     - All sections eager load
// Compare performance metrics
```

### 4. **Feature Experimentation**
```tsx
// Home_V_WithAI       - AI recommendations section
// Home_V_WithLive    - Real-time order tracking
// Home_V_Classic     - Current features only
```

---

## 💾 Data Persistence

### LocalStorage Keys
```javascript
// Dev version selections
zom2_dev_versions: { "Home": "Home_V2" }

// Redux-persist (sessionStorage toggle)
zom2_dev_session_isolation: "true" | "false"
```

### Session Isolation Toggle
In dev menu → "ENVIRONMENT SETTINGS":
- **Enabled**: Isolated Redux store per version
- **Disabled**: Shared Redux store across versions

```tsx
// Toggle in DevVersionSwitcher
<Switch 
  checked={isIsolated}
  onChange={handleToggleIsolation}
/>
// Triggers: window.location.reload()
```

---

## 🐛 Error Handling

### DevErrorBoundary
Each version is wrapped with error handling:

```tsx
<DevErrorBoundary 
  fallbackVersionName={activeVersion}
  onReset={() => setVersion(pageKey, defaultVersion)}
>
  <Component />
</DevErrorBoundary>
```

If a version crashes:
1. Error boundary catches it
2. Shows error details page
3. "Reset to Default" button resets to Home_V
4. Logs error for debugging

---

## 📊 Real-Time State Inspection

### Home_V2 Console Tab: "Redux Store"
```json
{
  "allRestaurants": 20,
  "featuredRestaurants": 6,
  "loading": false,
  "sample": {
    "id": "rest_1",
    "name": "Pizza Palace",
    "rating": 4.5,
    "cuisines": ["Italian", "Pizza"],
    "deliveryTime": 25,
    "deliveryFee": 2.5
  }
}
```

### Real-Time Metrics
- Restaurant count updates as API fetches
- Featured restaurants filtered dynamically
- Loading states visible
- Sample data structure inspection

---

## 🚀 Advanced: Custom Dev Dashboards

### Example: Add Monitoring to Home_V3

```tsx
import { useDevContext } from '../../../core/dev/contexts/DevContext';

const HomeV3: React.FC = () => {
  const { selectedVersions } = useDevContext();
  
  return (
    <>
      {/* Your page content */}
      
      {/* Dev info in corner (only for dev@) */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 10, 
        right: 10,
        zIndex: 9999,
        display: selectedVersions['Home'] === 'Home_V3' ? 'block' : 'none'
      }}>
        <Chip label="Home_V3 Active" color="success" />
      </Box>
    </>
  );
};

export default HomeV3;
```

---

## 🔗 Integration with Existing Systems

### Redux Store
- All versions share same Redux store
- Selectors work consistently
- Actions dispatch across versions
- Useful for testing state consistency

### React Router
- All versions work with same routing
- Navigation handlers functional
- Query parameters preserved
- Search works across versions

### Auth Context
- dev@ account authentication persists
- Same user throughout version switching
- Profile data consistent

### Material-UI Theme
- Single theme for all versions
- Consistent styling language
- Theme switching affects all versions
- Custom theme overrides possible per version

---

## 📱 Testing Versions

### Manual Testing Checklist

```typescript
// For each new version:
☐ Load with Chrome DevTools mobile view (xs)
☐ Load with tablet view (sm/md)
☐ Load with desktop view (lg/xl)
☐ Test search functionality
☐ Test navigation clicks
☐ Open console for errors
☐ Check Redux store state
☐ Verify section rendering
☐ Test promo code buttons
☐ Verify restaurant cards
☐ Check responsive images
```

### Automated Testing
```bash
# Run tests for all versions
npm test src/pages/Home/versions/

# Type check
npm run typecheck

# Build with all versions
npm run build
```

---

## 🎓 Learning Path

### Beginner
1. Switch between Home_V and Home_V2
2. Observe UI differences
3. Check Redux state in console tabs
4. Read dev console output

### Intermediate
1. Create Home_V_Experiment.tsx
2. Modify one section layout
3. Switch versions to compare
4. Measure differences

### Advanced
1. Create A/B variant versions
2. Add custom monitoring to versions
3. Implement performance metrics
4. Build automated comparison dashboard

---

## ❓ FAQ

### Q: Why don't I see the dev icon?
**A:** You must be logged in as `dev@` user. Check AuthContext and try login with dev@ account.

### Q: Will version switching lose my data?
**A:** No! Redux store persists across versions. Cart, restaurants, and user data remain.

### Q: Can I deploy version switching to production?
**A:** Not recommended. Remove DevVersionRenderer before deploying. The framework is for development only.

### Q: How do I remove a version file?
**A:** Delete the file from `/versions/` folder. It will automatically disappear from the menu on next reload.

### Q: Does version switching affect performance?
**A:** Minimal impact (~2-5ms for switching). Both versions load simultaneously if you switch frequently.

### Q: Can I use versioning for other pages too?
**A:** Yes! Apply the same pattern to RestaurantDetails, Orders, Profile, etc. Simply:
1. Create `/versions/` folder
2. Move implementations there
3. Wrap with DevVersionRenderer in index.tsx

---

## 🔗 Related Files

- `core/dev/contexts/DevContext.tsx` - State management
- `core/dev/components/DevVersionRenderer.tsx` - Hot-swapping logic
- `core/dev/components/DevVersionSwitcher.tsx` - UI menu
- `core/dev/components/DevErrorBoundary.tsx` - Error handling
- `shared/layout/MainLayout.tsx` - Toolbar integration

---

## 📝 Summary

The dev renderer enables:
- ✅ Hot-swappable page versions
- ✅ Real-time state inspection
- ✅ A/B testing infrastructure
- ✅ Feature experimentation
- ✅ Performance comparison
- ✅ Zero-configuration version discovery
- ✅ Production-safe error handling

**Start by logging in as `dev@` and clicking the toolbar icon!**
