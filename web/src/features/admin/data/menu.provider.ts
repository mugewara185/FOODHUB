import type { FoodItem } from '../../../core/types';

const mockMenuItems: FoodItem[] = [
  { id: '1', name: 'Global Burger', description: 'Test item', price: 10, category: 'Fast Food', image: '', isAvailable: true, restaurantId: 'r1', restaurantName: 'Rest 1', isVeg: false, isSpicy: false, isBestSeller: true, rating: 4.5, addons: [], variants: [] },
  { id: '2', name: 'Global Pizza', description: 'Test item', price: 15, category: 'Italian', image: '', isAvailable: true, restaurantId: 'r2', restaurantName: 'Rest 2', isVeg: true, isSpicy: false, isBestSeller: false, rating: 4.0, addons: [], variants: [] }
];

export const fetchAdminMenu = async (): Promise<FoodItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMenuItems);
    }, 800);
  });
};
