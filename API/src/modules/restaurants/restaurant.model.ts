import { Schema, model, Document } from 'mongoose';

export interface IMenuItem {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface IRestaurant extends Document {
  name: string;
  description: string;
  cuisine: string[];
  address: string;
  city: string;
  rating: number;
  totalRatings: number;
  priceRange: 1 | 2 | 3 | 4;
  imageUrl: string;
  coverImageUrl?: string;
  image?: string;
  bannerImage?: string;
  isOpen: boolean;
  deliveryTime: number;
  minOrder: number;
  deliveryFee?: number;
  isFeatured?: boolean;
  tags?: string[];
  location?: { lat: number; lng: number };
  contact?: { phone: string; email?: string };
  openingHours?: Array<{ day: string; open: string; close: string }>;
  menu: IMenuItem[];
  phone: string;
  createdAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String },
  isAvailable: { type: Boolean, default: true },
});

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    cuisine: [{ type: String }],
    address: { type: String, required: true },
    city: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    priceRange: { type: Number, enum: [1, 2, 3, 4], default: 2 },
    imageUrl: { type: String, default: '' },
    coverImageUrl: { type: String },
    image: { type: String },
    bannerImage: { type: String },
    isOpen: { type: Boolean, default: true },
    deliveryTime: { type: Number, default: 30 },
    minOrder: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }],
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    contact: {
      phone: { type: String },
      email: { type: String },
    },
    openingHours: [{ day: String, open: String, close: String }],
    menu: [menuItemSchema],
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

restaurantSchema.index({ name: 'text', cuisine: 'text', city: 'text' });

export const Restaurant = model<IRestaurant>('Restaurant', restaurantSchema);
