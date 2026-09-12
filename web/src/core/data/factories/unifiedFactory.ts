// ============================================================================
// UNIFIED FACTORY GENERATOR
// ============================================================================
// Dynamic single method to generate all dummy data based on FactoryInput
// This replaces the need for multiple individual factory files

import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import type {
  FactoryInput,
  Restaurant,
  FoodItem,
  User,
  Order,
  Review,
  Addon,
  Variant,
  UserRole,
  OrderStatus,
  PaymentMethod,
} from '@/core/types';

// Seed data for consistent generation
const cuisinesList = [
  'Italian',
  'Mexican',
  'Indian',
  'Chinese',
  'Thai',
  'Japanese',
  'Korean',
  'Mediterranean',
  'American',
  'French',
];

const restaurantNames = [
  'Spice Garden',
  'Pizza Palace',
  'Burger Hub',
  'Noodle House',
  'Taco Fiesta',
  'Curry Kitchen',
  'Sushi Dreams',
  'Meat House',
  'Veggie Delight',
  'Pasta Perfetto',
];

const locations = [
  '123 Main Street, Downtown',
  '456 Park Avenue, Midtown',
  '789 Beach Boulevard, Coastal',
  '321 Mountain Road, Highland',
  '654 Forest Lane, Suburban',
];

const foodImages = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',//?w=800&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550547660-d9450f859349',//?w=800&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1604908176997-4318b3e0cfe6',//?w=800&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',//?w=800&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',//?w=800&h=450&fit=crop&q=80',
];

const restaurantImages = [
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',//?w=1200&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570521944256-e7a1ff3c4d46',//?w=1200&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1576521925361-2c5a9dc42c92',//?w=1200&h=400&fit=crop&q=80',
];

const tags = ['Popular', 'Fast Delivery', 'Best Seller', 'Top Rated'];
const deliveryTimes = ['20-30 min', '30-40 min', '40-50 min'];

// ─────────────────────────────────────────────────────────────────────────
// GENERATOR FUNCTIONS (Private helpers)
// ─────────────────────────────────────────────────────────────────────────

function generateAddons(): Addon[] {
  return [
    { id: uuidv4(), name: 'Extra Cheese', price: 50, isAvailable: true },
    { id: uuidv4(), name: 'Bacon', price: 60, isAvailable: true },
    { id: uuidv4(), name: 'Extra Sauce', price: 20, isAvailable: true },
  ];
}

function generateVariants(): Variant[] {
  return [
    { id: uuidv4(), name: 'Regular', price: 0 },
    { id: uuidv4(), name: 'Medium', price: 100 },
    { id: uuidv4(), name: 'Large', price: 200 },
  ];
}

function generateRestaurant(index: number, cuisines?: string[]): Restaurant {
  const selectedCuisines =
    cuisines && cuisines.length > 0
      ? [cuisines[index % cuisines.length]]
      : [cuisinesList[index % cuisinesList.length]];

  return {
    id: `r${index + 1}`,
    name: restaurantNames[index % restaurantNames.length],
    description: `Delicious ${selectedCuisines[0]} food with fresh ingredients and best service.`,
    cuisine: selectedCuisines,
    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
    deliveryTime: deliveryTimes[index % deliveryTimes.length],
    deliveryFee: Math.floor(Math.random() * 50) + 20,
    minOrder: Math.floor(Math.random() * 200) + 400,
    image: foodImages[index % foodImages.length],
    bannerImage: restaurantImages[index % restaurantImages.length],
    address: locations[index % locations.length],
    location: {
      lat: 28.6139 + Math.random() * 0.1,
      lng: 77.209 + Math.random() * 0.1,
    },
    isOpen: Math.random() > 0.2, //less chance of being closed
    isFeatured: Math.random() > 0.7, //more chance of being non-featured
    isVeg: Math.random() > 0.5, 
    tags: [tags[index % tags.length], selectedCuisines[0]],
    contact: {
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      email: `contact@${restaurantNames[index % restaurantNames.length].toLowerCase().replace(' ', '')}.com`,
    },
    openingHours: [
      { day: 'Monday', open: '09:00', close: '23:00' },
      { day: 'Tuesday', open: '09:00', close: '23:00' },
      { day: 'Wednesday', open: '09:00', close: '23:00' },
      { day: 'Thursday', open: '09:00', close: '23:00' },
      { day: 'Friday', open: '09:00', close: '00:00' },
      { day: 'Saturday', open: '08:00', close: '00:00' },
      { day: 'Sunday', open: '10:00', close: '23:00' },
    ],
  };
}

function generateFoodItem(index: number, restaurantIndex: number): FoodItem {
  const restaurant = generateRestaurant(restaurantIndex);
  const categories = ['Pizza', 'Burger', 'Indian', 'Chinese', 'Dessert'];
  const category = categories[index % categories.length];

  return {
    id: `f${index + 1}`,
    name: faker.commerce.productName(),
    description: faker.lorem.sentence(),
    price: Math.floor(Math.random() * 450) + 50,
    originalPrice: Math.random() > 0.7 ? Math.floor(Math.random() * 550) + 100 : undefined,
    image: foodImages[index % foodImages.length],
    category,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    isVeg: Math.random() > 0.4,
    isSpicy: Math.random() > 0.6,
    isBestSeller: Math.random() > 0.8,
    isAvailable: Math.random() > 0.1,
    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
    addons: Math.random() > 0.5 ? generateAddons() : undefined,
    variants: Math.random() > 0.5 ? generateVariants() : undefined,
    ingredients: faker.lorem.words(5).split(' '),
    dietaryInfo: {
      calories: Math.floor(Math.random() * 500) + 200,
      protein: Math.floor(Math.random() * 30) + 5,
      carbs: Math.floor(Math.random() * 50) + 10,
      fat: Math.floor(Math.random() * 20) + 5,
    },
  };
}

function generateUser(index: number, roles?: UserRole[], includeTestAccounts = true): User {
  const testAccounts: User[] = [
    {
      id: 'admin-1',
      name: 'System Admin',
      email: 'admin@zom2.local',
      phone: '+91 9999999999',
      avatar: 'https://i.pravatar.cc/150?u=admin',
      role: 'admin',
      address: 'Zom HQ, Chennai, India',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'dev-1',
      name: 'Developer',
      email: 'dev@zom2.local',
      phone: '+91 9999999998',
      avatar: 'https://i.pravatar.cc/150?u=dev',
      role: 'admin',
      address: 'Localhost',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'owner-1',
      name: 'Restaurant Owner',
      email: 'owner@zom2.local',
      phone: '+91 9999999997',
      avatar: 'https://i.pravatar.cc/150?u=owner',
      role: 'restaurant_owner',
      restaurantId: 'r1',
      address: 'Spice Garden Restaurant',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'partner-1',
      name: 'Delivery Partner',
      email: 'partner@zom2.local',
      phone: '+91 9999999996',
      avatar: 'https://i.pravatar.cc/150?u=partner',
      role: 'delivery_partner',
      address: 'Street 7, Mumbai',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-1',
      name: 'John Customer',
      email: 'user@zom2.local',
      phone: '+91 9999999995',
      avatar: 'https://i.pravatar.cc/150?u=customer',
      role: 'user',
      address: 'No. 23, Residency Road, Bangalore',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  if (includeTestAccounts && index < testAccounts.length) {
    return testAccounts[index];
  }

  const selectedRoles = roles && roles.length > 0 ? roles : ['user'];
  const role = selectedRoles[index % selectedRoles.length];

  return {
    id: `u${index + 1}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    avatar: faker.image.avatar(),
    role,
    address: faker.location.streetAddress(),
    restaurantId: role === 'restaurant_owner' ? `r${index + 1}` : undefined,
    isActive: true,
    emailVerified: Math.random() > 0.2,
    phoneVerified: Math.random() > 0.3,
    createdAt: faker.date.past().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function generateOrder(index: number): Order {
  const user = generateUser(index);
  const restaurant = generateRestaurant(index);
  const foodItems = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) =>
    generateFoodItem(i, index),
  );

  const subtotal = foodItems.reduce((sum, item) => sum + item.price, 0);
  const deliveryFee = restaurant.deliveryFee;
  const tax = subtotal * 0.05;
  const discount = Math.random() > 0.8 ? 50 : 0;

  const statuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  const paymentMethods: PaymentMethod[] = ['card', 'upi', 'wallet', 'cash_on_delivery'];

  return {
    id: `o${index + 1}`,
    userId: user.id,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    items: foodItems.map((item) => ({
      foodItemId: item.id,
      name: item.name,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: item.price,
      addons: item.addons?.slice(0, 1),
    })),
    subtotal,
    deliveryFee,
    tax,
    discount,
    total: subtotal + deliveryFee + tax - discount,
    couponCode: Math.random() > 0.8 ? 'SAVE10' : undefined,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
    paymentStatus: Math.random() > 0.1 ? 'completed' : 'pending',
    deliveryInfo: {
      address: user.address || 'Delivery Address',
      coordinates: {
        lat: 28.6139 + Math.random() * 0.1,
        lng: 77.209 + Math.random() * 0.1,
      },
      partnerAssigned: Math.random() > 0.3,
      estimatedTime: deliveryTimes[index % deliveryTimes.length],
    },
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
  };
}

function generateReview(index: number): Review {
  const user = generateUser(index);
  const restaurant = generateRestaurant(index);

  return {
    id: `rev${index + 1}`,
    userId: user.id,
    userName: user.name,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    orderId: Math.random() > 0.5 ? `o${Math.floor(Math.random() * 20) + 1}` : undefined,
    rating: parseFloat((Math.random() * 2 + 3.5).toFixed(1)),
    title: faker.lorem.sentence(),
    comment: faker.lorem.paragraph(),
    photos: Math.random() > 0.7 ? [foodImages[index % foodImages.length]] : undefined,
    helpful: Math.floor(Math.random() * 50),
    unhelpful: Math.floor(Math.random() * 10),
    createdAt: faker.date.past({ days: 60 }).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN FACTORY METHOD
// ─────────────────────────────────────────────────────────────────────────

export function generateAllDummyData(input: Partial<FactoryInput> = {}) {
  const {
    restaurants: restaurantConfig,
    foodItems: foodItemConfig,
    users: userConfig,
    orders: orderConfig,
    reviews: reviewConfig,
  } = input;

  // Default counts
  const restaurantCount = restaurantConfig?.count ?? 60;
  const foodItemCount = foodItemConfig?.count ?? 100;
  const userCount = userConfig?.count ?? 10;
  const orderCount = orderConfig?.count ?? 20;
  const reviewCount = reviewConfig?.count ?? 40;

  // Generate all data
  const restaurants: Restaurant[] = Array.from({ length: restaurantCount }, (_, i) =>
    generateRestaurant(i, restaurantConfig?.cuisines),
  );

  const foodItems: FoodItem[] = Array.from({ length: foodItemCount }, (_, i) =>
    generateFoodItem(i, i % restaurantCount),
  );

  const users: User[] = Array.from({ length: userCount }, (_, i) =>
    generateUser(i, userConfig?.roles, userConfig?.includeTestAccounts !== false),
  );

  const orders: Order[] = Array.from({ length: orderCount }, (_, i) => generateOrder(i));

  const reviews: Review[] = Array.from({ length: reviewCount }, (_, i) => generateReview(i));

  return {
    restaurants,
    foodItems,
    users,
    orders,
    reviews,
    metadata: {
      generatedAt: new Date().toISOString(),
      counts: {
        restaurants: restaurantCount,
        foodItems: foodItemCount,
        users: userCount,
        orders: orderCount,
        reviews: reviewCount,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// EXPORT INDIVIDUAL GENERATORS (For selective use)
// ─────────────────────────────────────────────────────────────────────────

export const factories = {
  restaurant: generateRestaurant,
  foodItem: generateFoodItem,
  user: generateUser,
  order: generateOrder,
  review: generateReview,
  addon: generateAddons,
  variants: generateVariants,
};

// ─────────────────────────────────────────────────────────────────────────
// USAGE EXAMPLES
// ─────────────────────────────────────────────────────────────────────────

/*
// Example 1: Generate with defaults
const data = generateAllDummyData();

// Example 2: Generate with custom counts
const customData = generateAllDummyData({
  restaurants: { count: 50, cuisines: ['Italian', 'Mexican'] },
  users: { count: 20, roles: ['user', 'delivery_partner'] },
  orders: { count: 100 },
  reviews: { count: 200 },
});

// Example 3: Use individual factories
const singleRestaurant = factories.restaurant(0);
const singleUser = factories.user(0, ['user']);
const singleOrder = factories.order(0);
*/
