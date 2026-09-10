/**
 * orderApi.ts
 *
 * API service for the order domain.
 * Used when VITE_DATA_SOURCE=api.
 *
 * Follows the same fetch-based pattern as authApi.ts and restaurantApi.ts.
 * All Backend<->Frontend normalization is isolated here.
 */

import { APP_CONFIG } from '../../../core/config/app.config';
import type { Order, CartItem } from '../../../core/types';

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
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  paymentMethod: 'cash' | 'card' | 'upi';
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Normalization helpers
const extractRestaurantId = (rid: string | PopulatedRestaurantDTO): string =>
  typeof rid === 'string' ? rid : rid._id;

const normalizePaymentMethod = (
  method: 'cash' | 'card' | 'upi',
): 'cod' | 'card' | 'upi' | 'wallet' => {
  if (method === 'cash') return 'cod';
  return method;
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

// HTTP helper
const request = async <T>(
  endpoint: string,
  token: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${APP_CONFIG.API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...init,
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T> | { message?: string };

  if (!response.ok) {
    const msg =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      payload.message
        ? String(payload.message)
        : `Request failed (${response.status})`;
    throw new Error(msg);
  }

  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
};

// Public API
export const orderApi = {
  async create(payload: CreateOrderPayload, token: string): Promise<Order> {
    const dto = await request<OrderApiDTO>('/orders', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeOrder(dto);
  },

  async getUserOrders(token: string): Promise<Order[]> {
    const dtos = await request<OrderApiDTO[]>('/orders', token);
    return dtos.map(normalizeOrder);
  },

  async getById(id: string, token: string): Promise<Order> {
    const dto = await request<OrderApiDTO>(`/orders/${id}`, token);
    return normalizeOrder(dto);
  },

  async cancel(id: string, token: string): Promise<Order> {
    const dto = await request<OrderApiDTO>(`/orders/${id}/cancel`, token, {
      method: 'PATCH',
    });
    return normalizeOrder(dto);
  },
};
