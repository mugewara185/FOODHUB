import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../app';
import { User } from '../../auth/auth.model';
import { Order } from '../order.model';
import { DeliveryPartner } from '../../delivery/delivery-partner.model';
import { Restaurant } from '../../restaurants/restaurant.model';
import { Delivery } from '../../delivery/delivery.model';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/env';

function generateToken(id: string, role: string): string {
  return jwt.sign({ id, role }, config.jwt.secret as jwt.Secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

describe('Partner Availability & Hydration Integration', () => {
  let partnerToken: string;
  let partnerUser: any;
  let restaurant: any;
  let partner: any;
  let ownerUser: any;
  let createdOrder: any;

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || config.mongoUri || 'mongodb://127.0.0.1:27017/FOODHUB3_TEST';
    if (!uri.toLowerCase().includes('test')) {
      throw new Error(`ABORT: Database URI does not appear to be a test database. Refusing to run tests on: ${uri}`);
    }
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri);
    }

    ownerUser = await User.create({ name: 'Owner', email: `owner2-${Date.now()}@test.com`, password: 'password', roles: ['owner'] });
    partnerUser = await User.create({ name: 'Partner', email: `partner2-${Date.now()}@test.com`, password: 'password', roles: ['partner'] });
    partnerToken = generateToken(partnerUser._id, 'partner');

    restaurant = await Restaurant.create({
      ownerId: ownerUser._id,
      name: 'Test Rest',
      phone: '1234567890',
      address: '123 Main St',
      city: 'Test City',
      location: { lat: 10, lng: 10 },
      isOpen: true
    });

    partner = await DeliveryPartner.create({
      userId: partnerUser._id,
      name: 'Partner',
      phone: '0987654321',
      vehicle: 'Bike',
      status: 'available',
      currentLocation: { type: 'Point', coordinates: [10, 10] }
    });
  });

  afterAll(async () => {
    if (ownerUser) await User.findByIdAndDelete(ownerUser._id);
    if (partnerUser) await User.findByIdAndDelete(partnerUser._id);
    if (restaurant) await Restaurant.findByIdAndDelete(restaurant._id);
    if (partner) await DeliveryPartner.findByIdAndDelete(partner._id);
    if (createdOrder) await Order.findByIdAndDelete(createdOrder._id);
    await mongoose.disconnect();
  });

  it('Case 1: /me returns awaiting_partner orders if partner is available', async () => {
    createdOrder = await Order.create({
      userId: partnerUser._id,
      restaurantId: restaurant._id,
      restaurantName: 'Test Rest',
      status: 'awaiting_partner',
      items: [],
      totalAmount: 100,
      deliveryAddress: 'Test Address'
    });

    const res = await request(app)
      .get('/api/delivery/partner/me')
      .set('Authorization', `Bearer ${partnerToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.availableAssignments).toBeDefined();
    expect(res.body.data.availableAssignments.length).toBeGreaterThanOrEqual(1);
    const hasOrder = res.body.data.availableAssignments.some((a: any) => a.orderId === createdOrder._id.toString());
    expect(hasOrder).toBe(true);
  });

  it('Case 2: /me does not return orders if partner is offline', async () => {
    partner.status = 'offline';
    await partner.save();

    const res = await request(app)
      .get('/api/delivery/partner/me')
      .set('Authorization', `Bearer ${partnerToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.availableAssignments).toBeDefined();
    expect(res.body.data.availableAssignments.length).toBe(0);
    
    partner.status = 'available';
    await partner.save();
  });
});
