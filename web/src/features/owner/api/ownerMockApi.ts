import type { Restaurant, FoodItem, Order, Review } from '../../../core/types/food';
import { logger } from '../../../core/dev/logger/Logger';

let mockData: any = null;
let myFoodItems: any[] = [];
let myOrders: any[] = [];
let myReviews: any[] = [];
let myRestaurantState: any = null;

const initializeMocks = async () => {
  if (mockData) return;
  if (!import.meta.env.DEV) return;
  const { generateAllDummyData } = await import('../../../core/data/factories/unifiedFactory');
  mockData = generateAllDummyData({
    restaurants: { count: 1 },
    foodItems: { count: 20 },
    users: { count: 5 },
    orders: { count: 15 },
    reviews: { count: 10 }
  });
  
  const myRestaurant = mockData.restaurants[0];
  myRestaurantState = { ...myRestaurant };
  myFoodItems = mockData.foodItems.map((item: any) => ({ ...item, restaurantId: myRestaurant.id, restaurantName: myRestaurant.name }));
  myOrders = mockData.orders.map((order: any) => ({
    ...order,
    restaurantId: myRestaurant.id,
    restaurantName: myRestaurant.name,
    status: order.status as Order['status'],
    paymentMethod: order.paymentMethod as Order['paymentMethod'],
    paymentStatus: order.paymentStatus as Order['paymentStatus'],
  }));
  myReviews = mockData.reviews.map((review: any) => ({ ...review, restaurantId: myRestaurant.id }));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ownerMockApi = {
  getRestaurant: async (): Promise<Restaurant> => {
    await initializeMocks();
    logger.info('MOCK API: getRestaurant');
    await delay(500);
    return { ...myRestaurantState };
  },

  updateRestaurantStatus: async (isOpen: boolean): Promise<Restaurant> => {
    await initializeMocks();
    logger.info(`MOCK API: updateRestaurantStatus to ${isOpen}`);
    await delay(400);
    myRestaurantState = { ...myRestaurantState, isOpen };
    return { ...myRestaurantState };
  },

  getMenu: async (): Promise<FoodItem[]> => {
    await initializeMocks();
    logger.info('MOCK API: getMenu');
    await delay(500);
    return [...myFoodItems];
  },

  updateMenuItemAvailability: async (itemId: string, isAvailable: boolean): Promise<FoodItem> => {
    await initializeMocks();
    logger.info(`MOCK API: updateMenuItemAvailability itemId=${itemId} isAvailable=${isAvailable}`);
    await delay(300);
    const index = myFoodItems.findIndex(i => i.id === itemId);
    if (index === -1) throw new Error('Item not found');
    myFoodItems[index] = { ...myFoodItems[index], isAvailable };
    return { ...myFoodItems[index] };
  },

  updateMenuItem: async (item: FoodItem): Promise<FoodItem> => {
    await initializeMocks();
    logger.info(`MOCK API: updateMenuItem itemId=${item.id}`);
    await delay(400);
    const index = myFoodItems.findIndex(i => i.id === item.id);
    if (index === -1) throw new Error('Item not found');
    myFoodItems[index] = { ...item };
    return { ...myFoodItems[index] };
  },

  addMenuItem: async (item: Omit<FoodItem, 'id'>): Promise<FoodItem> => {
    await initializeMocks();
    logger.info(`MOCK API: addMenuItem name=${item.name}`);
    await delay(400);
    const newItem: FoodItem = { ...item, id: `f_${Date.now()}`, restaurantId: myRestaurantState.id, restaurantName: myRestaurantState.name } as FoodItem;
    myFoodItems.push(newItem);
    return newItem;
  },

  deleteMenuItem: async (itemId: string): Promise<string> => {
    await initializeMocks();
    logger.info(`MOCK API: deleteMenuItem itemId=${itemId}`);
    await delay(400);
    myFoodItems = myFoodItems.filter(i => i.id !== itemId);
    return itemId;
  },

  getOrders: async (): Promise<Order[]> => {
    await initializeMocks();
    logger.info('MOCK API: getOrders');
    await delay(500);
    return [...myOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<Order> => {
    await initializeMocks();
    logger.info(`MOCK API: updateOrderStatus orderId=${orderId} status=${status}`);
    await delay(400);
    const index = myOrders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');
    myOrders[index] = { ...myOrders[index], status };
    return { ...myOrders[index] };
  },

  getReviews: async (): Promise<Review[]> => {
    await initializeMocks();
    logger.info('MOCK API: getReviews');
    await delay(400);
    return [...myReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAnalytics: async () => {
    await initializeMocks();
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
      if (orderDate >= today) todayRevenue += o.total;
      if (['pending_owner', 'confirmed', 'preparing'].includes(o.status)) pendingOrders++;
      if (o.status === 'delivered') completedOrders++;
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
