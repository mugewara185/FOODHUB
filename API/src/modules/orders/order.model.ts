import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus =
  | 'created'
  | 'pending_owner'
  | 'rejected'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'awaiting_partner'
  | 'partner_assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'reviewed'
  | 'cancelled';

export interface IOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  restaurantName: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  paymentMethod: 'cash' | 'card' | 'upi';
  note?: string;
  createdAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    restaurantName: { type: String, required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'created',
        'pending_owner',
        'rejected',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'awaiting_partner',
        'partner_assigned',
        'picked_up',
        'out_for_delivery',
        'delivered',
        'completed',
        'reviewed',
        'cancelled'
      ],
      default: 'created',
    },
    deliveryAddress: { type: String, required: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi'], default: 'cash' },
    note: { type: String },
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', orderSchema);
