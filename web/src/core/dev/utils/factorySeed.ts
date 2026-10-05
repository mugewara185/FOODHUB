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

export type FactorySeedTarget = 'restaurants' | 'foodItems' | 'users' | 'orders' | 'reviews' | 'notifications' | 'deliveries';

export interface SeedCollectionPayload {
  modelName: string;
  documents: any[];
  clearFirst?: boolean;
}

export interface FactorySeedPayload {
  collections: SeedCollectionPayload[];
}

export interface RoleDistribution {
  customer?: number;
  owner?: number;
  admin?: number;
  partner?: number;
}

export interface SeedConfig {
  users?: {
    total?: number;
    count?: number;
    roleDistribution?: RoleDistribution;
  };
  deliveryPartners?: { count: number };
  restaurants?: { count: number };
  foodItems?: { count: number };
  orders?: { count: number };
  deliveries?: { count: number };
  reviews?: { count: number };
  notifications?: { count: number };
  targets?: FactorySeedTarget[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — Validated against backend Mongoose schemas
// ─────────────────────────────────────────────────────────────────────────────

// Backend Order.paymentMethod enum: ['cash', 'card', 'upi']
const PAYMENT_METHODS = ['cash', 'card', 'upi'] as const;

// Backend Order.status enum: ['created', 'pending_owner', 'rejected', 'confirmed', 'preparing', 'ready_for_pickup', 'awaiting_partner', 'partner_assigned', 'picked_up', 'out_for_delivery', 'delivered', 'completed', 'reviewed', 'cancelled']
const ORDER_STATUSES = ['created', 'pending_owner', 'rejected', 'confirmed', 'preparing', 'ready_for_pickup', 'awaiting_partner', 'partner_assigned', 'picked_up', 'out_for_delivery', 'delivered', 'completed', 'reviewed', 'cancelled'] as const;

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
  _id: string;
    isFixed: boolean;
}

const FIXED_USER_TEMPLATES: UserTemplate[] = [
{ _id: '000000000000000000000001', name: 'Admin User', email: 'admin@foodhub.dev', role: 'admin', isFixed: true },
  { _id: '000000000000000000000002', name: 'Dev User', email: 'dev@foodhub.dev', role: 'dev', isFixed: true },
  { _id: '000000000000000000000003', name: 'John Customer', email: 'john@foodhub.dev', role: 'user', isFixed: true },
  { _id: '000000000000000000000004', name: 'Priya Singh', email: 'priya@foodhub.dev', role: 'user', isFixed: true },
  { _id: '000000000000000000000005', name: 'Rahul Mehta', email: 'rahul@foodhub.dev', role: 'user', isFixed: true },
  { _id: '000000000000000000000006', name: 'Spice Garden Owner', email: 'owner.spice@foodhub.dev', role: 'owner', isFixed: true },
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
const randomEmail = (name: string, index: number) => `${name.toLowerCase().replace(/\s+/g, '.')}.${index}@example.com`;
const randomPhone = () => `+91 ${randomInt(7000000000, 9999999999)}`;

const indianCities = ['Bangalore', 'Mumbai', 'Chennai', 'Hyderabad', 'Delhi', 'Pune'];
const streetNames = ['MG Road', 'Residency Road', 'Brigade Road', 'Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout'];

const randomStreetAddress = (city: string) => `No. ${randomInt(1, 200)}, ${pick(streetNames)}, ${city}, India`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export const buildFactorySeedPayload = (
  _restaurantCount = 8,
  options: { targets?: string[]; config?: any; mode?: 'append' | 'replace' } = {}
): FactorySeedPayload => {
  const mode = options.mode || 'replace';
  const clearFirst = mode === 'replace';
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
  const payloadWarnings: string[] = [];

  // === Step 1: Generate User IDs ===
    const userIds: string[] = [];
    const userDocs: any[] = [];
    
    const dpCount = config.deliveryPartners?.count ?? (targets.includes('users') ? 10 : 0);
    const restCount = config.restaurants?.count ?? RESTAURANT_TEMPLATES.length;
    let targetUserCount = config.users?.total ?? config.users?.count ?? 10;
    
    // We need at least enough users to satisfy DP + Owners + Fixed
    
      const roleDist = config.users?.roleDistribution || {};
      const adminCount = roleDist.admin || 0;
      const explicitOwnerCount = Math.max(restCount, roleDist.owner || 0);
      const explicitPartnerCount = Math.max(dpCount, roleDist.partner || 0);
      
      const requiredMin = explicitPartnerCount + explicitOwnerCount + adminCount + FIXED_USER_TEMPLATES.length;

    if (targetUserCount < requiredMin && targetUserCount > 0) {
      payloadWarnings.push(`Users: requested user count (${targetUserCount}) is smaller than needed for delivery partners and owners. Increasing to ${requiredMin}.`);
      targetUserCount = requiredMin;
    }

    if (targets.includes('users') || targets.includes('orders') || targets.includes('reviews')) {
      logger.info('FactorySeed', 'seed:users:start', { event: 'seed:users:start', traceId });
  
      // Fixed seed users first
      for (const template of FIXED_USER_TEMPLATES) {
          const uid = template._id;
        userIds.push(uid);
        const city = pick(indianCities);
        userDocs.push({
            _id: uid,
            __isFixed: true,
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
  
      // Additional random users
      const extraCount = Math.max(0, targetUserCount - FIXED_USER_TEMPLATES.length);
      for (let i = 0; i < extraCount; i++) {
        const uid = generateObjectId();
        const name = randomName();
        const city = pick(indianCities);
        userIds.push(uid);
        userDocs.push({
          _id: uid,
          name,
          email: randomEmail(name, i),
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

      // Role Assignment
      const assignableUsers = userDocs.filter(u => !u.roles.includes('admin') && !u.roles.includes('dev'));
      
      // 1. Delivery Partners
      
        const shuffled = [...assignableUsers].sort(() => 0.5 - Math.random());
        let currentIdx = 0;
        
        // Admins
        for(let i=0; i < adminCount && currentIdx < shuffled.length; i++, currentIdx++) {
           shuffled[currentIdx].roles.push('admin');
        }
        
        // Partners
        for(let i=0; i < explicitPartnerCount && currentIdx < shuffled.length; i++, currentIdx++) {
           shuffled[currentIdx].roles.push('partner');
        }
        
        // Owners
        for(let i=0; i < explicitOwnerCount && currentIdx < shuffled.length; i++, currentIdx++) {
           shuffled[currentIdx].roles.push('owner');
        }

    logger.info('FactorySeed', 'seed:users:complete', {
        event: 'seed:users:complete',
        traceId,
        data: { count: userDocs.length },
      });
    }
  
    // === Step 2: Generate Delivery Partners ===
    const partnerDocs: any[] = [];
    if (targets.includes('users') && dpCount > 0) {
      logger.info('FactorySeed', 'seed:partners:start', { event: 'seed:partners:start', traceId });
      const vehicles = ['Bike', 'Scooter', 'EV Bike', 'Electric Scooter'];
      
      const partnerUsers = userDocs.filter(u => u.roles.includes('partner')).slice(0, dpCount);
      
      for (const user of partnerUsers) {
        const pid = generateObjectId();
        partnerDocs.push({
          _id: pid,
          userId: user._id,
          name: user.name,
          phone: user.phone,
          vehicle: pick(vehicles),
          rating: randomFloat(4.0, 5.0, 1),
          status: 'available',
          currentLocation: {
            type: 'Point',
            coordinates: [77.5946 + (Math.random() - 0.5) * 0.1, 12.9716 + (Math.random() - 0.5) * 0.1]
          }
        });
      }
    }

    // === Step 2b: Generate Restaurants + Menu ===
    const restaurantIds: string[] = [];
    const restaurantDocs: any[] = [];
    const restaurantScenarios: RestaurantScenario[] = [];
  
    if (targets.includes('restaurants') || targets.includes('foodItems') || targets.includes('orders') || targets.includes('reviews')) {
      logger.info('FactorySeed', 'seed:restaurants:start', { event: 'seed:restaurants:start', traceId });
      
      const ownerUsers = userDocs.filter(u => u.roles.includes('owner'));
      let ownerIdx = 0;
  
      let targetRestCount = config.restaurants?.count ?? RESTAURANT_TEMPLATES.length;
      if (!targets.includes('restaurants')) {
        targetRestCount = Math.min(targetRestCount, RESTAURANT_TEMPLATES.length);
      }
  
      for (let restIdx = 0; restIdx < targetRestCount; restIdx++) {
        const template = RESTAURANT_TEMPLATES[restIdx % RESTAURANT_TEMPLATES.length];
        const nameSuffix = restIdx >= RESTAURANT_TEMPLATES.length ? ` #${Math.floor(restIdx / RESTAURANT_TEMPLATES.length) + 1}` : '';
        const finalName = `${template.name}${nameSuffix}`;

        const rid = generateObjectId();
        restaurantIds.push(rid);
        restaurantScenarios.push(template.scenario);
  
        const totalFoodItems = config.foodItems?.count ?? 50;
        const targetItemsPerRestaurant = Math.max(1, Math.ceil(totalFoodItems / targetRestCount));
  
        const menuTemplates = MENU_TEMPLATES_BY_CUISINE[template.cuisine[0]] ?? MENU_TEMPLATES_BY_CUISINE['American'];
        const items = [];
        for (let i = 0; i < targetItemsPerRestaurant; i++) {
          const itemTpl = menuTemplates[i % menuTemplates.length];
          items.push({
            _id: generateObjectId(),
            name: `${itemTpl.name} ${i + 1}`,
            description: `Delicious ${itemTpl.name} prepared with fresh ingredients.`,
            price: itemTpl.price,
            category: itemTpl.category,
            isVegetarian: Math.random() > 0.4,
            isAvailable: true,
          });
        }
  
        const city = template.city;
        const baseRating = template.baseRating;
  
        const IMAGE_POOL = [
          '1550547660-d9450f859349',
          '1576521925361-2c5a9dc42c92',
          '1555396273-367ea4eb4db5',
          '1466978913421-dad2ebd01d17',
          '1604908176997-4318b3e0cfe6',
        ];
        const BANNER_POOL = [
          '1570521944256-e7a1ff3c4d46',
          '1552566626-52f8b828add9',
          '1517248135467-4c7edcad34c4',
          '1498654896293-37aacf113fd9',
        ];
        const imgId = IMAGE_POOL[restaurantIds.length % IMAGE_POOL.length];
        const bannerId = BANNER_POOL[restaurantIds.length % BANNER_POOL.length];
  
        const ownerUser = ownerUsers[ownerIdx % ownerUsers.length];
        ownerIdx++;

        restaurantDocs.push({
          _id: rid,
          ownerId: ownerUser._id,
          name: finalName,
          description: `${finalName} - serving the finest ${template.cuisine.join(' & ')} cuisine in ${city}.`,
          cuisine: template.cuisine,
          address: randomStreetAddress(city),
          city,
          rating: clampRating(baseRating),
          totalRatings: template.scenario === 'underperformer' ? randomInt(80, 200) : randomInt(150, 500),
          priceRange: template.priceRange,
          imageUrl: `https://images.unsplash.com/photo-${imgId}?w=800`,
          bannerUrl: `https://images.unsplash.com/photo-${bannerId}?w=1200`,
          tags: template.tags,
          isOpen: template.isOpen,
          isFeatured: template.isFeatured,
          menu: items,
          deliveryTimeMin: template.deliveryTimeMin,
          phone: randomPhone(),
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
        status = r < 0.30 ? 'cancelled' : r < 0.60 ? 'delivered' : r < 0.80 ? 'pending_owner' : pick(['confirmed', 'preparing', 'out_for_delivery']);
      } else if (scenario === 'strong') {
        status = r < 0.05 ? 'cancelled' : r < 0.75 ? 'delivered' : pick(['pending_owner', 'confirmed', 'preparing', 'out_for_delivery']);
      } else if (scenario === 'popular_problematic') {
        status = r < 0.15 ? 'cancelled' : r < 0.65 ? 'delivered' : r < 0.85 ? 'out_for_delivery' : pick(['pending_owner', 'confirmed', 'preparing']);
      } else if (scenario === 'improving') {
        const cancelRate = daysAgoValue > 45 ? 0.25 : 0.05; // Was bad, now good
        status = r < cancelRate ? 'cancelled' : r < 0.70 ? 'delivered' : pick(['pending_owner', 'confirmed', 'preparing', 'out_for_delivery']);
      } else if (scenario === 'declining') {
        const cancelRate = daysAgoValue < 30 ? 0.35 : 0.05; // Used to be good, now bad
        status = r < cancelRate ? 'cancelled' : r < 0.70 ? 'delivered' : pick(['pending_owner', 'confirmed', 'preparing', 'out_for_delivery']);
      } else {
        status = r < 0.10 ? 'cancelled' : r < 0.70 ? 'delivered' : pick(['pending_owner', 'confirmed', 'preparing', 'out_for_delivery']);
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

  // ── Step 3.5: Generate Deliveries ───────────────────────────────────────
  const deliveryDocs: any[] = [];
  
  
  if (targets.includes('deliveries') && orderDocs.length > 0) {
    logger.info('FactorySeed', 'seed:deliveries:start', { event: 'seed:deliveries:start', traceId });

    const eligibleOrders = orderDocs.filter((o) => ['partner_assigned', 'picked_up', 'out_for_delivery', 'nearby', 'delivered', 'completed', 'reviewed'].includes(o.status));
    const availablePartners = targets.includes('users') && partnerDocs.length > 0 ? partnerDocs : [];
    
    if (availablePartners.length === 0) {
      payloadWarnings.push(`Deliveries: Skipped all deliveries because no DeliveryPartners were generated.`);
    } else {
      for (const order of eligibleOrders) {
        const partnerId = pick(availablePartners)._id;

        let deliveryStatus = 'delivered';
        if (['delivered', 'completed', 'reviewed'].includes(order.status)) deliveryStatus = 'delivered';
        else if (order.status === 'out_for_delivery') deliveryStatus = pick(['out_for_delivery', 'nearby']);
        else if (order.status === 'picked_up') deliveryStatus = 'picked_up';
        else if (order.status === 'partner_assigned') deliveryStatus = pick(['partner_assigned', 'arrived_pickup']);
        
        const pickupLat = 12.9716 + (Math.random() - 0.5) * 0.1;
        const pickupLng = 77.5946 + (Math.random() - 0.5) * 0.1;
        const dropoffLat = pickupLat + (Math.random() - 0.5) * 0.05;
        const dropoffLng = pickupLng + (Math.random() - 0.5) * 0.05;

        const timestamps: any = {};
        const baseDate = new Date(order.createdAt);
        if (['partner_assigned', 'arrived_pickup', 'picked_up', 'out_for_delivery', 'nearby', 'delivered'].includes(deliveryStatus)) {
           timestamps.assignedAt = new Date(baseDate.getTime() + 1000 * 60 * 2);
        }
        if (['picked_up', 'out_for_delivery', 'nearby', 'delivered'].includes(deliveryStatus)) {
           timestamps.pickedUpAt = new Date(baseDate.getTime() + 1000 * 60 * 15);
        }
        if (deliveryStatus === 'delivered') {
           timestamps.deliveredAt = new Date(baseDate.getTime() + 1000 * 60 * 45);
        }

        let distance = 0;
        let eta = 0;
        if (deliveryStatus !== 'delivered') {
            distance = Math.floor(Math.random() * 5000) + 500;
            eta = Math.floor(distance / 5);
            if (deliveryStatus === 'nearby') { distance = 200; eta = 60; }
            if (deliveryStatus === 'partner_assigned' || deliveryStatus === 'arrived_pickup') { distance += 2000; eta += 400; }
        }

        deliveryDocs.push({
          _id: generateObjectId(),
          orderId: order._id,
          partnerId,
          pickupLocation: { type: 'Point', coordinates: [pickupLng, pickupLat] },
          destinationLocation: { type: 'Point', coordinates: [dropoffLng, dropoffLat] },
          currentLocation: { type: 'Point', coordinates: deliveryStatus === 'delivered' ? [dropoffLng, dropoffLat] : [pickupLng + 0.01, pickupLat + 0.01] },
          status: deliveryStatus,
          distanceRemainingMeters: distance,
          etaSeconds: eta,
          timestamps,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        });
      }
    }

    logger.info('FactorySeed', 'seed:deliveries:complete', {
      event: 'seed:deliveries:complete',
      traceId,
      data: { count: deliveryDocs.length },
    });
  }

  // === Step 4: Generate Reviews ===
  const reviewDocs: any[] = [];

  if (targets.includes('reviews') && orderDocs.length > 0) {
    logger.info('FactorySeed', 'seed:reviews:start', { event: 'seed:reviews:start', traceId });

    const eligibleOrders = orderDocs.filter((o) => ['delivered', 'completed', 'reviewed'].includes(o.status));
    const shuffledOrders = [...eligibleOrders].sort(() => 0.5 - Math.random());
    const actualCount = Math.min(reviewCount, shuffledOrders.length);

    for (let i = 0; i < actualCount; i++) {
      const order = shuffledOrders[i];
      const delivery = deliveryDocs.find(d => d.orderId === order._id);
      
      if (!delivery || !delivery.partnerId) {
        payloadWarnings.push(`Reviews: Skipped review for Order ${order._id} because it has no associated Delivery/Partner.`);
        continue;
      }

      const rating = clampRating(Math.random() * 5);
      const daysAgoValue = randomInt(0, 90);

      reviewDocs.push({
        _id: generateObjectId(),
        orderId: order._id,
        userId: order.userId,
        restaurantId: order.restaurantId,
        partnerId: delivery.partnerId,
        restaurantRating: rating,
        partnerRating: clampRating(rating + (Math.random() - 0.5)),
        comment: reviewComment('positive', rating, daysAgoValue),
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
    collections.push({ modelName: 'User', documents: userDocs, clearFirst });
  }

  if (partnerDocs.length > 0 && targets.includes('users')) {
    collections.push({ modelName: 'DeliveryPartner', documents: partnerDocs, clearFirst });
  }

  if (restaurantDocs.length > 0 && (targets.includes('restaurants') || targets.includes('foodItems'))) {
    collections.push({ modelName: 'Restaurant', documents: restaurantDocs, clearFirst });
  }

  if (orderDocs.length > 0 && targets.includes('orders')) {
    collections.push({ modelName: 'Order', documents: orderDocs, clearFirst });
  }

  if (deliveryDocs.length > 0 && targets.includes('deliveries')) {
    collections.push({ modelName: 'Delivery', documents: deliveryDocs, clearFirst });
  }

  if (reviewDocs.length > 0 && targets.includes('reviews')) {
    collections.push({ modelName: 'Review', documents: reviewDocs, clearFirst });
  }

  if (notificationDocs.length > 0 && targets.includes('notifications')) {
    collections.push({ modelName: 'Notification', documents: notificationDocs, clearFirst });
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

  return { collections, warnings: payloadWarnings };
};
