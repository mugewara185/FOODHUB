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
  location?: { lat: number; lng: number };
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
  deliveryId?: string;
  deliveryStatus?: string;
  partner?: { id: string; name: string; phone: string; vehicle?: string; rating?: number };
  currentLocation?: { lat: number; lng: number };
  pickupLocation?: { lat: number; lng: number };
  dropoffLocation?: { lat: number; lng: number };
  etaSeconds?: number;
  distanceRemainingMeters?: number;
  timestamps?: {
    assignedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
  };
}

// Normalization helpers
const extractRestaurantId = (rid?: string | PopulatedRestaurantDTO): string => {
  if (!rid) return '';
  return typeof rid === 'string' ? rid : (rid._id ? String(rid._id) : '');
};

const extractRestaurantLocation = (rid?: string | PopulatedRestaurantDTO): { lat: number; lng: number } | undefined =>
  typeof rid === 'object' && rid !== null && rid.location && typeof rid.location.lat === 'number' && typeof rid.location.lng === 'number'
    ? rid.location
    : undefined;

const normalizePaymentMethod = (
  method?: string,
): PaymentMethod => {
  if (!method) return 'cash_on_delivery';
  if (method === 'cash' || method === 'cod' || method === 'cash_on_delivery') {
    return 'cash_on_delivery';
  }
  if (method === 'card') return 'card';
  if (method === 'upi') return 'upi';
  if (method === 'wallet') return 'wallet';
  return 'cash_on_delivery';
};

export const normalizeOrder = (rawDto: any): Order => {
  const dto = rawDto?.order || rawDto?.data || rawDto || {};
  const orderId = String(dto.id || dto._id || dto.orderId || '');
  const restLoc = dto.pickupLocation || extractRestaurantLocation(dto.restaurantId);
  const items = Array.isArray(dto.items) ? dto.items : [];

  return {
    id: orderId,
    userId: String(dto.userId || ''),
    restaurantId: extractRestaurantId(dto.restaurantId || dto.restaurant),
    restaurantName: dto.restaurantName || dto.restaurant?.name || 'Restaurant',
    items: items.map((item: any) => ({
      foodItemId: String(item.menuItemId || item.foodItemId || item._id || ''),
      name: item.name || 'Item',
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
    })),
    subtotal: Number(dto.subtotal ?? dto.totalAmount ?? 0),
    deliveryFee: Number(dto.deliveryFee ?? 0),
    tax: Number(dto.tax ?? 0),
    discount: Number(dto.discount ?? 0),
    total: Number(dto.total ?? dto.totalAmount ?? 0),
    status: dto.status || 'pending_owner',
    paymentMethod: normalizePaymentMethod(dto.paymentMethod),
    paymentStatus: dto.paymentStatus || 'pending',
    deliveryInfo: {
      address: dto.deliveryInfo?.address || dto.deliveryAddress || '',
      coordinates: dto.deliveryInfo?.coordinates || dto.dropoffLocation,
    },
    createdAt: dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updatedAt ?? dto.createdAt ?? new Date().toISOString(),
    deliveryId: dto.deliveryId,
    deliveryStatus: dto.deliveryStatus,
    partner: dto.partner,
    currentLocation: dto.currentLocation,
    pickupLocation: restLoc,
    dropoffLocation: dto.dropoffLocation,
    etaSeconds: dto.etaSeconds,
    distanceRemainingMeters: dto.distanceRemainingMeters,
    timestamps: dto.timestamps,
  };
};

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
