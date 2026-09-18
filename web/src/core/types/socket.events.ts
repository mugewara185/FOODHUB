import type { DeliveryStatus } from './delivery';

export interface DeliveryBasePayload {
  deliveryId: string;
  orderId: string;
  partnerId: string;
}

export interface DeliveryAssignedPayload extends DeliveryBasePayload {
  status: DeliveryStatus; // 'assigned'
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
