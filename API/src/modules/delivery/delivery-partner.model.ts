import mongoose, { Schema, model, Document } from 'mongoose';

export type DeliveryPartnerStatus = 'available' | 'assigned' | 'on_delivery' | 'offline';

export interface IDeliveryPartner extends Document {
  userId?: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  status: DeliveryPartnerStatus;
  currentAssignedDelivery?: string;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

const deliveryPartnerSchema = new Schema<IDeliveryPartner>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // Optional during transition. Made required when account-management creates partners with a guaranteed User link (future vertical).
    name: { type: String, required: true },
    phone: { type: String, required: true },
    vehicle: { type: String, required: true },
    rating: { type: Number, default: 5.0 },
    status: { 
      type: String, 
      enum: ['available', 'assigned', 'on_delivery', 'offline'],
      default: 'offline' 
    },
    currentAssignedDelivery: { type: String },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: false
      },
      coordinates: {
        type: [Number],
        required: false
      }
    }
  },
  { timestamps: true }
);

deliveryPartnerSchema.index({ currentLocation: '2dsphere' });
deliveryPartnerSchema.index({ status: 1 });

export const DeliveryPartner = mongoose.models.DeliveryPartner || model<IDeliveryPartner>('DeliveryPartner', deliveryPartnerSchema);
