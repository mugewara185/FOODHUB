import type { Order } from '../../../core/types';

const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    userId: 'u1',
    restaurantId: 'r1',
    restaurantName: 'Spice Garden',
    items: [
      { foodItemId: 'fi1', name: 'Butter Chicken', quantity: 1, price: 500 },
      { foodItemId: 'fi2', name: 'Garlic Naan', quantity: 2, price: 80 },
    ],
    subtotal: 660,
    deliveryFee: 50,
    tax: 33,
    discount: 0,
    total: 743,
    status: 'delivered',
    paymentStatus: 'completed',
    paymentMethod: 'upi',
    createdAt: '2024-01-15T10:30:00',
    updatedAt: '2024-01-15T11:15:00',
    deliveryInfo: { address: '123 Main St, Mumbai' }
  },
  {
    id: 'ORD-2024-002',
    userId: 'u2',
    restaurantId: 'r2',
    restaurantName: 'Pizza Paradise',
    items: [
      { foodItemId: 'fi3', name: 'Margherita Pizza', quantity: 1, price: 400 },
      { foodItemId: 'fi4', name: 'Garlic Bread', quantity: 1, price: 150 },
    ],
    subtotal: 550,
    deliveryFee: 40,
    tax: 27.5,
    discount: 0,
    total: 617.5,
    status: 'preparing',
    paymentStatus: 'completed',
    paymentMethod: 'card',
    createdAt: '2024-01-15T11:15:00',
    updatedAt: '2024-01-15T11:20:00',
    deliveryInfo: { address: '456 Park Ave, Mumbai' }
  }
];

export const adminOrdersProvider = {
  async getAll(): Promise<Order[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockOrders);
      }, 800);
    });
  }
};
