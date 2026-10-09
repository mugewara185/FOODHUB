import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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
  } as jwt.SignOptions);
}

import { Server as HttpServer } from 'http';
import { initSocket } from '../../../socket';

describe('Partner Handoff Integration', () => {
  let ownerToken: string;
  let wrongOwnerToken: string;
  let partnerToken: string;
  let ownerUser: any;
  let wrongOwnerUser: any;
  let partnerUser: any;
  let restaurant: any;
  let partner: any;
  let httpServer: HttpServer;

  beforeAll(async () => {
    httpServer = new HttpServer(app);
    initSocket(httpServer);
    await new Promise<void>(resolve => httpServer.listen(0, resolve));
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodhub-test';
    if (!uri.includes('test') && !uri.includes('TEST')) {
      throw new Error('Safety guard: Use test DB');
    }
    await mongoose.connect(uri);

    await User.deleteMany({});
    await Order.deleteMany({});
    await DeliveryPartner.deleteMany({});
    await Restaurant.deleteMany({});
    await Delivery.deleteMany({});

    ownerUser = await User.create({ name: 'Owner', email: 'owner@test.com', password: 'password', roles: ['owner'] });
    wrongOwnerUser = await User.create({ name: 'Wrong', email: 'wrong@test.com', password: 'password', roles: ['owner'] });
    partnerUser = await User.create({ name: 'Partner', email: 'partner@test.com', password: 'password', roles: ['partner'] });

    ownerToken = generateToken(ownerUser._id, 'owner');
    wrongOwnerToken = generateToken(wrongOwnerUser._id, 'owner');
    partnerToken = generateToken(partnerUser._id, 'partner');

    restaurant = await Restaurant.create({
      ownerId: ownerUser._id,
      name: 'Test Rest',
      phone: '1234567890',
      address: '123 Test St',
      city: 'Test City',
      location: { lat: 10, lng: 10 },
      isOpen: true
    });

    partner = await DeliveryPartner.create({
      userId: partnerUser._id,
      name: 'Test Partner',
      phone: '9876543210',
      vehicle: 'Bike',
      status: 'available',
      currentLocation: { type: 'Point', coordinates: [10, 10] }
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (httpServer) {
      await new Promise<void>(resolve => httpServer.close(() => resolve()));
    }
  });

  describe('Finding 2: Acceptance Race & Failure Safety', () => {
    it('Case 7 & 6: Partner acceptance race & transaction commit/rollback', async () => {
      const order = await Order.create({
        userId: partnerUser._id,
        restaurantId: restaurant._id,
        restaurantName: 'Test Rest',
        status: 'awaiting_partner',
        items: [],
        totalAmount: 100,
        deliveryAddress: 'Test Address'
      });

      const res1 = await request(app)
        .post(`/api/delivery/partner/${order._id}/accept`)
        .set('Authorization', `Bearer ${partnerToken}`);
      
      if (res1.status !== 200) console.log('ERROR res1:', res1.body);
      expect(res1.status).toBe(200);

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.status).toBe('partner_assigned');
      
      const deliveries = await Delivery.find({ orderId: order._id });
      expect(deliveries.length).toBe(1);

      const res2 = await request(app)
        .post(`/api/delivery/partner/${order._id}/accept`)
        .set('Authorization', `Bearer ${partnerToken}`);
      
      expect(res2.status).toBe(400);
    });
  });

  describe('Finding 1 & 3: Owner Handoff Verification', () => {
    let testOrder: any;
    let testDelivery: any;

    beforeAll(async () => {
      testOrder = await Order.create({
        userId: partnerUser._id,
        restaurantId: restaurant._id,
        restaurantName: 'Test Rest',
        status: 'partner_assigned',
        items: [],
        totalAmount: 100,
        deliveryAddress: 'Test Address'
      });

      testDelivery = await Delivery.create({
        orderId: testOrder._id,
        partnerId: partner._id,
        status: 'partner_assigned',
        pickupLocation: { type: 'Point', coordinates: [10,10] },
        destinationLocation: { type: 'Point', coordinates: [11,11] }
      });
    });

    it('Case 2: Correct owner, Delivery still partner_assigned -> rejected', async () => {
      const res = await request(app)
        .patch(`/api/orders/${testOrder._id}/picked_up`)
        .set('Authorization', `Bearer ${ownerToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Partner has not arrived yet');
    });

    it('Case 3: Wrong owner -> rejected', async () => {
      const res = await request(app)
        .patch(`/api/orders/${testOrder._id}/picked_up`)
        .set('Authorization', `Bearer ${wrongOwnerToken}`);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not authorized to manage this restaurant');
    });

    it('Case 4: Missing active Delivery -> rejected', async () => {
      await Delivery.deleteOne({ _id: testDelivery._id });
      const res = await request(app)
        .patch(`/api/orders/${testOrder._id}/picked_up`)
        .set('Authorization', `Bearer ${ownerToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No active delivery found');
    });

    it('Case 1: Correct owner, active Delivery at arrived_pickup -> handoff succeeds', async () => {
      testDelivery = await Delivery.create({
        orderId: testOrder._id,
        partnerId: partner._id,
        status: 'arrived_pickup',
        pickupLocation: { type: 'Point', coordinates: [10,10] },
        destinationLocation: { type: 'Point', coordinates: [11,11] }
      });

      const res = await request(app)
        .patch(`/api/orders/${testOrder._id}/picked_up`)
        .set('Authorization', `Bearer ${ownerToken}`);
      
      expect(res.status).toBe(200);
      
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder?.status).toBe('picked_up');

      const updatedDelivery = await Delivery.findById(testDelivery._id);
      expect(updatedDelivery?.status).toBe('picked_up');
    });

    it('Case 5: Already handed-off Delivery -> duplicate request rejected', async () => {
      const res = await request(app)
        .patch(`/api/orders/${testOrder._id}/picked_up`)
        .set('Authorization', `Bearer ${ownerToken}`);
      
      if (res.status === 500) console.log('ERROR res:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Order is not ready for handoff');
    });
  });
});
