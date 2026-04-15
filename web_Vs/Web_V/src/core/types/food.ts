// Restaurant and Food related types

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  image: string;
  bannerImage?: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  isOpen: boolean;
  isFeatured: boolean;
  isVeg: boolean;
  tags: string[];
  contact: string;
  openingHours: {
    open: string;
    close: string;
  }[];
}

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
  ingredients: string[];
  dietaryInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  addons?: Addon[];
  variants?: Variant[];
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface Variant {
  id: string;
  name: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface CartItem {
  id: string;
  foodItem: FoodItem;
  quantity: number;
  selectedAddons: Addon[];
  selectedVariant?: Variant;
  specialInstructions?: string;
}

export interface Cart {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'card' | 'upi' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryAddress: Address;
  deliveryInstructions?: string;
  createdAt: string;
  estimatedDelivery: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  restaurantId?: string;
  foodItemId?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface Cuisine {
  id: string;
  name: string;
  icon: string;
  image: string;
}

export interface FilterOptions {
  cuisine: string[];
  minOrder: number;
  deliveryTime: string;
  rating: number;
  isVeg: boolean;
  isOpen: boolean;
  sortBy: 'rating' | 'deliveryTime' | 'price' | 'name';
}