import mongoose, { Schema, model, Document, Types } from 'mongoose';
import { DeliveryStatus, assertValidTransition } from './delivery.state';

/*
 * MAPPING ORDER STATUS TO DELIVERY STATUS (S1 Contract)
 * Delivery status is the granular source of truth.
 * Order status is a derived, macro-level projection of Delivery status.
 *
 * Order.processing       <- Delivery: pending | assigned | accepted | arrived_pickup
 * Order.out_for_delivery <- Delivery: picked_up | out_for_delivery | nearby
 * Order.delivered        <- Delivery: delivered
 * Order.cancelled        <- Delivery: cancelled
 */

export { DeliveryStatus } from './delivery.state';

export interface IDelivery extends Document {
  orderId: Types.ObjectId;
  partnerId?: Types.ObjectId;
  pickupLocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  destinationLocation: {
    type: 'Point';
    coordinates: [number, number];
  };
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: DeliveryStatus;
  etaSeconds?: number;
  distanceRemainingMeters?: number;
  timestamps: {
    assignedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const pointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
}, { _id: false });

const deliverySchema = new Schema<IDelivery>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    partnerId: { type: Schema.Types.ObjectId, ref: 'DeliveryPartner', required: false, index: true },
    pickupLocation: { type: pointSchema, required: true },
    destinationLocation: { type: pointSchema, required: true },
    currentLocation: { type: pointSchema, required: false },
    status: {
      type: String,
      enum: [
        'pending',
        'assigned',
        'accepted',
        'arrived_pickup',
        'picked_up',
        'out_for_delivery',
        'nearby',
        'delivered',
        'cancelled'
      ],
      default: 'pending',
    },
    etaSeconds: { type: Number },
    distanceRemainingMeters: { type: Number },
    timestamps: {
      assignedAt: { type: Date },
      pickedUpAt: { type: Date },
      deliveredAt: { type: Date },
      cancelledAt: { type: Date },
    },
  },
  { timestamps: true }
);

deliverySchema.index({ currentLocation: '2dsphere' });
deliverySchema.index({ status: 1 });

// To check original value, we can use an init hook or retrieve from DB if needed,
// but mongoose does not natively preserve old values cleanly for all pre('save') scenarios.
// However, there is a known trick to get the previous value:
// this._original_status (we will set this in an init hook or simply query)
// Given this is defense in depth, we will try to fetch if not cached.

// Let's implement an init hook to store the original status
deliverySchema.post('init', function (doc) {
  (doc as any)._original_status = doc.status;
});

// Defense in depth: validate state machine on save
deliverySchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const from = (this as any)._original_status || 'pending';
    const to = this.status;
    try {
      assertValidTransition(from, to);
    } catch (err: any) {
      return next(err);
    }
  }
  next();
});

export const Delivery = mongoose.models.Delivery || model<IDelivery>('Delivery', deliverySchema);
