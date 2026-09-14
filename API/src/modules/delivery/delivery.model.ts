import { Schema, model, Document, Types } from 'mongoose';

export type DeliveryStatus = 'preparing' | 'ready' | 'partner_assigned' | 'picked_up' | 'on_the_way' | 'nearby' | 'delivered' | 'cancelled';

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
});

const deliverySchema = new Schema<IDelivery>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    partnerId: { type: Schema.Types.ObjectId, ref: 'DeliveryPartner', required: false, index: true },
    pickupLocation: { type: pointSchema, required: true },
    destinationLocation: { type: pointSchema, required: true },
    currentLocation: { type: pointSchema, required: false },
    status: {
      type: String,
      enum: ['preparing', 'ready', 'partner_assigned', 'picked_up', 'on_the_way', 'nearby', 'delivered', 'cancelled'],
      default: 'preparing',
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

export const Delivery = model<IDelivery>('Delivery', deliverySchema);
