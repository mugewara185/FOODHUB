// Food App Constants

export const APP_NAME = 'FoodHub';
export const APP_SLOGAN = 'Delicious food delivered to your doorstep';

// API Endpoints
export const API_ENDPOINTS = {
  RESTAURANTS: {
    LIST: '/restaurants',
    DETAIL: (id: string) => `/restaurants/${id}`,
    SEARCH: '/restaurants/search',
    FILTER: '/restaurants/filter',
  },
  FOOD: {
    LIST: '/food',
    BY_RESTAURANT: (restaurantId: string) => `/food/restaurant/${restaurantId}`,
    SEARCH: '/food/search',
    CATEGORIES: '/food/categories',
  },
  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    UPDATE: '/cart/update',
    REMOVE: (itemId: string) => `/cart/remove/${itemId}`,
    CLEAR: '/cart/clear',
  },
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders/create',
    DETAIL: (id: string) => `/orders/${id}`,
    TRACK: (id: string) => `/orders/${id}/track`,
  },
  USER: {
    ADDRESSES: '/user/addresses',
    FAVORITES: '/user/favorites',
    ORDERS: '/user/orders',
  },
};

// Route paths
export const ROUTE_PATHS = {
  HOME: '/',
  RESTAURANTS: '/restaurants',
  RESTAURANT_DETAIL: (id: string) => `/restaurants/${id}`,
  FOOD_DETAIL: (id: string) => `/food/${id}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  PROFILE: '/profile',
  FAVORITES: '/favorites',
  ADDRESSES: '/addresses',
  LOGIN: '/login',
  REGISTER: '/register',
  SEARCH: '/search',
};

// Cuisines
export const CUISINES = [
  { id: '1', name: 'Indian', icon: '🍛', image: 'indian.jpg' },
  { id: '2', name: 'Chinese', icon: '🥡', image: 'chinese.jpg' },
  { id: '3', name: 'Italian', icon: '🍝', image: 'italian.jpg' },
  { id: '4', name: 'Mexican', icon: '🌮', image: 'mexican.jpg' },
  { id: '5', name: 'Japanese', icon: '🍣', image: 'japanese.jpg' },
  { id: '6', name: 'Thai', icon: '🍜', image: 'thai.jpg' },
  { id: '7', name: 'American', icon: '🍔', image: 'american.jpg' },
  { id: '8', name: 'Mediterranean', icon: '🥙', image: 'mediterranean.jpg' },
];

// Food Categories
export const FOOD_CATEGORIES = [
  { id: '1', name: 'Starters', icon: '🍢' },
  { id: '2', name: 'Main Course', icon: '🍛' },
  { id: '3', name: 'Desserts', icon: '🍰' },
  { id: '4', name: 'Beverages', icon: '🥤' },
  { id: '5', name: 'Salads', icon: '🥗' },
  { id: '6', name: 'Breads', icon: '🥖' },
  { id: '7', name: 'Rice & Noodles', icon: '🍚' },
  { id: '8', name: 'Combos', icon: '🍱' },
];

// Delivery times
export const DELIVERY_TIMES = [
  '10-15 mins',
  '15-20 mins',
  '20-25 mins',
  '25-30 mins',
  '30-40 mins',
  '40-50 mins',
];

// Sort options
export const SORT_OPTIONS = [
  { value: 'rating', label: 'Rating: High to Low' },
  { value: 'deliveryTime', label: 'Fastest Delivery' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

// Mock data for development
export const MOCK_RESTAURANTS = [
  {
    id: '1',
    name: 'Spice Garden',
    description: 'Authentic Indian cuisine with modern twist',
    cuisine: ['Indian', 'North Indian'],
    rating: 4.5,
    deliveryTime: '25-30 mins',
    deliveryFee: 29,
    minOrder: 199,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop',
    address: '123 Food Street, Downtown',
    location: { lat: 12.9716, lng: 77.5946 },
    isOpen: true,
    isFeatured: true,
    isVeg: false,
    tags: ['Popular', 'Best Seller', 'Trending'],
    contact: '+91 9876543210',
    openingHours: [
      { open: '10:00', close: '23:00' },
    ],
  },
  // Add more mock restaurants
];

export const MOCK_FOOD_ITEMS = [
  {
    id: '1',
    name: 'Butter Chicken',
    description: 'Tender chicken in rich tomato butter gravy',
    price: 320,
    originalPrice: 380,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w-400&h=300&fit=crop',
    category: 'Main Course',
    restaurantId: '1',
    restaurantName: 'Spice Garden',
    isVeg: false,
    isSpicy: true,
    isBestSeller: true,
    isAvailable: true,
    rating: 4.7,
    ingredients: ['Chicken', 'Tomato', 'Butter', 'Cream', 'Spices'],
    dietaryInfo: {
      calories: 450,
      protein: 25,
      carbs: 12,
      fat: 32,
    },
    addons: [
      { id: '1', name: 'Extra Butter', price: 30, isAvailable: true },
      { id: '2', name: 'Extra Cream', price: 25, isAvailable: true },
    ],
    variants: [
      { id: '1', name: 'Half', price: 180 },
      { id: '2', name: 'Full', price: 320 },
    ],
  },
  // Add more food items
];

export const STORAGE_KEYS={};