import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../app';
import { User } from '../../auth/auth.model';
import { Order } from '../../orders/order.model';
import { DeliveryPartner } from '../delivery-partner.model';
import { Restaurant } from '../../restaurants/restaurant.model';
import { Delivery } from '../delivery.model';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/env';
import { getIO, initSocket } from '../../../socket';

function generateToken(id: string, role: string): string {
  return jwt.sign({ id, role }, config.jwt.secret as jwt.Secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

describe('Deterministic Simulator & Handoff Integration', () => {
  let partnerToken: string;
  let ownerToken: string;
  let partnerUser: any;
  let ownerUser: any;
  let restaurant: any;
  let partner: any;
  let createdOrder: any;
  let deliveryId: string;

  beforeAll(async () => {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB2_TEST_DB';
    if (!uri.toLowerCase().includes('test')) {
      throw new Error('FAIL FAST: Non-test database detected. Aborting to prevent data destruction.');
    }
    
    // Note: Do not use deleteMany({}) here. We use isolated cleanup in afterAll.
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    // Initialize mock socket IO so emit calls don't crash
    const server = require('http').createServer(app);
    initSocket(server);
    vi.spyOn(getIO(), 'to').mockReturnValue({ emit: vi.fn() } as any);

    // Create owner
    ownerUser = new User({ _id: new mongoose.Types.ObjectId(), name: 'Sim Owner', email: 'simowner@test.com', password: 'hash_password', roles: ['owner'] });
    await ownerUser.save();
    ownerToken = generateToken(ownerUser.id, 'owner');

    // Create restaurant
    restaurant = new Restaurant({
      _id: new mongoose.Types.ObjectId(),
      ownerId: ownerUser.id,
      name: 'Sim Restaurant',
      address: '123 Test St',
      city: 'Test City',
      phone: '1234567890',
      location: { lat: 12.9716, lng: 77.5946 }, // Standard fallback
      isOpen: true,
      cuisine: ['Test']
    });
    await restaurant.save();

    // Create partner
    partnerUser = new User({ _id: new mongoose.Types.ObjectId(), name: 'Sim Partner', email: 'simpartner@test.com', password: 'hash_password', roles: ['partner'] });
    await partnerUser.save();
    
    partner = new DeliveryPartner({
      _id: new mongoose.Types.ObjectId(),
      userId: partnerUser.id,
      name: 'Sim Partner',
      phone: '9999999999',
      status: 'available', // Must be available to accept
      vehicle: 'Bike',
      currentLocation: { type: 'Point', coordinates: [77.5946 - 0.01, 12.9716 - 0.01] },
      completedDeliveries: 0
    });
    await partner.save();
    partnerToken = generateToken(partnerUser.id, 'partner');

    // Create an order waiting for partner
    createdOrder = new Order({
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(), // Fake customer
      restaurantId: restaurant._id,
      restaurantName: 'Sim Restaurant',
      totalAmount: 500,
      status: 'awaiting_partner',
      deliveryAddress: 'Test destination',
      items: [{ menuItemId: '1', name: 'Food', price: 500, quantity: 1 }]
    });
    await createdOrder.save();

    vi.useFakeTimers({ toFake: ['setInterval', 'Date'] });
  });

  afterAll(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    
    // Isolated deterministic cleanup
    if (createdOrder) await Order.findByIdAndDelete(createdOrder._id);
    if (partner) await DeliveryPartner.findByIdAndDelete(partner._id);
    if (restaurant) await Restaurant.findByIdAndDelete(restaurant._id);
    if (ownerUser) await User.findByIdAndDelete(ownerUser._id);
    if (partnerUser) await User.findByIdAndDelete(partnerUser._id);
    if (deliveryId) await Delivery.findByIdAndDelete(deliveryId);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('1. Partner accepts assignment, creating Delivery and starting simulation', async () => {
    const res = await request(app)
      .post(`/api/delivery/partner/${createdOrder._id}/accept`)
      .set('Authorization', `Bearer ${partnerToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const delivery = await Delivery.findOne({ orderId: createdOrder._id });
    expect(delivery).not.toBeNull();
    deliveryId = delivery!._id.toString();

    expect(delivery!.status).toBe('partner_assigned');
    const order = await Order.findById(createdOrder._id);
    expect(order!.status).toBe('partner_assigned');

    const updatedPartner = await DeliveryPartner.findById(partner._id);
    expect(updatedPartner!.status).toBe('assigned');
  });

  it('2. Simulator approaches restaurant and halts at arrived_pickup without auto-pickup', async () => {
    // Fast forward enough ticks to reach restaurant (Distance goes < 10m)
    for(let i=0; i<40; i++) {
      await vi.advanceTimersByTimeAsync(5000);
    }

    const delivery = await Delivery.findById(deliveryId);
    expect(delivery!.status).toBe('arrived_pickup');
    
    const order = await Order.findById(createdOrder._id);
    expect(order!.status).toBe('partner_assigned'); // Order should remain partner_assigned until owner handoff!
  });

  it('3. Owner handoff transitions both to picked_up and allows travel to destination', async () => {
    const res = await request(app)
      .patch(`/api/orders/${createdOrder._id}/picked_up`)
      .set('Authorization', `Bearer ${ownerToken}`);
    
    expect(res.status).toBe(200);

    const order = await Order.findById(createdOrder._id);
    expect(order!.status).toBe('picked_up');

    const delivery = await Delivery.findById(deliveryId);
    expect(delivery!.status).toBe('picked_up');
  });

  it('4. Simulator reaches destination, marks delivered, and releases partner safely', async () => {
    // Fast forward to destination
    for(let i=0; i<100; i++) {
      await vi.advanceTimersByTimeAsync(5000);
    }

    const delivery = await Delivery.findById(deliveryId);
    expect(delivery!.status).toBe('delivered');

    const order = await Order.findById(createdOrder._id);
    expect(order!.status).toBe('delivered');

    const updatedPartner = await DeliveryPartner.findById(partner._id);
    expect(updatedPartner!.status).toBe('available');
    expect(updatedPartner!.completedDeliveries).toBe(1);
    
    // Attempt double completion via API (There is no endpoint for owner to mark delivered, so just check 404)
    const res = await request(app)
      .patch(`/api/orders/${createdOrder._id}/delivered`)
      .set('Authorization', `Bearer ${ownerToken}`);
    
    expect(res.status).toBe(404); 
    
    const finalPartner = await DeliveryPartner.findById(partner._id);
    expect(finalPartner!.completedDeliveries).toBe(1); // Still 1
  });
});
