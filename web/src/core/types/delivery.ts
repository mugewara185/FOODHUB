import { Coordinates } from './index';

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'arrived_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'nearby'
  | 'delivered'
  | 'cancelled';

export interface DeliveryAssignment {
  deliveryId: string; // The canonical ID for the delivery
  orderId: string;    // Links back to the order
  partnerId?: string; // Links to the partner
  
  restaurant: string;
  restaurantImage: string;
  customer: string;
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  pickupAddress: string;
  dropAddress: string;
  distance: string;
  estimatedTime: string;
  amount: number;
  priority: 'high' | 'medium' | 'low';
  status: DeliveryStatus;
  items: { name: string; quantity: number }[];
}
