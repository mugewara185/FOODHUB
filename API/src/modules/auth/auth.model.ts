import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  id?: string;
  name: string;
  phone: string;
  street: string;
  city?: string;
  state?: string;
  zipCode?: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'owner' | 'partner';
  phone?: string;
  addresses: IAddress[];
  favoriteRestaurants: Schema.Types.ObjectId[];
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const addressSchema = new Schema<IAddress>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin', 'owner', 'partner'], default: 'user' },
    phone: { type: String },
    addresses: [addressSchema],
    favoriteRestaurants: [{ type: Schema.Types.ObjectId, ref: 'Restaurant' }]
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>('User', userSchema);
