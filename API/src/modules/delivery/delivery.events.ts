import { DeliveryStatus } from './delivery.state';
import { getIO } from '../../socket';

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

export function emitDeliveryStatus(payload: DeliveryStatusPayload) {
  if (!payload.deliveryId || !payload.orderId || !payload.partnerId) {
    throw new Error('Ambiguous payload: Missing required IDs in delivery:status');
  }
  const io = getIO();
  io.to(payload.orderId).emit('delivery:status', payload);
  io.to('admin_fleet').emit('delivery:status', payload);
}

export function emitDeliveryAssigned(payload: DeliveryAssignedPayload) {
  if (!payload.deliveryId || !payload.orderId || !payload.partnerId) {
    throw new Error('Ambiguous payload: Missing required IDs in delivery:assigned');
  }
  const io = getIO();
  io.to(payload.orderId).emit('delivery:assigned', payload);
  io.to('admin_fleet').emit('delivery:assigned', payload);
}
