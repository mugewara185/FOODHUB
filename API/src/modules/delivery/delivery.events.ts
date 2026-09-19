import { DeliveryStatus } from './delivery.state';
import { getIO } from '../../socket';

export interface DeliveryBasePayload {
  deliveryId: string;
  orderId: string;
  partnerId: string;
  partnerUserId?: string; // NEW: Added to support direct partner room emits
}

export interface DeliveryAssignedPayload extends DeliveryBasePayload {
  status: DeliveryStatus | string; // 'assigned'
  partnerName: string;
  partnerPhone: string;
  partnerUserId: string; // explicitly required here
}

export interface DeliveryStatusPayload extends DeliveryBasePayload {
  status: DeliveryStatus | string;
  timestamp: string | Date;
  partnerUserId: string; // explicitly required here
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
  if (payload.partnerUserId) {
    io.to(payload.partnerUserId).emit('delivery:status', payload); // NEW
  }
}

export function emitDeliveryAssigned(payload: DeliveryAssignedPayload) {
  if (!payload.deliveryId || !payload.orderId || !payload.partnerId) {
    throw new Error('Ambiguous payload: Missing required IDs in delivery:assigned');
  }
  const io = getIO();
  io.to(payload.orderId).emit('delivery:assigned', payload);
  io.to('admin_fleet').emit('delivery:assigned', payload);
  if (payload.partnerUserId) {
    io.to(payload.partnerUserId).emit('delivery:assigned', payload); // NEW
  }
}

export function emitDeliveryLocation(payload: DeliveryLocationPayload) {
  const io = getIO();
  io.to(payload.orderId).emit('delivery:location', payload);
  io.to('admin_fleet').emit('delivery:location', payload);
  // Do NOT emit back to the partner — they are the source.
}
