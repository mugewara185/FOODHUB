# Zom2 - Complete Data Architecture & Flow Planning

## 1. OVERVIEW

**Project Type:** MERN Stack Food Delivery Application (Similar to Zomato/Uber Eats)

**Current Status:**
- ✅ Auth Flow (Login, Signup, Forgot/Reset Password)
- ✅ Cart Management (Add, Remove, Update Quantity, Coupons)
- ✅ Restaurants & Menu Items (Browse, View)
- ⚠️ Orders (Basic structure, needs completion)
- ⚠️ Reviews (Feature folder exists, needs implementation)
- ✅ UI State (Theme, Drawers, Modals, Toasts)

**Tech Stack:**
- Frontend: React + TypeScript + Redux Toolkit + Vite
- Backend: Node.js + Express + MongoDB (assumed)
- State Mgmt: Redux + Redux-Persist
- Routing: React Router v6
- Data Generation: Faker.js + Custom Factories

---

## 2. CORE DATA COLLECTIONS

### 2.1 User Collection
```typescript
User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'user' | 'restaurant_owner' | 'delivery_partner';
  address?: string;
  restaurantId?: string; // For restaurant owners
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

AuthUser extends User {
  token: string; // JWT
  refreshToken: string;
  expiresAt: number;
  permissions: Permission[];
}
```

**Permissions:**
- `view_dashboard`, `manage_users`, `manage_restaurants`, `manage_menu`, `manage_orders`
- `manage_payments`, `view_reports`, `manage_delivery`
- `place_order`, `view_profile`, `manage_own_restaurant`, `manage_own_orders`
- `track_orders`, `cancel_orders`

**Mock Credentials (Dev):**
```
Admin: admin@ / admin
Dev: dev@ / dev
Owner: owner@ / owner
Partner: partner@ / partner
User: user@ / user
```

---

### 2.2 Restaurant Collection
```typescript
Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string[]; // ['Italian', 'Mexican', etc.]
  rating: number; // 1-5
  deliveryTime: string; // "20-30 min"
  deliveryFee: number;
  minOrder: number;
  image: string; // URL
  bannerImage?: string;
  address: string;
  location?: string;
  geoLocation?: { lat: number; lng: number };
  isOpen: boolean;
  isFeatured: boolean;
  isVeg?: boolean;
  tags: string[]; // ['Fast Delivery', 'Best Seller', etc.]
  contact?: {
    phone: string;
    email: string;
  };
  openingHours?: Array<{
    day: string; // "Monday", "Tuesday", etc.
    open: string; // "09:00"
    close: string; // "23:00"
  }>;
}
```

**Current:** 60 mock restaurants generated with cuisines, locations, and basic data.

---

### 2.3 FoodItem / MenuItem Collection
```typescript
FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For discounts
  image: string;
  category: string; // "Pizza", "Burger", "Indian", etc.
  restaurantId: string;
  restaurantName: string;
  isVeg: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  isAvailable: boolean;
  rating: number;
  
  // Customization
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
  }>;
  variants?: Array<{
    id: string;
    name: string; // "Regular", "Medium", "Large"
    price: number;
  }> | null;
  
  // Nutritional Info
  ingredients?: string[];
  dietaryInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

MenuItem {
  restaurantId: string;
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
}
```

**Current:** Mock food items with variants, addons, and dietary info for pizzas, burgers, and Indian food.

---

### 2.4 Cart Collection
```typescript
// Redis/Session-based per user
Cart {
  userId: string;
  id: string;
  items: CartItem[];
  restaurantId: string | null; // Single restaurant per cart
  restaurantName: string | null;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  couponCode: string | null;
  discount: number;
  itemCount: number;
}

CartItem {
  id: string; // UUID
  foodItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurantId: string;
  restaurantName: string;
  isVeg: boolean;
  specialInstructions?: string;
  addons?: Array<{ name: string; price: number }>;
}

CustomizedItem extends CartItem {
  foodItem: FoodItem;
  selectedAddons?: FoodItem['addons'];
  selectedVariant?: FoodItem['variants'][number] | null;
  specialInstructions?: string;
}
```

**Current:** Full Redux implementation with add/remove/update/clear/coupon apply.
**Persistence:** Redux-Persist (localStorage)

---

### 2.5 Order Collection
```typescript
Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: Array<{
    foodItemId: string;
    name: string;
    quantity: number;
    price: number;
    addons?: Array<{ name: string; price: number }>;
    specialInstructions?: string;
  }>;
  
  // Totals
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  couponCode?: string;
  
  // Status & Tracking
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: string; // 'card', 'upi', 'wallet', 'cash'
  paymentStatus: 'pending' | 'completed' | 'failed';
  
  // Delivery Info
  deliveryPartner?: {
    id: string;
    name: string;
    phone: string;
    currentLocation?: { lat: number; lng: number };
  };
  deliveryAddress: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

**Current:** Basic mock data with status variations. Needs: payment integration, real-time status updates, delivery partner assignment.

---

### 2.6 Review Collection
```typescript
Review {
  id: string;
  userId: string;
  userName: string;
  restaurantId: string;
  restaurantName: string;
  orderItemId?: string; // Optional: link to specific food item
  rating: number; // 1-5, can be decimal (4.5)
  title?: string;
  comment: string;
  photos?: string[]; // URLs
  helpful: number; // Count of helpful votes
  unhelpful: number;
  createdAt: string;
  updatedAt: string;
}
```

**Current:** Mock data generated. Needs: review creation UI, photo upload integration, helpful/unhelpful voting.

---

### 2.7 OPTIONAL Advanced Collections (Not Yet Implemented)

#### Favorites/Wishlist
```typescript
Favorite {
  id: string;
  userId: string;
  restaurantId?: string;
  foodItemId?: string;
  createdAt: string;
}
```

#### Payment Methods
```typescript
PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking';
  provider: string; // 'Visa', 'RazorPay', 'PayPal'
  lastFourDigits?: string;
  isDefault: boolean;
  expiryDate?: string; // For cards
  createdAt: string;
}
```

#### Coupons/Promotions
```typescript
Coupon {
  code: string;
  description: string;
  discountType: 'flat' | 'percentage' | 'buy_one_get_one';
  value: number;
  expiryDate: string;
  applicableRestaurantIds?: string[]; // null = all restaurants
  applicableCuisines?: string[];
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
}
```

#### DeliveryPartner
```typescript
DeliveryPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  vehicleType: 'bike' | 'car' | 'cycle';
  registrationNumber?: string;
  currentLocation?: { lat: number; lng: number };
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  activeOrders: Order[];
  createdAt: string;
}
```

#### SearchHistory
```typescript
SearchHistory {
  id: string;
  userId: string;
  query: string;
  timestamp: string;
}
```

---

## 3. DATA FLOW ARCHITECTURE

### 3.1 Authentication Flow
```
User Input (Email, Password)
    ↓
LoginThunk (authSlice.ts)
    ↓
Validate against users[] factory
    ↓
Generate AuthUser with JWT
    ↓
Store in Redux + localStorage (redux-persist)
    ↓
Set isAuthenticated = true
    ↓
Redirect to Home/Dashboard
```

**Flow Diagram:**
```
[Login Page]
    ↓
[Form Submission]
    ↓
[authSlice.loginThunk]
    ↓
[API/FakeAPI call]
    ↓
[Validate Credentials]
    ↓
[Generate JWT Token]
    ↓
[Update Redux + localStorage]
    ↓
[ProtectedRoute allows access]
    ↓
[Home/Dashboard]
```

---

### 3.2 Restaurant & Menu Fetching Flow
```
[Home Page Loads]
    ↓
[restaurantReducer state]
    ↓
[Fetch Restaurants] → restaurants[] factory
    ↓
[Fetch Menu Items] → menus[] factory (grouped by restaurantId)
    ↓
[Filter by Cuisine/Location/Rating]
    ↓
[Display in RestaurantCard components]
    ↓
[Click Restaurant]
    ↓
[Route to /restaurants/:id]
    ↓
[Display Menu Items for that Restaurant]
```

**Components:**
- `RestaurantCard.tsx` - Lists restaurants
- `RestaurantDetails page` - Shows menu for selected restaurant
- `FoodItem component` - Shows individual food with addons/variants

---

### 3.3 Shopping Cart Flow
```
[Browse Menu Items]
    ↓
[Click "Add to Cart"]
    ↓
[cartSlice.addToCart action]
    ↓
Check if different restaurant
    ├─ YES: Clear cart, add new item
    └─ NO: Add item or increment quantity
    ↓
[Calculate totals: subtotal, tax, deliveryFee, total]
    ↓
[Update Redux state]
    ↓
[Persist to localStorage]
    ↓
[Show Toast notification]
    ↓
[User can open Cart Drawer]
    ↓
[View items, update quantity, remove items]
    ↓
[Apply coupon code]
    ├─ SAVE10: 10% discount
    └─ FLAT50: ₹50 discount
    ↓
[Proceed to Checkout]
```

**Reducers:**
- `addToCart` - Add item or increment
- `removeFromCart` - Remove item by ID
- `updateQuantity` - Change quantity
- `clearCart` - Empty cart
- `applyCoupon` - Apply discount code
- `updateDeliveryFee` - Set delivery fee

---

### 3.4 Order Placement Flow
```
[Cart with items & coupon applied]
    ↓
[Click "Proceed to Checkout"]
    ↓
[/checkout route]
    ↓
[Display Order Summary]
├─ Items with prices
├─ Subtotal
├─ Tax
├─ Delivery Fee
├─ Discount (if coupon)
└─ Total
    ↓
[Enter Delivery Address]
    ↓
[Select Payment Method]
├─ Card
├─ UPI
├─ Wallet
└─ Cash on Delivery
    ↓
[Place Order]
    ↓
[orderSlice.createOrder / API call]
    ↓
[Create Order document in MongoDB]
    ↓
[Process Payment (if not COD)]
    ↓
[Update Order status: pending → confirmed]
    ↓
[Clear Cart]
    ↓
[Redirect to /orders]
    ↓
[Show Order Confirmation]
├─ Order ID
├─ Estimated Delivery Time
├─ Tracking Link
└─ Receipt
```

---

### 3.5 Order Tracking Flow
```
[User Views /orders page]
    ↓
[Fetch user's orders from DB]
    ↓
[Group by Status: pending, confirmed, preparing, out_for_delivery, delivered, cancelled]
    ↓
[Display Order Cards]
├─ Order ID, Restaurant
├─ Items, Total, Status
├─ Estimated Delivery Time
└─ Action Buttons (Track, Cancel, Reorder)
    ↓
[Click "Track Order"]
    ↓
[Socket.io connection for real-time updates]
    ↓
[Show delivery partner location on map]
    ↓
[Show order status timeline]
├─ Order Placed
├─ Restaurant Confirmed
├─ Preparing
├─ Out for Delivery
└─ Delivered
```

---

### 3.6 Review Flow
```
[Order Delivered]
    ↓
[User sees "Write Review" button on order card]
    ↓
[Click "Write Review"]
    ↓
[Modal/Form Opens]
├─ Star rating (1-5)
├─ Title (optional)
├─ Comment (text)
└─ Photos (optional upload)
    ↓
[Submit Review]
    ↓
[POST to /api/reviews]
    ↓
[Save to MongoDB]
    ↓
[Update Restaurant rating (average of all reviews)]
    ↓
[Display review on Restaurant Details page]
    ↓
[Show all reviews sorted by helpful/recent]
```

---

### 3.7 User Profile Flow
```
[User clicks Profile]
    ↓
[/profile route]
    ↓
[Display Authentication Status]
├─ Name, Email, Phone, Avatar
├─ Role, Verification Status
└─ Edit Profile button
    ↓
[Sub-tabs/Sections]
├─ Orders
├─ Favorites
├─ Saved Addresses
├─ Payment Methods
├─ Notifications
└─ Settings
    ↓
[Update Profile]
    ↓
[authSlice.updateProfile]
    ↓
[Patch /api/users/:id]
    ↓
[Update Redux + localStorage]
    ↓
[Show success toast]
```

---

## 4. REDUX STORE STATE SHAPE

### Current State (Store_V.ts)
```typescript
RootState {
  auth: {
    user: AuthUser | null;
    isLoggedIn: boolean;
    loading: boolean;
    isAuthenticated: boolean;
    error: string | null;
  };

  cart: {
    items: CartItem[];
    restaurantId: string | null;
    restaurantName: string | null;
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
    couponCode: string | null;
    discount: number;
    itemCount: number;
  };

  restaurants: {
    // Likely empty or basic structure
    // Needs implementation
  };

  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    cartDrawerOpen: boolean;
    searchDrawerOpen: boolean;
    currentModal: string | null;
    toast: {
      open: boolean;
      message: string;
      type: 'success' | 'error' | 'info' | 'warning';
    };
    loading: { [key: string]: boolean };
  };

  // MISSING:
  // orders?: { items: Order[]; currentOrder?: Order; loading: boolean; error?: string };
  // reviews?: { items: Review[]; loading: boolean };
  // menu?: { items: MenuItem[]; loading: boolean };
  // favorites?: { items: Favorite[]; loading: boolean };
  // profile?: { user: User; loading: boolean };
}
```

**Persistence Config:**
```typescript
persistConfig = {
  key: 'root',
  whitelist: ['auth', 'cart'], // Only auth & cart are persisted
  storage: localStorage (or sessionStorage for dev)
}
```

---

## 5. API ENDPOINTS REQUIRED

### Authentication
```
POST   /api/auth/login
POST   /api/auth/signup
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/refresh-token
GET    /api/auth/current-user
```

### Restaurants & Menus
```
GET    /api/restaurants
GET    /api/restaurants/:id
GET    /api/restaurants/:id/menu
GET    /api/restaurants/search
GET    /api/restaurants/filter?cuisine=Italian&rating=4.5
GET    /api/menu-items
GET    /api/menu-items/:id
```

### Cart (Optional - mostly client-side)
```
POST   /api/carts
GET    /api/carts/:userId
PATCH  /api/carts/:userId
DELETE /api/carts/:userId
POST   /api/coupons/validate
```

### Orders
```
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
DELETE /api/orders/:id/cancel
GET    /api/orders/:id/track
```

### Reviews
```
POST   /api/reviews
GET    /api/reviews?restaurantId=r1
GET    /api/reviews/:id
PATCH  /api/reviews/:id
DELETE /api/reviews/:id
POST   /api/reviews/:id/helpful
```

### User Profile
```
GET    /api/users/:id
PATCH  /api/users/:id
POST   /api/users/:id/avatar
GET    /api/users/:id/addresses
POST   /api/users/:id/addresses
DELETE /api/users/:id/addresses/:addressId
```

### Payments (if implementing backend)
```
POST   /api/payments/initialize
POST   /api/payments/verify
GET    /api/payment-methods
POST   /api/payment-methods
DELETE /api/payment-methods/:id
```

---

## 6. FEATURE COMPLETION CHECKLIST

### ✅ DONE
- [x] Auth (Login, Signup, Forgot/Reset Password)
- [x] Restaurants (List, Card display)
- [x] Menu Items (Display, variants, addons)
- [x] Cart (Add, Remove, Update, Coupon)
- [x] UI State (Theme, Drawers, Toasts)

### 🔄 IN PROGRESS / PARTIAL
- [ ] Orders (Redux slice exists, needs full implementation)
  - [ ] Order creation saga
  - [ ] Order list display
  - [ ] Order tracking UI
- [ ] Reviews (Feature folder exists, needs slice/components)

### ⏳ NOT STARTED
- [ ] Favorites/Wishlist
- [ ] Payment Integration (Razorpay/PayPal)
- [ ] Real-time Order Status (Socket.io)
- [ ] Delivery Partner Assignment
- [ ] Admin Dashboard
- [ ] Restaurant Owner Panels
- [ ] Delivery Partner App

---

## 7. MOCK DATA FACTORIES (CURRENT)

All in `src/data/factories/`:

1. **restaurants.ts** - 60 mock restaurants with cuisines, locations, ratings
2. **foodItems.ts** - Sample food items with addons/variants/dietary info
3. **menus.ts** - 8 menu items per restaurant (generated dynamically)
4. **users.ts** - 5 hard-coded users (Admin, Dev, Owner, Partner, User) + generator
5. **orders.ts** - 20 mock orders with status variations
6. **reviews.ts** - 40 mock reviews

**Improvements Needed:**
- Expand food items to match restaurants
- Add pricing tiers (breakfast, lunch, dinner)
- Include more realistic descriptions
- Generate images from Unsplash/CDN

---

## 8. DATABASE SCHEMA (MongoDB)

### Collections to Create:

```javascript
// users
{
  _id: ObjectId,
  name, email, phone, avatar, role, address,
  password: hashed,
  isActive, emailVerified, phoneVerified,
  createdAt, updatedAt
}

// restaurants
{
  _id: ObjectId,
  name, description, cuisine[], rating,
  image, bannerImage, address, location, geoLocation,
  deliveryTime, deliveryFee, minOrder,
  isOpen, isFeatured, tags, contact, openingHours,
  createdAt, updatedAt
}

// menuItems / foodItems
{
  _id: ObjectId,
  restaurantId, name, description, price, originalPrice,
  image, category, isVeg, isSpicy, isBestSeller,
  isAvailable, rating, addons[], variants[],
  ingredients[], dietaryInfo,
  createdAt, updatedAt
}

// orders
{
  _id: ObjectId,
  userId, restaurantId, items[], subtotal, tax,
  deliveryFee, discount, total, couponCode,
  status, paymentMethod, paymentStatus,
  deliveryPartner, deliveryAddress, estimatedTime,
  actualDeliveryTime, createdAt, updatedAt
}

// reviews
{
  _id: ObjectId,
  userId, restaurantId, orderItemId,
  rating, title, comment, photos[], helpful, unhelpful,
  createdAt, updatedAt
}

// favorites
{
  _id: ObjectId,
  userId, restaurantId | foodItemId, createdAt
}

// paymentMethods
{
  _id: ObjectId,
  userId, type, provider, lastFourDigits,
  isDefault, expiryDate, createdAt
}

// coupons
{
  _id: ObjectId,
  code, description, discountType, value, expiryDate,
  applicableRestaurantIds, minOrderAmount, maxDiscountAmount,
  usageLimit, usedCount, createdAt
}
```

---

## 9. NEXT STEPS FOR DEVELOPMENT

### Phase 1: Core Features (Current Work)
1. **Complete Restaurant Feature**
   - Fetch restaurants from backend
   - Add filtering (cuisine, rating, delivery time)
   - Add search functionality

2. **Complete Order Feature**
   - Create `/checkout` page with address & payment selection
   - Implement order creation API call
   - Clear cart after successful order
   - Display order confirmation

3. **Complete Review Feature**
   - Create review form component
   - Implement review submission
   - Display reviews on restaurant details

### Phase 2: Advanced Features
4. **Favorites/Wishlist**
   - Add to favorites toggle on restaurant/food item
   - Display favorites page
   - Redux slice for favorites

5. **User Addresses**
   - Save multiple delivery addresses
   - Select address during checkout
   - Profile address management

6. **Payment Integration**
   - Razorpay or Stripe integration
   - Multiple payment method support
   - Payment status tracking

### Phase 3: Real-time & Analytics
7. **Real-time Features**
   - Socket.io for order status updates
   - Live delivery partner tracking
   - Chat with support

8. **Admin Dashboard**
   - User management
   - Order analytics
   - Revenue reports

9. **Analytics & Notifications**
   - Track user activity
   - Email/SMS notifications
   - Push notifications

---

## 10. KEY DEVELOPMENT NOTES

1. **State Persistence:** Currently `auth` and `cart` are persisted to localStorage. Consider adding `favorites` and `addresses` to whitelist.

2. **Redux Sagas:** Code uses thunks, not sagas. Consider adding sagas for complex async flows (order tracking, payment processing).

3. **Type Safety:** Excellent TypeScript usage. Maintain strict typing, especially for data mutations.

4. **Mock Data:** Using Faker.js + custom factories. Will transition to backend API calls once backend is ready.

5. **Environment:** Dev tools enable session isolation mode for testing multiple tabs.

6. **Styling:** Check ThemeProvider and UIProvider context for styling approach (likely Tailwind or MUI).

7. **Testing:** `vitest.config.ts` and `App.test.ts` placeholders exist. No tests written yet - consider TDD approach.

---

## Summary

**Your app has a solid foundation with:**
- ✅ Proper type definitions for core entities
- ✅ Redux store structure
- ✅ Mock data factories
- ✅ Auth flow implemented
- ✅ Cart fully functional

**Focus next on:**
1. Complete Orders feature (checkout → order creation)
2. Complete Reviews feature
3. Wire backend API calls
4. Add real-time status tracking
5. Implement favorites & addresses

**Data model is complete and extensible** - All major collections defined, ready for MongoDB storage and API integration.
