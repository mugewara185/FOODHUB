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

export const VALID_DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['accepted', 'cancelled', 'pending'], // can go back to pending if rejected/timeout
  accepted: ['arrived_pickup', 'cancelled'],
  arrived_pickup: ['picked_up', 'cancelled'],
  picked_up: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['nearby', 'delivered', 'cancelled'], // can skip nearby directly to delivered
  nearby: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
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
