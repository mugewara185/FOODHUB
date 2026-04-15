export interface Restaurant {
  id: string;
  name: string;
  location?: string;
  description: string;
  cuisine: string[];
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  image: string;
  bannerImage?: string;
  address: string;
  isOpen: boolean;
  isFeatured: boolean;
  isVeg?: boolean;
  tags: string[];
}
export interface CartItem {
  id: string;
  foodItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurantId: string;
  restaurantName: string;
  isVeg: boolean;
  specialInstructions?: string;
  addons?: { name: string; price: number }[];
};
export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  restaurantId: string;
  restaurantName: string;
  isVeg: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  isAvailable: boolean;
  rating: number;
}

export type MenuItem = {
  restaurantId: string;
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
};


export type Cart = {
  userId: string;
  id: string;
  items: CartItem[];
  total: number;
};

export type User = {
  id: string;
  password?: string;
  role?: string;
  name: string;
  email: string;
  avatar?: string;
  address?: string;
};

export type Order = {
  userId: string;
  id: string;
  restaurantId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
};

export type Review = {
  userId: string;
  id: string;
  restaurantId: string;
  rating: number;
  comment: string;
  createdAt: string;
};


// //TOO ADD 
// // 🧠 Personalization & UX
// export type SearchHistory = {
//   userId: string;
//   query: string;
//   timestamp: string;
// };
// export type FavoriteRestaurant = {
//   userId: string;
//   restaurantId: string;
// };
// export type FavoriteItem = {
//   userId: string;
//   menuItemId: string;
// };

// // 📦 Logistics & Tracking
// export type DeliveryStatus = {
//   orderId: string;
//   status: "preparing" | "out_for_delivery" | "delivered" | "delayed";
//   updatedAt: string;
//   estimatedArrival?: string;
//   deliveryPartnerId?: string;
// };

// // 🧾 Business & Operational Expansion
// export type RestaurantBranch = {
//   id: string;
//   restaurantId: string;
//   address: string;
//   contactNumber?: string;
//   openingHours: { day: string; open: string; close: string }[];
//   geoLocation?: { lat: number; lng: number };
// };
// export type DeliveryPartner = {
//   id: string;
//   name: string;
//   phone: string;
//   vehicleType: "bike" | "car" | "cycle";
//   currentLocation?: { lat: number; lng: number };
//   isAvailable: boolean;
// };
// export type PaymentMethod = {
//   id: string;
//   userId: string;
//   type: "card" | "upi" | "wallet";
//   provider: string;
//   lastFourDigits?: string;
//   isDefault: boolean;
// };
// export type Coupon = {
//   code: string;
//   description: string;
//   discountType: "flat" | "percentage";
//   value: number;
//   expiryDate: string;
//   applicableRestaurantIds?: string[];
//   minOrderAmount?: number;
// };

// // 🛠 Admin & Moderation
// export type RestaurantAdmin = {
//   id: string;
//   restaurantId: string;
//   name: string;
//   email: string;
//   role: "owner" | "manager" | "staff";
// };
// export type Report = {
//   id: string;
//   reportedBy: string;
//   targetType: "review" | "restaurant" | "menuItem";
//   targetId: string;
//   reason: string;
//   createdAt: string;
// };

// // 📊 Analytics & Feedback
// export type AnalyticsEvent = {
//   userId?: string;
//   eventType: string;
//   metadata?: Record<string, any>;
//   timestamp: string;
// };