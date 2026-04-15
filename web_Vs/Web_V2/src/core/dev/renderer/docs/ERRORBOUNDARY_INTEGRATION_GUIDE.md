# ErrorBoundary Integration Guide

## Overview
ErrorBoundary is integrated using a class component that catches React errors and displays a user-friendly fallback UI. Errors are automatically logged to Sentry for monitoring.

---

## ✅ Current Integration Points

### 1. **Root Level** (`src/main.tsx`)
```tsx
<ErrorBoundary>
  <BrowserRouter>
    <ThemeProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </ThemeProvider>
  </BrowserRouter>
</ErrorBoundary>
```
**Purpose:** Catches critical app-level errors that would crash the app entirely.  
**Shows:** Full-screen error UI with refresh/home/back buttons.

### 2. **App Level** (`src/App.tsx`)
```tsx
<ErrorBoundary>
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
</ErrorBoundary>
```
**Purpose:** Catches errors in auth flow and route handling.  
**Shows:** Error UI if AuthProvider or AppRoutes fail.

---

## 🔧 How It Works

### Error Scenarios Handled:
1. **Component Render Errors** — Invalid JSX, null reference, type errors
2. **Lifecycle Errors** — Errors in useEffect, getDerivedStateFromProps
3. **Event Handler Errors** — Currently **NOT caught** (need try-catch in handlers)
4. **Async Errors** — Can be caught if wrapped in suspense + error boundary

### Not Caught:
- Event handler errors (use try-catch inside handlers)
- Asynchronous code errors (promises, callbacks)
- Server-side rendering errors
- Errors in the error boundary itself

---

## 📍 Optional: Add Feature-Level Boundaries

For critical features (Checkout, Orders, Profile), add ErrorBoundary to prevent one feature from crashing the entire app:

### Example: Wrap Checkout Page
**File:** `src/pages/Cart/Checkout/Checkout.tsx`

```tsx
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

const CheckoutPage = () => {
  return (
    <ErrorBoundary fallback={<CustomCheckoutError />}>
      <div className="checkout-container">
        {/* Checkout form here */}
      </div>
    </ErrorBoundary>
  );
};

// Optional custom fallback for this feature
const CustomCheckoutError = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Checkout Error</h2>
    <p>Failed to load checkout. Please try again or contact support.</p>
  </div>
);

export default CheckoutPage;
```

### Example: Wrap Restaurant Details
**File:** `src/pages/RestaurantDetails/index.tsx`

```tsx
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

const RestaurantDetails = ({ restaurantId }: Props) => {
  return (
    <ErrorBoundary>
      {/* Restaurant menu, reviews, details */}
    </ErrorBoundary>
  );
};
```

---

## 🎯 Best Practices

### 1. **Multiple Boundaries by Feature**
```
App
├─ ErrorBoundary (root)
├─ Header
├─ Navigation
│  └─ ErrorBoundary
│     └─ NavLinks
├─ MainContent
│  ├─ ErrorBoundary
│  │  └─ RestaurantCard
│  └─ ErrorBoundary
│     └─ Checkout
└─ Footer
```

### 2. **Combine with Sentry**
Already configured to log errors:
```tsx
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  Sentry.captureException(error, { extra: errorInfo });
}
```

### 3. **Custom Fallbacks for Context**
```tsx
<ErrorBoundary fallback={<div>Cart Error</div>}>
  <CartSummary />
</ErrorBoundary>
```

### 4. **Error Boundaries + Suspense**
```tsx
<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <HeavyComponent />
  </Suspense>
</ErrorBoundary>
```

---

## 🧪 Testing ErrorBoundary

### Trigger Error in Development
```tsx
const TestErrorComponent = () => {
  const [shouldError, setShouldError] = useState(false);
  
  if (shouldError) {
    throw new Error('Test error boundary');
  }
  
  return (
    <button onClick={() => setShouldError(true)}>
      Trigger Error
    </button>
  );
};

// Wrap it
<ErrorBoundary>
  <TestErrorComponent />
</ErrorBoundary>
```

### View Error Stack (Dev Mode Only)
```tsx
// In development, errors show full component stack
{process.env.NODE_ENV === 'development' && this.state.errorInfo && (
  <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
    <Typography variant="caption" component="pre">
      {this.state.errorInfo.componentStack}
    </Typography>
  </Box>
)}
```

---

## 🚀 Advanced: Additional Error Boundaries

### For Async Operations
Create a hooks-based error handler:
```tsx
// src/core/hooks/useAsyncError.ts
export const useAsyncError = () => {
  const [, setError] = useState();
  return useCallback(
    (error: Error) => setError(() => {
      throw error;
    }),
    [setError],
  );
};

// Usage in component with async
const MyComponent = () => {
  const throwError = useAsyncError();
  
  useEffect(() => {
    fetchData()
      .catch(err => throwError(err));
  }, []);
};

// Wrap with ErrorBoundary
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

### For Event Handlers
Manually wrap event handlers:
```tsx
const handleSubmit = async (e: FormEvent) => {
  try {
    e.preventDefault();
    await submitForm();
  } catch (error) {
    console.error('Form error:', error);
    showErrorToast('Failed to submit form');
  }
};
```

---

## 📋 Checklist: When to Add ErrorBoundary

- [x] Root app (main.tsx) — **DONE**
- [x] App providers (App.tsx) — **DONE**
- [ ] Cart Checkout page
- [ ] Restaurant Details page
- [ ] Order Tracking page
- [ ] User Profile page
- [ ] Admin Dashboard
- [ ] Restaurant Owner Panel
- [ ] Delivery Partner App

---

## 🔗 References

- [React Error Boundaries Docs](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [withRouter (React Router v6)](https://reactrouter.com/en/main/start/overview)

---

## Summary

**ErrorBoundary is now active at:**
1. ✅ Root level (catches app crashes)
2. ✅ App level (catches auth/routing crashes)
3. ⏳ Optional: Feature level (for critical features)

**Next Steps:**
- Add feature-level ErrorBoundaries for critical user flows
- Monitor Sentry for error patterns
- Add custom fallback UIs for specific features
- Implement async error handling with custom hooks
