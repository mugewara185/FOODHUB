import { Schema, model, Document } from 'mongoose';

export type DeliveryPartnerStatus = 'available' | 'assigned' | 'on_delivery' | 'offline';

export interface IDeliveryPartner extends Document {
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  status: DeliveryPartnerStatus;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  currentAssignedDelivery?: Schema.Types.ObjectId;
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

const deliveryPartnerSchema = new Schema<IDeliveryPartner>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    vehicle: { type: String, required: true },
    rating: { type: Number, default: 5.0 },
    status: {
      type: String,
      enum: ['available', 'assigned', 'on_delivery', 'offline'],
      default: 'offline',
    },
    currentLocation: {
      type: pointSchema,
      required: false,
    },
    currentAssignedDelivery: { type: Schema.Types.ObjectId, ref: 'Delivery', required: false },
  },
  { timestamps: true }
);

deliveryPartnerSchema.index({ currentLocation: '2dsphere' });
deliveryPartnerSchema.index({ status: 1 });

export const DeliveryPartner = model<IDeliveryPartner>('DeliveryPartner', deliveryPartnerSchema);
