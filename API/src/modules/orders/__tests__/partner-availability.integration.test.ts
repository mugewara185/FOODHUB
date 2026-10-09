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
  return jwt.sign({ id, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

describe('Partner Availability & Hydration Integration', () => {
  let partnerToken: string;
  let partnerUser: any;
  let restaurant: any;
  let partner: any;
  let ownerUser: any;

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB3_TEST';
    await mongoose.connect(uri);

    await User.deleteMany({});
    await Order.deleteMany({});
    await DeliveryPartner.deleteMany({});
    await Restaurant.deleteMany({});
    await Delivery.deleteMany({});

    ownerUser = await User.create({ name: 'Owner', email: 'owner2@test.com', password: 'password', roles: ['owner'] });
    partnerUser = await User.create({ name: 'Partner', email: 'partner2@test.com', password: 'password', roles: ['partner'] });
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
    await mongoose.disconnect();
  });

  it('Case 1: /me returns awaiting_partner orders if partner is available', async () => {
    const order = await Order.create({
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
    expect(res.body.data.availableAssignments.length).toBe(1);
    expect(res.body.data.availableAssignments[0].orderId).toBe(order._id.toString());
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
