// ============================================================================
// CORE DOMAIN TYPES - ACTIVE/PRODUCTION USE
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────
// 1. USER & AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'restaurant_owner' | 'user' | 'delivery_partner';

export type Permission =
  | 'view_dashboard'
  | 'manage_users'
  | 'manage_restaurants'
  | 'manage_menu'
  | 'manage_orders'
  | 'manage_payments'
  | 'view_reports'
  | 'manage_delivery'
  | 'place_order'
  | 'view_profile'
  | 'manage_own_restaurant'
  | 'manage_own_orders'
  | 'track_orders'
  | 'cancel_orders';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  restaurantId?: string; // For restaurant owners
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
  refreshToken: string;
  expiresAt: number;
  permissions: Permission[];
}

// ─────────────────────────────────────────────────────────────────────────
// 2. RESTAURANT & LOCATION
// ─────────────────────────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface OpeningHours {
  day: string; // "Monday", "Tuesday", etc.
  open: string; // "09:00"
  close: string; // "23:00"
}

export interface ContactInfo {
  phone: string;
  email?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string[]; // ['Italian', 'Mexican', etc.]
  rating: number; // 1-5
  deliveryTime: string; // "20-30 min"
  deliveryFee: number;
  minOrder: number;
  image: string; // Primary image URL
  bannerImage?: string; // Banner image URL
  address: string;
  location: Coordinates; // { lat, lng }
  isOpen: boolean;
  isFeatured: boolean;
  isVeg?: boolean;
  tags: string[]; // ['Fast Delivery', 'Best Seller']
  contact?: ContactInfo;
  openingHours?: OpeningHours[];
}

// ─────────────────────────────────────────────────────────────────────────
// 3. FOOD ITEMS & MENU
// ─────────────────────────────────────────────────────────────────────────

export interface Addon {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface Variant {
  id: string;
  name: string; // "Regular", "Medium", "Large"
  price: number;
}

export interface DietaryInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
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
  addons?: Addon[]; // Customization options
  variants?: Variant[]; // Size/Type variations
  ingredients?: string[];
  dietaryInfo?: DietaryInfo;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. CART & CHECKOUT
// ─────────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string; // UUID - unique to cart entry
  foodItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurantId: string;
  restaurantName: string;
  isVeg: boolean;
  specialInstructions?: string;
  addons?: Addon[]; // Selected addons in cart
}

export interface CustomizedCartItem extends CartItem {
  foodItem: FoodItem;
  quantity: number;
  selectedAddons?: Addon[] | any;
  selectedVariant?: Variant | null | any;
  specialInstructions?: string;
}

export interface Cart {
  userId: string;
  id: string;
  items: CartItem[];
  restaurantId: string | null; // Single restaurant per cart
  restaurantName: string | null;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  discount: number;
  itemCount: number;
}

// ─────────────────────────────────────────────────────────────────────────
// 5. ORDERS
// ─────────────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'card' | 'upi' | 'wallet' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface OrderItem {
  foodItemId: string;
  name: string;
  quantity: number;
  price: number;
  addons?: Addon[];
  specialInstructions?: string;
}

export interface DeliveryInfo {
  address: string;
  coordinates?: Coordinates;
  partnerAssigned?: boolean;
  estimatedTime?: string;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  couponCode?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryInfo: DeliveryInfo;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// 6. REVIEWS & RATINGS
// ─────────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  userName: string;
  restaurantId: string;
  restaurantName: string;
  orderId?: string; // Link to order if from completed order
  foodItemId?: string; // If reviewing specific item
  rating: number; // 1-5, can be decimal
  title?: string;
  comment: string;
  photos?: string[]; // Photo URLs
  helpful: number;
  unhelpful: number;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────
// 7. DELIVERY & LOGISTICS (ACTIVE)
// ─────────────────────────────────────────────────────────────────────────

export interface DeliveryPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  vehicleType: 'bike' | 'scooter' | 'car';
  vehicleNumber?: string;
  currentLocation: Coordinates;
  status: 'online' | 'offline' | 'on_delivery';
  rating: number;
  completedDeliveries: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LiveTracking {
  orderId: string;
  partnerId: string;
  partnerName?: string;
  partnerPhone?: string;
  partnerLocation: Coordinates;
  estimatedArrival: string; // ISO timestamp
  status: 'assigned' | 'picked_up' | 'on_the_way' | 'arrived' | 'delivered';
  updatedAt: string;
}

// ============================================================================
// FUTURE FEATURES (Commented - uncomment when needed)
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────
// FAVORITES & PERSONALIZATION
// ─────────────────────────────────────────────────────────────────────────
/*
export interface Favorite {
  id: string;
  userId: string;
  restaurantId?: string;
  foodItemId?: string;
  createdAt: string;
}

export type SearchHistory = {
  id: string;
  userId: string;
  query: string;
  timestamp: string;
};

export type RecentView = {
  id: string;
  userId: string;
  restaurantId?: string;
  foodItemId?: string;
  viewedAt: string;
};
*/

// ─────────────────────────────────────────────────────────────────────────
// PAYMENTS & BILLING
// ─────────────────────────────────────────────────────────────────────────
/*
export interface SavedPaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking';
  provider: string; // 'Visa', 'RazorPay', 'PayPal'
  lastFourDigits?: string;
  isDefault: boolean;
  expiryDate?: string; // For cards
  createdAt: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  userId: string;
  restaurantId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
}

export interface Coupon {
  id: string;
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
*/

// ─────────────────────────────────────────────────────────────────────────
// RESTAURANT MANAGEMENT (Owner Features)
// ─────────────────────────────────────────────────────────────────────────
/*
export interface RestaurantBranch {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  location: Coordinates;
  contactNumber?: string;
  openingHours: OpeningHours[];
}

export interface RestaurantStats {
  restaurantId: string;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  bestSellingItems: string[];
  peakHours: string[];
  lastUpdate: string;
}

export interface RestaurantOwnerPanel {
  id: string;
  ownerId: string;
  restaurantId: string;
  permissions: Permission[];
}
*/

// ─────────────────────────────────────────────────────────────────────────
// ADMIN & MODERATION
// ─────────────────────────────────────────────────────────────────────────
/*
export interface Report {
  id: string;
  reportedBy: string;
  reportedUser?: string;
  targetType: 'review' | 'restaurant' | 'menu_item' | 'user';
  targetId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
}

export interface AdminActivity {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  changes: Record<string, any>;
  timestamp: string;
}

export interface SuspendedUser {
  id: string;
  userId: string;
  reason: string;
  suspendedAt: string;
  suspendedUntil?: string;
  suspendedBy: string;
}
*/

// ─────────────────────────────────────────────────────────────────────────
// ANALYTICS & FEEDBACK
// ─────────────────────────────────────────────────────────────────────────
/*
export type AnalyticsEvent = {
  id: string;
  userId?: string;
  eventType: 'view_restaurant' | 'add_to_cart' | 'checkout' | 'order_placed' | 'review_submitted';
  metadata?: Record<string, any>;
  timestamp: string;
};

export interface UserPreferences {
  userId: string;
  preferredCuisines: string[];
  priceRange: 'low' | 'medium' | 'high';
  preferredRestaurants: string[];
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    reviews: boolean;
  };
  updatedAt: string;
}

export interface PushNotification {
  id: string;
  userId: string;
  type: 'order_update' | 'promotion' | 'review_request' | 'general';
  title: string;
  message: string;
  data?: Record<string, any>;
  sentAt: string;
  readAt?: string;
}
*/

// ============================================================================
// FACTORY INPUT INTERFACE (For dynamic dummy data generation)
// ============================================================================

export interface FactoryInput {
  restaurants: RestaurantFactoryInput[];
  foodItems: FoodItemFactoryInput[];
  users: UserFactoryInput[];
  orders: OrderFactoryInput[];
  reviews: ReviewFactoryInput[];
}

export interface RestaurantFactoryInput {
  count?: number;
  cuisines?: string[];
  locations?: string[];
  priceRanges?: 'low' | 'medium' | 'high'[];
}

export interface FoodItemFactoryInput {
  count?: number;
  categories?: string[];
  vegPercentage?: number; // 0-100
  withAddons?: boolean;
  withVariants?: boolean;
}

export interface UserFactoryInput {
  count?: number;
  roles?: UserRole[];
  includeTestAccounts?: boolean;
}

export interface OrderFactoryInput {
  count?: number;
  statuses?: OrderStatus[];
  dateRange?: { from: string; to: string };
}

export interface ReviewFactoryInput {
  count?: number;
  ratingRange?: { min: number; max: number };
}