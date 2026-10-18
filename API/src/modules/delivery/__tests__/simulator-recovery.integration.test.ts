import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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
import {
  startDeliverySimulation,
  stopDeliverySimulation,
  stopAllDeliverySimulations,
  isSimulationActive,
  getActiveSimulationsCount,
  recoverActiveDeliveries,
} from '../delivery.simulator';

function generateToken(id: string, role: string): string {
  return jwt.sign({ id, role }, config.jwt.secret as jwt.Secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

describe('Delivery Simulator Recovery and Idempotency Integration', () => {
  let partnerUser: any;
  let partnerUser2: any;
  let ownerUser: any;
  let restaurant: any;
  let partner: any;
  let partner2: any;
  let testOrder: any;
  let testDelivery: any;
  let partnerToken: string;
  let partner2Token: string;

  beforeAll(async () => {
    const rawUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB3_TEST';
    const uri = /test|e2e/i.test(rawUri) ? rawUri : 'mongodb://127.0.0.1:27017/FOODHUB3_TEST';

    if (mongoose.connection.readyState !== 0 && !/test|e2e/i.test(mongoose.connection.name)) {
      await mongoose.disconnect();
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    // Initialize mock socket IO so emissions don't crash
    const server = require('http').createServer(app);
    initSocket(server);
    const emitMock = vi.fn();
    const toMock = vi.fn().mockReturnValue({ emit: emitMock });
    vi.spyOn(getIO(), 'to').mockImplementation(toMock);

    // Create owner & restaurant
    ownerUser = await User.create({
      name: 'Recovery Owner',
      email: `rec-owner-${Date.now()}@test.dev`,
      password: 'password123',
      roles: ['owner'],
      isDemo: false,
    });

    restaurant = await Restaurant.create({
      name: 'Recovery Kitchen',
      ownerId: ownerUser._id,
      address: '100 Indiranagar, Bangalore',
      phone: '9888888801',
      location: { lat: 12.9716, lng: 77.5946 },
      city: 'Bangalore',
      isOpen: true,
      cuisine: ['Indian'],
      isDemo: false,
    });

    // Create partner 1
    partnerUser = await User.create({
      name: 'Recovery Courier 1',
      email: `rec-partner1-${Date.now()}@test.dev`,
      password: 'password123',
      roles: ['partner'],
      isDemo: false,
    });

    partner = await DeliveryPartner.create({
      userId: partnerUser._id,
      name: 'Recovery Courier 1',
      phone: '9888888811',
      status: 'assigned',
      vehicle: 'Bike',
      completedDeliveries: 0,
      isDemo: false,
      currentLocation: { type: 'Point', coordinates: [77.5850, 12.9650] },
    });
    partnerToken = generateToken(partnerUser._id.toString(), 'partner');

    // Create partner 2 (for authorization tests)
    partnerUser2 = await User.create({
      name: 'Recovery Courier 2',
      email: `rec-partner2-${Date.now()}@test.dev`,
      password: 'password123',
      roles: ['partner'],
      isDemo: false,
    });

    partner2 = await DeliveryPartner.create({
      userId: partnerUser2._id,
      name: 'Recovery Courier 2',
      phone: '9888888822',
      status: 'available',
      vehicle: 'Scooter',
      completedDeliveries: 0,
      isDemo: false,
      currentLocation: { type: 'Point', coordinates: [77.6000, 12.9800] },
    });
    partner2Token = generateToken(partnerUser2._id.toString(), 'partner');

    // Create order & delivery
    testOrder = await Order.create({
      userId: new mongoose.Types.ObjectId(),
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      totalAmount: 400,
      status: 'partner_assigned',
      deliveryAddress: '200 MG Road, Bangalore',
      items: [{ menuItemId: '1', name: 'Curry', price: 400, quantity: 1 }],
      isDemo: false,
    });

    testDelivery = await Delivery.create({
      orderId: testOrder._id,
      partnerId: partner._id,
      status: 'partner_assigned',
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6146, 12.9916] },
      currentLocation: { type: 'Point', coordinates: [77.5850, 12.9650] },
      distanceRemainingMeters: 1200,
      etaSeconds: 180,
      isDemo: false,
    });
  });

  afterAll(async () => {
    stopAllDeliverySimulations();
    vi.useRealTimers();

    if (testDelivery) await Delivery.findByIdAndDelete(testDelivery._id);
    if (testOrder) await Order.findByIdAndDelete(testOrder._id);
    if (partner) await DeliveryPartner.findByIdAndDelete(partner._id);
    if (partner2) await DeliveryPartner.findByIdAndDelete(partner2._id);
    if (partnerUser) await User.findByIdAndDelete(partnerUser._id);
    if (partnerUser2) await User.findByIdAndDelete(partnerUser2._id);
    if (restaurant) await Restaurant.findByIdAndDelete(restaurant._id);
    if (ownerUser) await User.findByIdAndDelete(ownerUser._id);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(() => {
    stopAllDeliverySimulations();
  });

  it('1. Initializes simulation for an eligible delivery and enforces single-timer idempotency', async () => {
    const res1 = await startDeliverySimulation(testDelivery._id.toString());
    expect(res1.running).toBe(true);
    expect(res1.started).toBe(true);
    expect(isSimulationActive(testDelivery._id.toString())).toBe(true);
    expect(getActiveSimulationsCount()).toBe(1);

    // Repeated call must reuse existing timer without creating duplicates
    const res2 = await startDeliverySimulation(testDelivery._id.toString());
    expect(res2.running).toBe(true);
    expect(res2.started).toBe(false); // Reused
    expect(getActiveSimulationsCount()).toBe(1);
  });

  it('2. Resumes simulation when the in-memory timer is absent (e.g. after server restart)', async () => {
    // Simulate process restart by stopping all in-memory timers while DB remains active
    stopAllDeliverySimulations();
    expect(isSimulationActive(testDelivery._id.toString())).toBe(false);
    expect(getActiveSimulationsCount()).toBe(0);

    // Resume delivery simulation
    const resumeRes = await startDeliverySimulation(testDelivery._id.toString());
    expect(resumeRes.running).toBe(true);
    expect(resumeRes.started).toBe(true);
    expect(isSimulationActive(testDelivery._id.toString())).toBe(true);
  });

  it('3. Refuses to start or resume terminal deliveries (delivered, cancelled)', async () => {
    const terminalDelivery = await Delivery.create({
      orderId: new mongoose.Types.ObjectId(),
      partnerId: partner._id,
      status: 'delivered',
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6146, 12.9916] },
      isDemo: false,
    });

    const res = await startDeliverySimulation(terminalDelivery._id.toString());
    expect(res.running).toBe(false);
    expect(res.started).toBe(false);
    expect(res.reason).toBe('terminal_status');
    expect(isSimulationActive(terminalDelivery._id.toString())).toBe(false);

    await Delivery.findByIdAndDelete(terminalDelivery._id);
  });

  it('4. Handles missing delivery or missing partner gracefully without throwing unhandled errors', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await startDeliverySimulation(nonExistentId);
    expect(res.running).toBe(false);
    expect(res.started).toBe(false);
    expect(res.reason).toBe('delivery_not_found');

    // Missing partner reference
    const orphanDelivery = await Delivery.create({
      orderId: new mongoose.Types.ObjectId(),
      partnerId: new mongoose.Types.ObjectId(), // Partner does not exist in DB
      status: 'partner_assigned',
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6146, 12.9916] },
      isDemo: false,
    });

    const orphanRes = await startDeliverySimulation(orphanDelivery._id.toString());
    expect(orphanRes.running).toBe(false);
    expect(orphanRes.started).toBe(false);
    expect(orphanRes.reason).toBe('partner_not_found');

    await Delivery.findByIdAndDelete(orphanDelivery._id);
  });

  it('5. Recovers intermediate en-route states (picked_up, out_for_delivery) without resetting status', async () => {
    const enRouteDelivery = await Delivery.create({
      orderId: testOrder._id,
      partnerId: partner._id,
      status: 'out_for_delivery',
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6146, 12.9916] },
      currentLocation: { type: 'Point', coordinates: [77.6050, 12.9800] }, // Mid-way
      distanceRemainingMeters: 400,
      etaSeconds: 60,
      isDemo: false,
    });

    const res = await startDeliverySimulation(enRouteDelivery._id.toString());
    expect(res.running).toBe(true);
    expect(res.started).toBe(true);

    // Verify status was NOT regressed to partner_assigned
    const doc = await Delivery.findById(enRouteDelivery._id);
    expect(doc?.status).toBe('out_for_delivery');

    stopDeliverySimulation(enRouteDelivery._id.toString());
    await Delivery.findByIdAndDelete(enRouteDelivery._id);
  });

  it('6. recoverActiveDeliveries scans DB and resumes all eligible non-terminal deliveries', async () => {
    stopAllDeliverySimulations();

    const d1 = await Delivery.create({
      orderId: testOrder._id,
      partnerId: partner._id,
      status: 'partner_assigned',
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6146, 12.9916] },
      isDemo: false,
    });

    const d2 = await Delivery.create({
      orderId: testOrder._id,
      partnerId: partner._id,
      status: 'picked_up',
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6146, 12.9916] },
      isDemo: false,
    });

    const { recovered } = await recoverActiveDeliveries();
    expect(recovered).toBeGreaterThanOrEqual(2);
    expect(isSimulationActive(d1._id.toString())).toBe(true);
    expect(isSimulationActive(d2._id.toString())).toBe(true);

    stopDeliverySimulation(d1._id.toString());
    stopDeliverySimulation(d2._id.toString());
    await Delivery.findByIdAndDelete(d1._id);
    await Delivery.findByIdAndDelete(d2._id);
  });

  it('7. GET /api/delivery/partner/me recovers stopped simulation for authenticated partner', async () => {
    // Assign delivery to partner 1 in DB
    await Delivery.findByIdAndUpdate(testDelivery._id, {
      status: 'partner_assigned',
      partnerId: partner._id,
    });
    await DeliveryPartner.findByIdAndUpdate(partner._id, {
      status: 'assigned',
      currentAssignedDelivery: testDelivery._id,
    });

    // Make sure timer is NOT running before fetch
    stopAllDeliverySimulations();
    expect(isSimulationActive(testDelivery._id.toString())).toBe(false);

    // Partner 1 fetches their state
    const res = await request(app)
      .get('/api/delivery/partner/me')
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeAssignment).toBeTruthy();
    expect(res.body.data.activeAssignment.deliveryId).toBe(testDelivery._id.toString());

    // Allow async recovery call to register
    await new Promise((r) => setTimeout(r, 50));
    expect(isSimulationActive(testDelivery._id.toString())).toBe(true);
  });

  it('8. Unauthorized partner cannot see or resume another partner active delivery', async () => {
    // Partner 2 fetches /me while delivery is assigned to partner 1
    const res = await request(app)
      .get('/api/delivery/partner/me')
      .set('Authorization', `Bearer ${partner2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Partner 2 must have null activeAssignment
    expect(res.body.data.activeAssignment).toBeNull();
  });

  it('9. Completes auto-handoff progression for demo delivery persisted at arrived_pickup when simulation resumes', async () => {
    const demoOrder = await Order.create({
      userId: new mongoose.Types.ObjectId(),
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      totalAmount: 300,
      status: 'partner_assigned',
      deliveryAddress: 'Demo Drop, Bangalore',
      items: [{ menuItemId: '1', name: 'Demo Meal', price: 300, quantity: 1 }],
      isDemo: true,
    });

    const demoDelivery = await Delivery.create({
      orderId: demoOrder._id,
      partnerId: partner._id,
      status: 'arrived_pickup',
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6146, 12.9916] },
      currentLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      distanceRemainingMeters: 0,
      etaSeconds: 0,
      isDemo: true,
    });

    const res = await startDeliverySimulation(demoDelivery._id.toString());
    expect(res.running).toBe(true);

    // Give 3.2s for the auto-handoff timer to fire
    await new Promise((r) => setTimeout(r, 3200));

    const updatedOrder = await Order.findById(demoOrder._id);
    const updatedDelivery = await Delivery.findById(demoDelivery._id);
    expect(updatedOrder?.status).toBe('picked_up');
    expect(updatedDelivery?.status).toBe('picked_up');

    stopDeliverySimulation(demoDelivery._id.toString());
    await Delivery.findByIdAndDelete(demoDelivery._id);
    await Order.findByIdAndDelete(demoOrder._id);
  });
});
