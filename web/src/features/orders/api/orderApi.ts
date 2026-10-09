/**
 * orderApi.ts
 *
 * API service for the order domain.
 * Uses Unified ApiClient.
 */

import type { Order, CartItem, PaymentMethod } from '../../../core/types';
import type { OrderChatMessage } from '../../../core/types/socket.events';
import api from '../../../core/utils/api';

// Raw Backend DTO shapes
interface OrderItemApiDTO {
  _id?: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface PopulatedRestaurantDTO {
  _id: string;
  name: string;
  imageUrl?: string;
  city?: string;
  address?: string;
  phone?: string;
}

interface OrderApiDTO {
  _id: string;
  userId: string;
  restaurantId: string | PopulatedRestaurantDTO;
  restaurantName: string;
  items: OrderItemApiDTO[];
  totalAmount: number;
  status: 'created' | 'pending_owner' | 'rejected' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'awaiting_partner' | 'partner_assigned' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'completed' | 'reviewed' | 'cancelled';
  deliveryAddress: string;
  paymentMethod: 'card' | 'upi' | 'wallet' | 'cash_on_delivery' | 'cash';
  note?: string;
  chatMessages?: OrderChatMessage[];
  createdAt: string;
  updatedAt?: string;
  deliveryStatus?: string;
  partner?: { id: string; name: string; phone: string; };
}

// Normalization helpers
const extractRestaurantId = (rid: string | PopulatedRestaurantDTO): string =>
  typeof rid === 'string' ? rid : rid._id;

const normalizePaymentMethod = (
  method: string,
): PaymentMethod => {
  if (method === 'cash' || method === 'cod' || method === 'cash_on_delivery') {
    return 'cash_on_delivery';
  }
  if (method === 'card') return 'card';
  if (method === 'upi') return 'upi';
  if (method === 'wallet') return 'wallet';
  return 'cash_on_delivery';
};

export const normalizeOrder = (dto: OrderApiDTO): Order => ({
  id: dto._id,
  userId: dto.userId,
  restaurantId: extractRestaurantId(dto.restaurantId),
  restaurantName: dto.restaurantName,
  items: dto.items.map((item) => ({
    foodItemId: item.menuItemId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  })),
  subtotal: dto.totalAmount,
  deliveryFee: 0,
  tax: 0,
  discount: 0,
  total: dto.totalAmount,
  status: dto.status,
  paymentMethod: normalizePaymentMethod(dto.paymentMethod),
  paymentStatus: 'pending',
  deliveryInfo: {
    address: dto.deliveryAddress,
  },
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt ?? dto.createdAt,
    deliveryStatus: dto.deliveryStatus,
    partner: dto.partner,
});

// Request mapping
export interface CreateOrderPayload {
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  deliveryAddress: string;
  paymentMethod: 'cash' | 'card' | 'upi';
  note?: string;
}

export const mapCartItemToOrderItem = (
  item: CartItem,
): CreateOrderPayload['items'][number] => ({
  menuItemId: item.foodItemId,
  name: item.name,
  price: item.price,
  quantity: item.quantity,
});

export const mapPaymentMethod = (
  uiMethod: string,
): 'cash' | 'card' | 'upi' => {
  if (uiMethod === 'cod' || uiMethod === 'wallet') return 'cash';
  if (uiMethod === 'card') return 'card';
  if (uiMethod === 'upi') return 'upi';
  return 'cash';
};

// Public API
export const orderApi = {
  async create(payload: CreateOrderPayload, _token?: string): Promise<Order> {
    const dto = await api.post<OrderApiDTO>('/orders', payload);
    return normalizeOrder(dto);
  },

  async getUserOrders(_token?: string): Promise<Order[]> {
    const dtos = await api.get<OrderApiDTO[]>('/orders');
    return dtos.map(normalizeOrder);
  },

  async getById(id: string, _token?: string): Promise<Order> {
    const dto = await api.get<OrderApiDTO>(`/orders/${id}`);
    return normalizeOrder(dto);
  },

  async cancel(id: string, _token?: string): Promise<Order> {
    const dto = await api.patch<OrderApiDTO>(`/orders/${id}/cancel`);
    return normalizeOrder(dto);
  },

  async submitReview(payload: { orderId: string, restaurantRating: number, partnerRating: number, comment?: string }, _token?: string): Promise<void> {
    await api.post<any>('/reviews', payload);
  }
};

export async function adminGetAllOrders(): Promise<Order[]> {
  const dtos = await api.get<OrderApiDTO[]>('/orders/all');
  return dtos.map(normalizeOrder);
}
