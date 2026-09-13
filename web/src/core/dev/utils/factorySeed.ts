// ============================================================================
// FOODHUB COHERENT SEED FACTORY
// ============================================================================
// Generates a relational, AI-ready dataset for the FoodHub development database.
//
// Design principles:
//   1. All IDs are real MongoDB ObjectIds generated up-front.
//   2. References (userId → User, restaurantId → Restaurant) are resolved
//      from the same generated set — no dangling foreign keys.
//   3. Rating values strictly respect the schema constraint: 1 ≤ rating ≤ 5.
//   4. PaymentMethod values match backend Order schema: 'cash' | 'card' | 'upi'
//   5. User roles match backend User schema: 'user' | 'admin' | 'owner' | 'partner' | 'dev'
//   6. The dataset includes intentional performance scenarios for AI/MCP reasoning.
//
// Performance scenarios seeded:
//   - STRONG_PERFORMER: high ratings, high volume, low cancellations
//   - UNDERPERFORMER: low ratings, high volume, many complaints, high cancellations
//   - POPULAR_BUT_PROBLEMATIC: high volume, mediocre rating, delivery complaints
//   - AVERAGE: normal variation
//
// ============================================================================

import { generateObjectId } from '../../data/Corefactory/Factory';
import { logger } from '../logger';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type FactorySeedTarget = 'restaurants' | 'foodItems' | 'users' | 'orders' | 'reviews' | 'notifications';

export interface SeedCollectionPayload {
  modelName: string;
  documents: any[];
  clearFirst?: boolean;
}

export interface FactorySeedPayload {
  collections: SeedCollectionPayload[];
}

export interface SeedConfig {
  restaurantCount: number;
  userCount: number;
  foodItemCount: number;
  orderCount: number;
  reviewCount: number;
  notificationCount: number;
  targets: FactorySeedTarget[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — Validated against backend Mongoose schemas
// ─────────────────────────────────────────────────────────────────────────────

// Backend Order.paymentMethod enum: ['cash', 'card', 'upi']
const PAYMENT_METHODS = ['cash', 'card', 'upi'] as const;

// Backend Order.status enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']
const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as const;

// Backend User.roles enum: ['user', 'admin', 'owner', 'partner', 'dev']
// Note: frontend UserRole uses 'restaurant_owner'/'delivery_partner' but backend uses 'owner'/'partner'

// Address types: ['home', 'work', 'other']
const ADDRESS_TYPES = ['home', 'work', 'other'] as const;

// Review rating: min 1, max 5
const clampRating = (r: number) => Math.min(5, Math.max(1, Math.round(r * 10) / 10));

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

type RestaurantScenario = 'strong' | 'underperformer' | 'popular_problematic' | 'average' | 'declining' | 'improving';

interface RestaurantTemplate {
  name: string;
  cuisine: string[];
  scenario: RestaurantScenario;
  baseRating: number;
  deliveryTimeMin: number;
  city: string;
  priceRange: 1 | 2 | 3 | 4;
  tags: string[];
  isOpen: boolean;
  isFeatured: boolean;
}

const RESTAURANT_TEMPLATES: RestaurantTemplate[] = [
  {
    name: 'The Golden Spoon',
    cuisine: ['Indian', 'Mughlai'],
    scenario: 'strong',
    baseRating: 4.7,
    deliveryTimeMin: 25,
    city: 'Bangalore',
    priceRange: 2,
    tags: ['Top Rated', 'Best Seller'],
    isOpen: true,
    isFeatured: true,
  },
  {
    name: 'Spice Garden',
    cuisine: ['Indian', 'South Indian'],
    scenario: 'underperformer',
    baseRating: 2.8,
    deliveryTimeMin: 55,
    city: 'Bangalore',
    priceRange: 2,
    tags: ['Popular'],
    isOpen: true,
    isFeatured: false,
  },
  {
    name: 'Burger Hub Express',
    cuisine: ['American', 'Fast Food'],
    scenario: 'popular_problematic',
    baseRating: 3.4,
    deliveryTimeMin: 45,
    city: 'Bangalore',
    priceRange: 1,
    tags: ['Fast Delivery', 'Popular'],
    isOpen: true,
    isFeatured: true,
  },
  {
    name: 'Pasta Perfetto',
    cuisine: ['Italian'],
    scenario: 'improving',
    baseRating: 4.1,
    deliveryTimeMin: 35,
    city: 'Mumbai',
    priceRange: 3,
    tags: ['Best Seller', 'Trending'],
    isOpen: true,
    isFeatured: false,
  },
  {
    name: 'Sushi Dreams',
    cuisine: ['Japanese'],
    scenario: 'declining',
    baseRating: 4.3,
    deliveryTimeMin: 45,
    city: 'Bangalore',
    priceRange: 3,
    tags: ['Top Rated'],
    isOpen: true,
    isFeatured: true,
  },
  {
    name: 'Noodle House',
    cuisine: ['Chinese', 'Thai'],
    scenario: 'average',
    baseRating: 3.8,
    deliveryTimeMin: 30,
    city: 'Chennai',
    priceRange: 1,
    tags: ['Fast Delivery'],
    isOpen: true,
    isFeatured: false,
  },
  {
    name: 'Curry Kitchen',
    cuisine: ['Indian'],
    scenario: 'underperformer',
    baseRating: 2.5,
    deliveryTimeMin: 60,
    city: 'Hyderabad',
    priceRange: 2,
    tags: [],
    isOpen: true,
    isFeatured: false,
  },
  {
    name: 'Taco Fiesta',
    cuisine: ['Mexican'],
    scenario: 'average',
    baseRating: 3.9,
    deliveryTimeMin: 28,
    city: 'Bangalore',
    priceRange: 2,
    tags: ['Popular'],
    isOpen: false,
    isFeatured: false,
  },
];

// Menu templates by cuisine scenario
const MENU_TEMPLATES_BY_CUISINE: Record<string, Array<{ name: string; category: string; price: number }>> = {
  Indian: [
    { name: 'Butter Chicken', category: 'Main Course', price: 320 },
    { name: 'Paneer Tikka Masala', category: 'Main Course', price: 280 },
    { name: 'Dal Tadka', category: 'Main Course', price: 180 },
    { name: 'Biryani', category: 'Rice', price: 350 },
    { name: 'Garlic Naan', category: 'Breads', price: 60 },
    { name: 'Raita', category: 'Sides', price: 80 },
    { name: 'Gulab Jamun', category: 'Desserts', price: 120 },
  ],
  'South Indian': [
    { name: 'Masala Dosa', category: 'Breakfast', price: 120 },
    { name: 'Idli Sambar', category: 'Breakfast', price: 90 },
    { name: 'Uttapam', category: 'Breakfast', price: 110 },
  ],
  Mughlai: [
    { name: 'Chicken Seekh Kebab', category: 'Starters', price: 380 },
    { name: 'Mutton Rogan Josh', category: 'Main Course', price: 450 },
  ],
  American: [
    { name: 'Classic Cheeseburger', category: 'Burgers', price: 250 },
    { name: 'Crispy Chicken Burger', category: 'Burgers', price: 280 },
    { name: 'Loaded Fries', category: 'Sides', price: 150 },
    { name: 'Milkshake', category: 'Beverages', price: 180 },
    { name: 'Onion Rings', category: 'Sides', price: 120 },
  ],
  'Fast Food': [
    { name: 'Veggie Wrap', category: 'Wraps', price: 190 },
    { name: 'Spicy Chicken Wings', category: 'Starters', price: 320 },
  ],
  Italian: [
    { name: 'Spaghetti Carbonara', category: 'Pasta', price: 380 },
    { name: 'Penne Arrabbiata', category: 'Pasta', price: 320 },
    { name: 'Margherita Pizza', category: 'Pizza', price: 420 },
    { name: 'Quattro Formaggi Pizza', category: 'Pizza', price: 480 },
    { name: 'Tiramisu', category: 'Desserts', price: 220 },
    { name: 'Bruschetta', category: 'Starters', price: 180 },
  ],
  Japanese: [
    { name: 'Salmon Nigiri (6 pcs)', category: 'Sushi', price: 480 },
    { name: 'California Roll (8 pcs)', category: 'Sushi', price: 420 },
    { name: 'Miso Ramen', category: 'Ramen', price: 380 },
    { name: 'Tonkotsu Ramen', category: 'Ramen', price: 420 },
    { name: 'Edamame', category: 'Starters', price: 150 },
    { name: 'Gyoza (6 pcs)', category: 'Starters', price: 280 },
  ],
  Chinese: [
    { name: 'Kung Pao Chicken', category: 'Main Course', price: 320 },
    { name: 'Dim Sum Basket (6 pcs)', category: 'Starters', price: 250 },
    { name: 'Fried Rice', category: 'Rice', price: 220 },
  ],
  Thai: [
    { name: 'Pad Thai', category: 'Noodles', price: 280 },
    { name: 'Green Curry', category: 'Curry', price: 320 },
  ],
  Mexican: [
    { name: 'Chicken Tacos (3 pcs)', category: 'Tacos', price: 280 },
    { name: 'Veg Burrito', category: 'Burritos', price: 250 },
    { name: 'Nachos with Salsa', category: 'Starters', price: 190 },
    { name: 'Quesadilla', category: 'Quesadilla', price: 220 },
  ],
};

// User templates
interface UserTemplate {
  name: string;
  email: string;
  role: 'user' | 'admin' | 'owner' | 'partner' | 'dev';
  isFixed: boolean;
}

const FIXED_USER_TEMPLATES: UserTemplate[] = [
  { name: 'Admin User', email: 'admin@foodhub.dev', role: 'admin', isFixed: true },
  { name: 'Dev User', email: 'dev@foodhub.dev', role: 'dev', isFixed: true },
  { name: 'John Customer', email: 'john@foodhub.dev', role: 'user', isFixed: true },
  { name: 'Priya Singh', email: 'priya@foodhub.dev', role: 'user', isFixed: true },
  { name: 'Rahul Mehta', email: 'rahul@foodhub.dev', role: 'user', isFixed: true },
  { name: 'Spice Garden Owner', email: 'owner.spice@foodhub.dev', role: 'owner', isFixed: true },
];

// Realistic review comment templates by sentiment and theme
const POSITIVE_COMMENTS = [
  'Absolutely loved the food! Fresh ingredients and amazing flavors.',
  'Best restaurant in the area. Delivery was quick and food was piping hot.',
  'Excellent service and authentic taste. Will definitely order again.',
  'Portion sizes are great for the price. Very satisfied!',
  'The packaging was neat and food arrived in perfect condition.',
  'Outstanding food quality. The spices were perfectly balanced.',
  'Quick delivery and delicious food. Highly recommend this place!',
];

const NEUTRAL_COMMENTS = [
  'Food was decent. Nothing extraordinary but satisfying.',
  'Average experience. Delivery took longer than expected.',
  'The taste was okay but pricing felt a bit high for the portion size.',
  'Food quality is inconsistent. Sometimes great, sometimes average.',
  'Delivery was on time but the packaging could be better.',
];

const NEGATIVE_COMMENTS = [
  'Terrible experience. Food arrived cold and packaging was damaged.',
  'Order was wrong. Missing items and no response from support.',
  'Way too long for delivery. Food was cold and stale.',
  'Poor food quality. Not worth the price at all.',
  'Order accuracy was terrible. Got completely different items.',
  'Delivery took 90 minutes and food was ice cold on arrival.',
  'Portions have been shrinking while prices keep going up. Not ordering again.',
  'Found a hair in the food. Very disappointed.',
];

const DELIVERY_COMPLAINT_COMMENTS = [
  'Food is actually good but delivery always takes ages. Very frustrating.',
  'Taste is fine but they took over an hour to deliver. Unacceptable.',
  'Good food but delivery partner was rude and packaging was poor.',
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals = 1) => {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
};
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};
const randomDaysAgo = (minDays: number, maxDays: number) => daysAgo(randomInt(minDays, maxDays));

/** Deterministic rating for a restaurant scenario + noise */
const scenarioRating = (scenario: RestaurantScenario, base: number, daysAgo: number): number => {
  const noise = (Math.random() - 0.5) * 0.4;
  let r: number;

  switch (scenario) {
    case 'strong':
      r = base + noise * 0.3;
      break;
    case 'underperformer':
      r = base + noise;
      break;
    case 'popular_problematic':
      r = base + noise * 0.6;
      break;
    case 'improving':
      // Older orders = lower rating, newer orders = higher rating
      r = base + noise + ((45 - daysAgo) / 45) * 0.8;
      break;
    case 'declining':
      // Older orders = higher rating, newer orders = lower rating
      r = base + noise - ((45 - daysAgo) / 45) * 1.2;
      break;
    default:
      r = base + noise;
  }
  return clampRating(r);
};

const reviewComment = (scenario: RestaurantScenario, rating: number, daysAgo: number): string => {
  if (scenario === 'underperformer') {
    if (rating <= 2) return pick(NEGATIVE_COMMENTS);
    if (rating <= 3) return pick(NEUTRAL_COMMENTS);
    return pick(POSITIVE_COMMENTS);
  }
  if (scenario === 'popular_problematic') {
    if (rating <= 3) return pick(DELIVERY_COMPLAINT_COMMENTS);
    return pick(NEUTRAL_COMMENTS);
  }
  if (scenario === 'improving') {
    if (daysAgo < 30 && rating >= 4) return "Used to be mediocre, but recently the food and service have been fantastic! Keep it up.";
    if (daysAgo > 60 && rating <= 3) return "Average food, long wait times. Needs improvement.";
  }
  if (scenario === 'declining') {
    if (daysAgo < 30 && rating <= 3) return "This place used to be my favorite, but the last few orders have been terrible. Quality dropped off a cliff.";
    if (daysAgo > 60 && rating >= 4) return "Consistently amazing food and fast delivery. Best in town!";
  }
  if (scenario === 'strong') {
    if (rating >= 4) return pick(POSITIVE_COMMENTS);
    return pick(NEUTRAL_COMMENTS);
  }
  // average
  if (rating >= 4) return pick(POSITIVE_COMMENTS);
  if (rating <= 2) return pick(NEGATIVE_COMMENTS);
  return pick(NEUTRAL_COMMENTS);
};

const indianFirstNames = ['Arjun', 'Neha', 'Rohan', 'Sneha', 'Vikram', 'Pooja', 'Amit', 'Divya', 'Suresh', 'Kavitha', 'Nikhil', 'Ananya'];
const indianLastNames = ['Sharma', 'Patel', 'Reddy', 'Kumar', 'Joshi', 'Nair', 'Iyer', 'Gupta', 'Rao', 'Singh'];
const randomName = () => `${pick(indianFirstNames)} ${pick(indianLastNames)}`;
const randomEmail = (name: string) => `${name.toLowerCase().replace(/\s+/g, '.')}${randomInt(10, 99)}@example.com`;
const randomPhone = () => `+91 ${randomInt(7000000000, 9999999999)}`;

const indianCities = ['Bangalore', 'Mumbai', 'Chennai', 'Hyderabad', 'Delhi', 'Pune'];
const streetNames = ['MG Road', 'Residency Road', 'Brigade Road', 'Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout'];

const randomStreetAddress = (city: string) => `No. ${randomInt(1, 200)}, ${pick(streetNames)}, ${city}, India`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export const buildFactorySeedPayload = (
  _restaurantCount = 8,
  options: { targets?: string[]; config?: any } = {}
): FactorySeedPayload => {
  const targets = (options.targets?.length
    ? options.targets
    : ['restaurants', 'foodItems', 'users', 'orders', 'reviews']) as FactorySeedTarget[];

  const config = options.config ?? {};
  const userCount = config.users?.count ?? 10;
  const orderCount = config.orders?.count ?? 80;
  const reviewCount = config.reviews?.count ?? 60;

  const traceId = `seed-${Date.now().toString(36)}`;
  logger.info('FactorySeed', 'seed:start', {
    event: 'seed:start',
    traceId,
    data: { targets, userCount, orderCount, reviewCount },
  });

  const collections: SeedCollectionPayload[] = [];

  // ── Step 1: Generate User IDs ───────────────────────────────────────────
  const userIds: string[] = [];
  const userDocs: any[] = [];

  if (targets.includes('users') || targets.includes('orders') || targets.includes('reviews')) {
    logger.info('FactorySeed', 'seed:users:start', { event: 'seed:users:start', traceId });

    // Fixed seed users first
    for (const template of FIXED_USER_TEMPLATES) {
      const uid = generateObjectId();
      userIds.push(uid);
      const city = pick(indianCities);
      userDocs.push({
        _id: uid,
        name: template.name,
        email: template.email,
        password: 'Password123!',
        roles: [template.role],
        phone: randomPhone(),
        addresses: [
          {
            name: 'Home',
            phone: randomPhone(),
            street: randomStreetAddress(city),
            city,
            state: 'Karnataka',
            type: 'home',
            isDefault: true,
          },
        ],
        favoriteRestaurants: [],
      });
    }

    // Additional random customer users
    const extraCount = Math.max(0, userCount - FIXED_USER_TEMPLATES.length);
    for (let i = 0; i < extraCount; i++) {
      const uid = generateObjectId();
      const name = randomName();
      const city = pick(indianCities);
      userIds.push(uid);
      userDocs.push({
        _id: uid,
        name,
        email: randomEmail(name),
        password: 'Password123!',
        roles: ['user'],
        phone: randomPhone(),
        addresses: [
          {
            name: 'Home',
            phone: randomPhone(),
            street: randomStreetAddress(city),
            city,
            state: pick(['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Telangana']),
            type: 'home',
            isDefault: true,
          },
          ...(Math.random() > 0.5
            ? [
              {
                name: 'Office',
                phone: randomPhone(),
                street: randomStreetAddress(city),
                city,
                state: pick(['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Telangana']),
                type: 'work',
                isDefault: false,
              },
            ]
            : []),
        ],
        favoriteRestaurants: [],
      });
    }

    logger.info('FactorySeed', 'seed:users:complete', {
      event: 'seed:users:complete',
      traceId,
      data: { count: userDocs.length },
    });
  }

  // ── Step 2: Generate Restaurants + Menu ─────────────────────────────────
  const restaurantIds: string[] = [];
  const restaurantDocs: any[] = [];
  const restaurantScenarios: RestaurantScenario[] = [];

  if (targets.includes('restaurants') || targets.includes('foodItems') || targets.includes('orders') || targets.includes('reviews')) {
    logger.info('FactorySeed', 'seed:restaurants:start', { event: 'seed:restaurants:start', traceId });

    for (const template of RESTAURANT_TEMPLATES) {
      const rid = generateObjectId();
      restaurantIds.push(rid);
      restaurantScenarios.push(template.scenario);

      // Build menu from cuisine templates, respecting the target foodItems count
      const totalFoodItems = config.foodItems?.count ?? 50;
      const targetItemsPerRestaurant = Math.ceil(totalFoodItems / RESTAURANT_TEMPLATES.length);

      const menuItems: any[] = [];
      let allPossibleItems: any[] = [];
      for (const cuisineName of template.cuisine) {
        allPossibleItems = allPossibleItems.concat(MENU_TEMPLATES_BY_CUISINE[cuisineName] ?? []);
      }

      // Shuffle and pick target amount
      allPossibleItems = allPossibleItems.sort(() => 0.5 - Math.random());
      const selectedItems = allPossibleItems.slice(0, targetItemsPerRestaurant || 5);

      for (const item of selectedItems) {
        menuItems.push({
          _id: generateObjectId(),
          name: item.name,
          description: `Freshly prepared ${item.name.toLowerCase()} made with premium ingredients.`,
          price: item.price,
          category: item.category,
          imageUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400`,
          isAvailable: Math.random() > 0.1,
        });
      }

      const baseRating = template.baseRating;
      const city = template.city;

      restaurantDocs.push({
        _id: rid,
        name: template.name,
        description: `${template.name} — serving the finest ${template.cuisine.join(' & ')} cuisine in ${city}.`,
        cuisine: template.cuisine,
        address: randomStreetAddress(city),
        city,
        rating: clampRating(baseRating),
        totalRatings: template.scenario === 'underperformer' ? randomInt(80, 200) : randomInt(150, 500),
        priceRange: template.priceRange,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        coverImageUrl: 'https://images.unsplash.com/photo-1570521944256-e7a1ff3c4d46?w=1200',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        bannerImage: 'https://images.unsplash.com/photo-1570521944256-e7a1ff3c4d46?w=1200',
        isOpen: template.isOpen,
        deliveryTime: template.deliveryTimeMin,
        minOrder: template.priceRange === 1 ? 200 : template.priceRange === 2 ? 400 : 600,
        deliveryFee: template.priceRange === 1 ? 30 : template.priceRange === 2 ? 49 : 79,
        isFeatured: template.isFeatured,
        tags: template.tags,
        phone: randomPhone(),
        location: {
          lat: 12.9716 + (Math.random() - 0.5) * 0.2,
          lng: 77.5946 + (Math.random() - 0.5) * 0.2,
        },
        contact: {
          phone: randomPhone(),
          email: `contact@${template.name.toLowerCase().replace(/\s+/g, '')}.com`,
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
        menu: menuItems,
      });
    }

    logger.info('FactorySeed', 'seed:restaurants:complete', {
      event: 'seed:restaurants:complete',
      traceId,
      data: { count: restaurantDocs.length },
    });
  }

  // ── Step 3: Generate Orders ──────────────────────────────────────────────
  const orderDocs: any[] = [];

  if (targets.includes('orders') && userIds.length > 0 && restaurantIds.length > 0) {
    logger.info('FactorySeed', 'seed:orders:start', { event: 'seed:orders:start', traceId });

    // Distribute orders unevenly to create meaningful analytics signals
    // strong performers + popular_problematic get more orders
    const orderWeights = restaurantScenarios.map((s) => {
      if (s === 'strong') return 3;
      if (s === 'popular_problematic') return 4;
      if (s === 'underperformer') return 2;
      return 2;
    });
    const totalWeight = orderWeights.reduce((a, b) => a + b, 0);

    // Customer user indices (not admin/dev/owner = indices 0,1,5)
    const customerIndices = userIds.map((_, i) => i).filter((i) => i >= 2 && i !== 5);
    if (customerIndices.length === 0) customerIndices.push(0);

    for (let i = 0; i < orderCount; i++) {
      // Weighted restaurant selection
      let rand = Math.random() * totalWeight;
      let restIndex = 0;
      for (let w = 0; w < orderWeights.length; w++) {
        rand -= orderWeights[w];
        if (rand <= 0) {
          restIndex = w;
          break;
        }
      }

      const restaurantId = restaurantIds[restIndex];
      const restaurantDoc = restaurantDocs[restIndex];
      const scenario = restaurantScenarios[restIndex];

      const userId = userIds[pick(customerIndices)];

      // Pick menu items for this order (1–3 items)
      const menu: any[] = restaurantDoc?.menu ?? [];
      const itemCount = Math.min(randomInt(1, 3), menu.length || 1);
      const selectedItems = [...menu].sort(() => 0.5 - Math.random()).slice(0, itemCount);
      const items = selectedItems.map((menuItem: any) => ({
        menuItemId: menuItem._id ?? generateObjectId(),
        name: menuItem.name,
        price: menuItem.price,
        quantity: randomInt(1, 3),
      }));
      const totalAmount = items.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0);

      const daysAgoValue = randomInt(0, 90);
      const createdAt = daysAgo(daysAgoValue);

      // Status distribution by scenario + temporal adjustments
      let status: string;
      const r = Math.random();
      if (scenario === 'underperformer') {
        status = r < 0.30 ? 'cancelled' : r < 0.60 ? 'delivered' : r < 0.80 ? 'pending' : pick(['confirmed', 'preparing', 'out_for_delivery']);
      } else if (scenario === 'strong') {
        status = r < 0.05 ? 'cancelled' : r < 0.75 ? 'delivered' : pick(['pending', 'confirmed', 'preparing', 'out_for_delivery']);
      } else if (scenario === 'popular_problematic') {
        status = r < 0.15 ? 'cancelled' : r < 0.65 ? 'delivered' : r < 0.85 ? 'out_for_delivery' : pick(['pending', 'confirmed', 'preparing']);
      } else if (scenario === 'improving') {
        const cancelRate = daysAgoValue > 45 ? 0.25 : 0.05; // Was bad, now good
        status = r < cancelRate ? 'cancelled' : r < 0.70 ? 'delivered' : pick(['pending', 'confirmed', 'preparing', 'out_for_delivery']);
      } else if (scenario === 'declining') {
        const cancelRate = daysAgoValue < 30 ? 0.35 : 0.05; // Used to be good, now bad
        status = r < cancelRate ? 'cancelled' : r < 0.70 ? 'delivered' : pick(['pending', 'confirmed', 'preparing', 'out_for_delivery']);
      } else {
        status = r < 0.10 ? 'cancelled' : r < 0.70 ? 'delivered' : pick(['pending', 'confirmed', 'preparing', 'out_for_delivery']);
      }

      const userDoc = userDocs.find((u) => u._id === userId);
      const deliveryAddress = userDoc?.addresses?.[0]?.street ?? `No. ${randomInt(1, 100)}, MG Road, Bangalore`;

      orderDocs.push({
        _id: generateObjectId(),
        userId,
        restaurantId,
        restaurantName: restaurantDoc?.name ?? 'Unknown Restaurant',
        items,
        totalAmount: Math.max(totalAmount, 100),
        status,
        deliveryAddress,
        paymentMethod: pick(PAYMENT_METHODS),
        note: Math.random() > 0.8 ? 'Please keep cutlery' : undefined,
        createdAt,
        updatedAt: createdAt,
      });
    }

    logger.info('FactorySeed', 'seed:orders:complete', {
      event: 'seed:orders:complete',
      traceId,
      data: { count: orderDocs.length },
    });
  }

  // ── Step 4: Generate Reviews ─────────────────────────────────────────────
  const reviewDocs: any[] = [];

  if (targets.includes('reviews') && userIds.length > 0 && restaurantIds.length > 0) {
    logger.info('FactorySeed', 'seed:reviews:start', { event: 'seed:reviews:start', traceId });

    // Track (userId, restaurantId) pairs to avoid unique index violation
    const reviewPairs = new Set<string>();

    // Customer user indices only
    const customerIndices = userIds.map((_, i) => i).filter((i) => i >= 2 && i !== 5);
    if (customerIndices.length === 0) customerIndices.push(0);

    let attempts = 0;
    const maxAttempts = reviewCount * 5;

    while (reviewDocs.length < reviewCount && attempts < maxAttempts) {
      attempts++;

      const userIndex = pick(customerIndices);
      const userId = userIds[userIndex];
      const userName = userDocs[userIndex]?.name ?? 'Customer';

      // Weighted restaurant selection (same as orders)
      const orderWeights = restaurantScenarios.map((s) => {
        if (s === 'strong') return 2;
        if (s === 'popular_problematic') return 3;
        if (s === 'underperformer') return 3;
        return 2;
      });
      const totalWeight = orderWeights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      let restIndex = 0;
      for (let w = 0; w < orderWeights.length; w++) {
        rand -= orderWeights[w];
        if (rand <= 0) {
          restIndex = w;
          break;
        }
      }

      const restaurantId = restaurantIds[restIndex];
      const pairKey = `${userId}:${restaurantId}`;

      // Skip if this pair already reviewed (unique index on userId+restaurantId)
      if (reviewPairs.has(pairKey)) continue;
      reviewPairs.add(pairKey);

      const restaurantDoc = restaurantDocs[restIndex];
      const scenario = restaurantScenarios[restIndex];
      const baseRating = RESTAURANT_TEMPLATES[restIndex]?.baseRating ?? 3.5;

      const daysAgoValue = randomInt(0, 90);
      const rawRating = scenarioRating(scenario, baseRating, daysAgoValue);
      const rating = clampRating(rawRating);
      const comment = reviewComment(scenario, rating, daysAgoValue);

      reviewDocs.push({
        _id: generateObjectId(),
        userId,
        restaurantId,
        rating,
        comment,
        userName,
        createdAt: daysAgo(daysAgoValue),
      });
    }

    logger.info('FactorySeed', 'seed:reviews:complete', {
      event: 'seed:reviews:complete',
      traceId,
      data: { count: reviewDocs.length },
    });
  }

  // ── Step 5: Update favorite restaurants on users ─────────────────────────
  if (targets.includes('users') && restaurantIds.length > 0) {
    const customerUserDocs = userDocs.filter((u) => u.roles.includes('user'));
    for (const user of customerUserDocs) {
      // Each customer favorites 1–3 restaurants
      const favCount = randomInt(1, Math.min(3, restaurantIds.length));
      const shuffled = [...restaurantIds].sort(() => 0.5 - Math.random()).slice(0, favCount);
      user.favoriteRestaurants = shuffled;
    }
  }

  // ── Step 6: Generate Notifications ───────────────────────────────────────
  const notificationDocs: any[] = [];
  if (targets.includes('notifications')) {
    logger.info('FactorySeed', 'seed:notifications:start', {
      event: 'seed:notifications:start',
      traceId,
      data: { configCount: config.notifications?.count ?? 0 },
    });

    const targetNotifications = config.notifications?.count ?? 0;
    const customerUserDocs = userDocs.filter((u) => u.roles.includes('user'));

    for (let i = 0; i < targetNotifications; i++) {
      if (customerUserDocs.length === 0) break;
      const user = pick(customerUserDocs);
      const daysAgoValue = randomInt(0, 90);
      const isRead = Math.random() > 0.3; // 70% read

      let type = pick(['success', 'info', 'warning', 'error']);
      let title = '';
      let message = '';

      if (type === 'success') {
        title = pick(['Order Delivered', 'Payment Successful', 'Refund Processed']);
        message = 'Your recent order has been processed successfully.';
      } else if (type === 'warning') {
        title = pick(['Order Delayed', 'High Demand']);
        message = 'Due to high demand, your order may take longer than expected.';
      } else if (type === 'error') {
        title = pick(['Order Cancelled', 'Payment Failed']);
        message = 'There was an issue processing your request.';
      } else {
        title = pick(['New Offer', 'System Update', 'Restaurant Nearby']);
        message = 'Check out the latest offers and updates in your area.';
      }

      notificationDocs.push({
        _id: generateObjectId(),
        userId: user._id,
        title,
        message,
        type,
        isRead,
        createdAt: daysAgo(daysAgoValue),
        updatedAt: daysAgo(daysAgoValue),
      });
    }

    logger.info('FactorySeed', 'seed:notifications:complete', {
      event: 'seed:notifications:complete',
      traceId,
      data: { count: notificationDocs.length },
    });
  }

  // ── Step 7: Package into collections ────────────────────────────────────

  if (userDocs.length > 0 && (targets.includes('users') || targets.includes('orders') || targets.includes('reviews') || targets.includes('notifications'))) {
    collections.push({ modelName: 'User', documents: userDocs, clearFirst: true });
  }

  if (restaurantDocs.length > 0 && (targets.includes('restaurants') || targets.includes('foodItems'))) {
    collections.push({ modelName: 'Restaurant', documents: restaurantDocs, clearFirst: true });
  }

  if (orderDocs.length > 0 && targets.includes('orders')) {
    collections.push({ modelName: 'Order', documents: orderDocs, clearFirst: true });
  }

  if (reviewDocs.length > 0 && targets.includes('reviews')) {
    collections.push({ modelName: 'Review', documents: reviewDocs, clearFirst: true });
  }

  if (notificationDocs.length > 0 && targets.includes('notifications')) {
    collections.push({ modelName: 'Notification', documents: notificationDocs, clearFirst: true });
  }

  logger.info('FactorySeed', 'seed:payload:ready', {
    event: 'seed:complete',
    traceId,
    data: {
      users: userDocs.length,
      restaurants: restaurantDocs.length,
      orders: orderDocs.length,
      reviews: reviewDocs.length,
      notifications: notificationDocs.length,
      collections: collections.length,
    },
  });

  return { collections };
};
