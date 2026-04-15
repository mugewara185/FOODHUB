# Profile Feature - Quick Reference Guide

## 📍 Current Structure

```
pages/Profile/
├── index.tsx           ← Main entry point (uses DevVersionRenderer)
├── V/
│   ├── Profile_V.tsx   ← Default version (with logger)
│   └── ProfileV1.tsx   ← Alternative version (with logger)
├── Favorites/
│   └── Favourites.tsx  ← Favorites page wrapper (with logger)
├── Notifications.tsx   ← Notifications page wrapper (with logger)
└── Settings/
    └── Settings.tsx    ← Settings page wrapper (with logger)

features/profile/
├── components/
│   ├── ProfileContainer.tsx ← Main profile UI (NEW - fully implemented)
│   ├── ProfileHeader.tsx
│   ├── ProfileInfoCard.tsx
│   ├── Favorites/
│   │   └── Favourites.tsx ← Feature component (with logger)
│   ├── Notifications.tsx
│   ├── Settings/
│   │   └── Settings.tsx
│   └── index.tsx
├── hooks/
├── index.tsx
└── utils/
```

## 🚀 How Profile Pages Work

### Profile Page (Main)
```
Route: /profile
Flow: index.tsx → DevVersionRenderer → Profile_V.tsx (or ProfileV1.tsx)
       ↓
     SectionWrapper
       ↓
     ProfileContainer (feature component)
```

### Favorites Page
```
Route: /favorites
Flow: pages/Favorites/Favourites.tsx (wrapper)
       ↓
     SectionWrapper + PageHeader
       ↓
     features/profile/components/Favorites/Favourites.tsx (feature component)
```

### Notifications Page
```
Route: /notification
Flow: pages/Notifications.tsx (wrapper)
       ↓
     SectionWrapper + PageHeader
       ↓
     features/profile/components/Notifications.tsx (feature component)
```

### Settings Page
```
Route: /settings
Flow: pages/Settings/Settings.tsx (wrapper)
       ↓
     SectionWrapper + PageHeader
       ↓
     features/profile/components/Settings/Settings.tsx (feature component)
```

## 📋 Component Responsibilities

### Page Components (pages/Profile/*)
- **Purpose:** Route-level containers with layout wrappers
- **Responsibilities:**
  - Wrap feature components with SectionWrapper/PageHeader
  - Add page-level logging
  - Track component lifecycle
  - Handle page-level state if needed
- **Pattern:** `SectionWrapper → PageHeader → Feature Component`

### Feature Components (features/profile/components/*)
- **Purpose:** Business logic and UI implementation
- **Responsibilities:**
  - Render the actual UI
  - Handle user interactions
  - Manage local state
  - Integrate with Redux/API
  - Call logger for interactions
- **Pattern:** Mui components + custom hooks

### Version Components (pages/Profile/V/*)
- **Purpose:** Alternative page implementations
- **Responsibilities:**
  - Provide different visual/functional approaches
  - Maintained for A/B testing or demos
  - Track version-specific lifecycle
  - Use the same feature components
- **Pattern:** SectionWrapper → Different layout or wrapper

## 🔍 Logger Integration Points

### Page Level
```tsx
// At page mount
logComponent.mount('ProfilePage');
info('PAGE', 'Profile accessed', { timestamp });

// On unmount
logComponent.unmount('ProfilePage');
```

### Feature Level
```tsx
// Component lifecycle
useEffect(() => {
  logComponent.mount('FeatureName');
  info('FEATURE', 'Component ready', { details });
  return () => logComponent.unmount('FeatureName');
}, []);

// User interactions
const handleAction = () => {
  debug('INTERACTION', 'Action triggered', { context });
  info('ACTION', 'User did something', { data });
};
```

### Navigation
```tsx
const handleNavigate = () => {
  info('NAVIGATION', 'Navigating to...', { target: '/path' });
  navigate('/path');
};
```

## 💻 Usage Examples

### Using Profile in Routes
```tsx
// In app/routes/index.tsx
import { Profile, Favourites, Notifications, Settings } from '@pages/Profile';

<Route path="profile" element={<Profile />} />
<Route path="favorites" element={<Favourites />} />
<Route path="notification" element={<Notifications />} />
<Route path="settings" element={<Settings />} />
```

### Using Logger in Profile Component
```tsx
import { useLogger, logComponent } from '@/core/dev/contexts/LoggerContext';

function ProfileContainer() {
  const { info, debug } = useLogger();

  useEffect(() => {
    logComponent.mount('ProfileContainer');
    info('COMPONENT', 'Ready to display profile');
    return () => logComponent.unmount('ProfileContainer');
  }, [info]);

  const handleEdit = () => {
    debug('INTERACTION', 'Edit clicked');
    info('ACTION', 'Starting profile edit');
  };

  return (
    // JSX here
  );
}
```

### Using DevVersionRenderer for Testing
1. Login with dev@ account
2. Click developer menu (⚙️)
3. Select "Profile"
4. Choose between versions:
   - Profile_V (default, using ProfileContainer)
   - ProfileV1 (alternative, responsive layout)

## 🎯 Development Workflow

### To Add a New Feature to Profile

1. **Create feature component**
   ```
   features/profile/components/MyFeature/MyFeature.tsx
   ```

2. **Create page wrapper**
   ```
   pages/Profile/MyFeature/index.tsx
   // SectionWrapper + PageHeader + Feature
   ```

3. **Add route**
   ```tsx
   // app/routes/index.tsx
   <Route path='myfeature' element={<MyFeature />} />
   ```

4. **Add logger integration**
   ```tsx
   // In both page and feature components
   useEffect(() => {
     logComponent.mount('ComponentName');
     info('PAGE', 'Component accessed');
     return () => logComponent.unmount('ComponentName');
   }, [info]);
   ```

### To Add a New Profile Version

1. **Create version file**
   ```
   pages/Profile/V/ProfileV2.tsx
   ```

2. **Use SectionWrapper + Feature Components**
   ```tsx
   const ProfileV2 = () => {
     return (
       <SectionWrapper>
         <YourAlternativeLayout>
           <ProfileContainer />
         </YourAlternativeLayout>
       </SectionWrapper>
     );
   };
   ```

3. **DevVersionRenderer automatically picks it up**
   - No manual registration needed
   - Auto-appears in dev menu

## 📊 Version Switching Storage

Versions are persisted in localStorage:

```javascript
// Key: zom2_dev_versions
{
  "Profile": "ProfileV1",  // Currently selected version
  "Home": "Home_V",        // Other page versions
}
```

## 🐛 Debugging Tips

### View All Profile Logs
```typescript
import { useLogger } from '@/core/dev/contexts/LoggerContext';

const { getLogs } = useLogger();
const profileLogs = getLogs({ source: 'Profile' });
console.log(profileLogs);
```

### Check Version History
```javascript
// In browser console
const versions = localStorage.getItem('zom2_dev_versions');
console.log(JSON.parse(versions));
```

### Monitor Specific Feature
```typescript
const { logs } = useLogger();
const favoriteActions = logs.filter(log => 
  log.category === 'ACTION' && log.source === 'Favorites'
);
```

## ✨ Key Features

✅ **Dynamic Version Switching** - Switch between implementations without reload
✅ **Complete Logger Integration** - Track all user actions
✅ **Consistent Patterns** - Matches Home page architecture
✅ **Type Safety** - Full TypeScript support
✅ **Error Boundaries** - Each version wrapped for safety
✅ **Responsive Design** - Works on all screen sizes
✅ **Developer Friendly** - Easy to extend and maintain

## 🔗 Related Resources

- **Logger System:** See LOGGER_QUICK_REFERENCE.md
- **Home Pattern:** See src/pages/Home/index.tsx
- **Full Documentation:** See PROFILE_REFACTORING_SUMMARY.md
- **Routes:** See src/app/routes/index.tsx

## 📝 Checklist for Using New Structure

- [ ] Profile page loads correctly at `/profile`
- [ ] Can see logs in browser console
- [ ] Can switch versions in dev menu
- [ ] Logs persist in localStorage
- [ ] Favorites page works at `/favorites`
- [ ] Can remove favorite items
- [ ] Notifications page accessible
- [ ] Settings page accessible
- [ ] All interactions are logged
- [ ] Version selection persists across page reloads

---

**Profile Feature is now fully modern and maintainable! 🎉**
