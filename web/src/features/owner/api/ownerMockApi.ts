import type { Restaurant, FoodItem, Order, Review } from '../../../core/types/food';
import { generateAllDummyData } from '../../../data/factories/unifiedFactory';
import { logger } from '../../../core/dev/logger/Logger';

// Generate a dataset specifically for our mocked owner
const mockData = generateAllDummyData({
  restaurants: { count: 1 },
  foodItems: { count: 20 },
  users: { count: 5 },
  orders: { count: 15 },
  reviews: { count: 10 }
});

const myRestaurant = mockData.restaurants[0];

// Make sure all items belong to this restaurant
let myFoodItems = mockData.foodItems.map(item => ({ ...item, restaurantId: myRestaurant.id, restaurantName: myRestaurant.name }));
let myOrders = mockData.orders.map((order: any) => ({
  ...order,
  restaurantId: myRestaurant.id,
  restaurantName: myRestaurant.name,
  // We align with the actual FoodHub Order type defined in food.ts
  status: order.status as Order['status'],
  paymentMethod: order.paymentMethod as Order['paymentMethod'],
  paymentStatus: order.paymentStatus as Order['paymentStatus'],
}));
let myReviews = mockData.reviews.map((review: any) => ({ ...review, restaurantId: myRestaurant.id }));
let myRestaurantState = { ...myRestaurant };

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ownerMockApi = {
  // Restaurant Operations
  getRestaurant: async (): Promise<Restaurant> => {
    logger.info('MOCK API: getRestaurant');
    await delay(500);
    return { ...myRestaurantState };
  },

  updateRestaurantStatus: async (isOpen: boolean): Promise<Restaurant> => {
    logger.info(`MOCK API: updateRestaurantStatus to ${isOpen}`);
    await delay(400);
    myRestaurantState = { ...myRestaurantState, isOpen };
    return { ...myRestaurantState };
  },

  // Menu Operations
  getMenu: async (): Promise<FoodItem[]> => {
    logger.info('MOCK API: getMenu');
    await delay(500);
    return [...myFoodItems];
  },

  updateMenuItemAvailability: async (itemId: string, isAvailable: boolean): Promise<FoodItem> => {
    logger.info(`MOCK API: updateMenuItemAvailability itemId=${itemId} isAvailable=${isAvailable}`);
    await delay(300);
    const index = myFoodItems.findIndex(i => i.id === itemId);
    if (index === -1) throw new Error('Item not found');
    myFoodItems[index] = { ...myFoodItems[index], isAvailable };
    return { ...myFoodItems[index] };
  },

  updateMenuItem: async (item: FoodItem): Promise<FoodItem> => {
    logger.info(`MOCK API: updateMenuItem itemId=${item.id}`);
    await delay(400);
    const index = myFoodItems.findIndex(i => i.id === item.id);
    if (index === -1) throw new Error('Item not found');
    myFoodItems[index] = { ...item };
    return { ...myFoodItems[index] };
  },

  addMenuItem: async (item: Omit<FoodItem, 'id'>): Promise<FoodItem> => {
    logger.info(`MOCK API: addMenuItem name=${item.name}`);
    await delay(400);
    const newItem: FoodItem = { ...item, id: `f_${Date.now()}`, restaurantId: myRestaurantState.id, restaurantName: myRestaurantState.name } as FoodItem;
    myFoodItems.push(newItem);
    return newItem;
  },

  deleteMenuItem: async (itemId: string): Promise<string> => {
    logger.info(`MOCK API: deleteMenuItem itemId=${itemId}`);
    await delay(400);
    myFoodItems = myFoodItems.filter(i => i.id !== itemId);
    return itemId;
  },

  // Order Operations
  getOrders: async (): Promise<Order[]> => {
    logger.info('MOCK API: getOrders');
    await delay(500);
    // Sort by recent first
    return [...myOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<Order> => {
    logger.info(`MOCK API: updateOrderStatus orderId=${orderId} status=${status}`);
    await delay(400);
    const index = myOrders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');
    myOrders[index] = { ...myOrders[index], status };
    return { ...myOrders[index] };
  },

  // Review Operations
  getReviews: async (): Promise<Review[]> => {
    logger.info('MOCK API: getReviews');
    await delay(400);
    return [...myReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Analytics Operations (derived dynamically)
  getAnalytics: async () => {
    logger.info('MOCK API: getAnalytics');
    await delay(600);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayRevenue = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    let outOfStock = myFoodItems.filter(i => !i.isAvailable).length;

    myOrders.forEach((o: any) => {
      totalRevenue += o.total;

      const orderDate = new Date(o.createdAt);
      if (orderDate >= today) {
        todayRevenue += o.total;
      }

      if (['pending', 'confirmed', 'preparing'].includes(o.status)) {
        pendingOrders++;
      }

      if (o.status === 'delivered') {
        completedOrders++;
      }
    });

    const averageRating = myReviews.length
      ? (myReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / myReviews.length).toFixed(1)
      : 0;

    return {
      todayRevenue,
      totalRevenue,
      pendingOrders,
      completedOrders,
      outOfStock,
      averageRating: Number(averageRating),
      reviewCount: myReviews.length,
      activeItems: myFoodItems.filter(i => i.isAvailable).length
    };
  }
};
