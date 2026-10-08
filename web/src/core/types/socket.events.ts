import type { DeliveryStatus } from './delivery';

export interface DeliveryBasePayload {
  deliveryId: string;
  orderId: string;
  partnerId: string;
}

export interface DeliveryAssignedPayload extends DeliveryBasePayload {
  status: DeliveryStatus; // 'partner_assigned'
  partnerName: string;
  partnerPhone: string;
}

export interface DeliveryStatusPayload extends DeliveryBasePayload {
  status: DeliveryStatus;
  timestamp: string | Date;
}

export interface DeliveryLocationPayload extends DeliveryBasePayload {
  location: { lat: number; lng: number };
}

export interface PartnerLocationUpdatedPayload extends DeliveryBasePayload {
  location: { lat: number; lng: number };
}

export interface OrderChatMessage {
  orderId: string;
  senderId: string;
  senderRole: 'user' | 'owner' | 'partner' | 'admin';
  targetRole?: 'user' | 'owner' | 'partner' | 'admin';
  senderName: string;
  message: string;
  timestamp?: string;
}
