import mongoose from 'mongoose';
import { config } from './env';

export async function connectDB(): Promise<void> {
  const conn = await mongoose.connect(config.mongoUri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
}
