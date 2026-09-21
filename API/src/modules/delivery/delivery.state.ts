// ARCHITECTURE: Order is the canonical lifecycle owner. Delivery is a
// projection. Micro states (arrived_pickup, nearby) are Delivery-only
// and do not appear in OrderStatus. The Delivery record is created only
// when a partner accepts a broadcast — there is no "waiting" delivery.

export type DeliveryStatus =
  | 'partner_assigned'
  | 'arrived_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'nearby'
  | 'delivered';

export const VALID_DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  partner_assigned: ['arrived_pickup'],
  arrived_pickup: ['picked_up'],
  picked_up: ['out_for_delivery'],
  out_for_delivery: ['nearby', 'delivered'],
  nearby: ['delivered'],
  delivered: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Illegal state transition from ${from} to ${to}`);
    this.name = 'InvalidStateTransitionError';
  }
}

export function assertValidTransition(from: DeliveryStatus, to: DeliveryStatus): void {
  // Allow self-transitions (e.g. updating location without changing state)
  if (from === to) {
    return;
  }
  
  const allowed = VALID_DELIVERY_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new InvalidStateTransitionError(from, to);
  }
}
