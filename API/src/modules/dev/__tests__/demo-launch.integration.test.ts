import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { createServer } from 'http';
import request from 'supertest';
import app from '../../../app';
import { initSocket } from '../../../socket';
import { User } from '../../auth/auth.model';
import { Order } from '../../orders/order.model';
import { Restaurant } from '../../restaurants/restaurant.model';
import { DeliveryPartner } from '../../delivery/delivery-partner.model';
import { Delivery } from '../../delivery/delivery.model';
import { stopDeliverySimulation, stopAllDeliverySimulations, isSimulationActive } from '../../delivery/delivery.simulator';
import { config } from '../../../config/env';
import { resetDemoRateLimitsForTest } from '../dev.controller';

describe('One-Click Live-Order Demo Integration Tests', () => {
  let server: any;
  let regularUser: any;
  let regularOwner: any;
  let regularRestaurant: any;
  let regularPartner: any;
  let regularPartnerUser: any;
  let regularOrder: any;

  beforeAll(async () => {
    vi.useRealTimers();
    const rawUri = process.env.TEST_MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB3_TEST';
    const uri = /test|e2e/i.test(rawUri) ? rawUri : 'mongodb://127.0.0.1:27017/FOODHUB3_TEST';

    if (mongoose.connection.readyState !== 0 && !/test|e2e/i.test(mongoose.connection.name)) {
      await mongoose.disconnect();
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    server = createServer(app);
    initSocket(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });

    await Order.deleteMany({ isDemo: true });
    await Delivery.deleteMany({ isDemo: true });

    // 1. Create ordinary non-demo Customer User
    regularUser = await User.create({
      name: 'Ordinary Non-Demo Customer',
      email: `regular-cust-${Date.now()}@test.dev`,
      password: 'password123',
      roles: ['user'],
      phone: '9111111111',
      address: '777 Regular St, Bangalore',
      isDemo: false,
    });

    // 2. Create ordinary non-demo Owner User
    regularOwner = await User.create({
      name: 'Ordinary Non-Demo Owner',
      email: `regular-owner-${Date.now()}@test.dev`,
      password: 'password123',
      roles: ['owner'],
      phone: '9222222222',
      address: '555 Restaurant Ave, Bangalore',
      isDemo: false,
    });

    // 3. Create ordinary non-demo Restaurant
    regularRestaurant = await Restaurant.create({
      name: 'Ordinary Regular Restaurant',
      ownerId: regularOwner._id,
      description: 'Not a demo restaurant',
      cuisine: ['South Indian'],
      address: '555 Regular Ave, Bangalore',
      city: 'Bangalore',
      rating: 4.5,
      totalRatings: 10,
      priceRange: 1,
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      isOpen: true,
      deliveryTime: 25,
      minOrder: 100,
      phone: '+91 99999 11111',
      location: { lat: 12.9500, lng: 77.6000 },
      isDemo: false,
      menu: [{ name: 'Masala Dosa', price: 90, category: 'Breakfast', isAvailable: true }],
    });

    // 4. Create ordinary non-demo Delivery Partner User & Partner
    regularPartnerUser = await User.create({
      name: 'Ordinary Regular Courier',
      email: `regular-courier-${Date.now()}@test.dev`,
      password: 'password123',
      roles: ['partner'],
      phone: '9333333333',
      address: 'Courier Hub, Bangalore',
      isDemo: false,
    });

    regularPartner = await DeliveryPartner.create({
      userId: regularPartnerUser._id,
      name: 'Ordinary Regular Courier',
      phone: '9333333333',
      vehicle: 'KA-05-REGULAR-12',
      rating: 4.8,
      status: 'on_delivery',
      currentAssignedDelivery: 'ord-regular-prev',
      currentLocation: {
        type: 'Point',
        coordinates: [77.6543, 12.9321],
      },
      isDemo: false,
    });

    // 5. Create ordinary non-demo Order
    regularOrder = await Order.create({
      userId: regularUser._id,
      restaurantId: regularRestaurant._id,
      restaurantName: regularRestaurant.name,
      items: [{ menuItemId: 'item-reg-1', name: 'Masala Dosa', price: 90, quantity: 1 }],
      totalAmount: 90,
      deliveryAddress: '777 Regular St, Bangalore',
      status: 'confirmed',
      paymentMethod: 'card',
      paymentStatus: 'completed',
      isDemo: false,
    });
  });

  beforeEach(() => {
    resetDemoRateLimitsForTest();
  });

  afterAll(async () => {
    // Clean up demo deliveries and simulators
    const demoDeliveries = await Delivery.find({ isDemo: true });
    for (const d of demoDeliveries) {
      stopDeliverySimulation(d._id.toString());
    }
    await Order.deleteMany({ isDemo: true });
    await Delivery.deleteMany({ isDemo: true });
    await DeliveryPartner.deleteMany({ isDemo: true });
    await Restaurant.deleteMany({ isDemo: true });
    await User.deleteMany({ isDemo: true });

    // Clean up test records
    if (regularOrder) await Order.findByIdAndDelete(regularOrder._id);
    if (regularRestaurant) await Restaurant.findByIdAndDelete(regularRestaurant._id);
    if (regularPartner) await DeliveryPartner.findByIdAndDelete(regularPartner._id);
    if (regularPartnerUser) await User.findByIdAndDelete(regularPartnerUser._id);
    if (regularOwner) await User.findByIdAndDelete(regularOwner._id);
    if (regularUser) await User.findByIdAndDelete(regularUser._id);

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('P0 Safety Guard: internal development endpoints fail closed with 403 in production environment', async () => {
    const originalEnv = config.nodeEnv;
    try {
      (config as any).nodeEnv = 'production';

      // 1. Internal DB diagnostic utility MUST be 403 in production
      const resDbInfo = await request(app).get('/api/dev/db-info');
      expect(resDbInfo.status).toBe(403);
      expect(resDbInfo.body.success).toBe(false);
      expect(resDbInfo.body.message).toMatch(/disabled in production/i);

      // 2. Destructive factory seeder MUST be 403 in production
      const resSeed = await request(app).post('/api/dev/seed-factory-data').send({ collections: [] });
      expect(resSeed.status).toBe(403);
      expect(resSeed.body.success).toBe(false);
      expect(resSeed.body.message).toMatch(/disabled in production/i);

      // 3. Raw partner assignment utility MUST be 403 in production
      const resAssign = await request(app).post('/api/dev/assign-partner').send({});
      expect(resAssign.status).toBe(403);
      expect(resAssign.body.success).toBe(false);
      expect(resAssign.body.message).toMatch(/disabled in production/i);
    } finally {
      (config as any).nodeEnv = originalEnv;
    }
  });

  it('Production Demo Support: public demonstration endpoints safely execute in production environment', async () => {
    const originalEnv = config.nodeEnv;
    try {
      (config as any).nodeEnv = 'production';

      // 1. Dedicated /api/demo/launch-live-order succeeds in production
      const resLaunch = await request(app).post('/api/demo/launch-live-order').send();
      expect([200, 201]).toContain(resLaunch.status);
      expect(resLaunch.body.success).toBe(true);
      expect(resLaunch.body.data.order).toBeDefined();

      // 2. Dedicated /api/demo/active-order succeeds in production
      const resActive = await request(app).get('/api/demo/active-order');
      expect(resActive.status).toBe(200);
      expect(resActive.body.success).toBe(true);

      // 3. Backward-compatible /api/dev/demo/launch-live-order also succeeds in production
      const resLegacyLaunch = await request(app).post('/api/dev/demo/launch-live-order').send();
      expect([200, 201]).toContain(resLegacyLaunch.status);
      expect(resLegacyLaunch.body.success).toBe(true);

      // 4. Backward-compatible /api/dev/demo/active-order also succeeds in production
      const resLegacyActive = await request(app).get('/api/dev/demo/active-order');
      expect(resLegacyActive.status).toBe(200);
      expect(resLegacyActive.body.success).toBe(true);

      // 5. Demo endpoints in production strictly reject non-demo order handoffs
      const resHandoffNonDemo = await request(app)
        .post('/api/demo/confirm-handoff')
        .send({ orderId: regularOrder._id.toString() });
      expect(resHandoffNonDemo.status).toBe(403);
      expect(resHandoffNonDemo.body.message).toMatch(/cannot modify ordinary non-demo orders/i);
    } finally {
      (config as any).nodeEnv = originalEnv;
    }
  });


  it('Participant Isolation: launching demo does NOT change an ordinary restaurant owner', async () => {
    const preOwnerId = regularRestaurant.ownerId.toString();

    const res = await request(app)
      .post('/api/dev/demo/launch-live-order')
      .send();

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);

    const postRestaurant = await Restaurant.findById(regularRestaurant._id);
    expect(postRestaurant).not.toBeNull();
    expect(postRestaurant!.ownerId?.toString()).toBe(preOwnerId);
    expect(postRestaurant!.ownerId?.toString()).toBe(regularOwner._id.toString());
    expect(postRestaurant!.isDemo).toBe(false);
  });

  it('Participant Isolation: launching demo does NOT alter an ordinary partner status, assignment, or location', async () => {
    const postPartner = await DeliveryPartner.findById(regularPartner._id);
    expect(postPartner).not.toBeNull();
    expect(postPartner!.status).toBe('on_delivery');
    expect(postPartner!.currentAssignedDelivery).toBe('ord-regular-prev');
    expect(postPartner!.currentLocation?.coordinates).toEqual([77.6543, 12.9321]);
    expect(postPartner!.isDemo).toBe(false);
  });

  it('Idempotency & Mutex: handles duplicate / repeat launch while demo order is active and resumes simulation', async () => {
    // Simulate API process restart by stopping all in-memory timers
    stopAllDeliverySimulations();

    const res = await request(app)
      .post('/api/dev/demo/launch-live-order')
      .send();

    // Should return existing active demo order safely AND resume its simulation
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyRunning).toBe(true);
    expect(res.body.data.order.isDemo).toBe(true);
    expect(res.body.data.restaurant).toBeDefined();
    expect(res.body.data.restaurant.name).toBeDefined();
    expect(res.body.data.customer).toBeDefined();
    expect(res.body.data.customer.name).toBeDefined();
    expect(res.body.data.partner).toBeDefined();
    expect(res.body.data.partner.name).toBeDefined();
    expect(res.body.message).toContain('already running');
    expect(isSimulationActive(res.body.data.delivery._id)).toBe(true);
  });

  it('Privacy & Sanitization: active-demo endpoint does NOT expose unrelated customer data or passwords', async () => {
    const res = await request(app).get('/api/dev/demo/active-order');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.order).toBeDefined();
    expect(res.body.data.order.isDemo).toBe(true);

    // Customer display name is present, but sensitive fields must NEVER be returned
    expect(res.body.data.order.userId?.name).toBeDefined();
    expect(res.body.data.order.userId?.password).toBeUndefined();
    expect(res.body.data.order.userId?.email).toBeUndefined();
    expect(res.body.data.order.userId?.addresses).toBeUndefined();

    // Must not expose ordinary order data
    expect(res.body.data.order._id).not.toBe(regularOrder._id.toString());
  });

  it('Security: confirmDemoHandoff strictly REJECTS an ordinary order even if status matches', async () => {
    // Put regularOrder in partner_assigned state
    await Order.findByIdAndUpdate(regularOrder._id, { status: 'partner_assigned' });

    const res = await request(app)
      .post('/api/dev/demo/confirm-handoff')
      .send({ orderId: regularOrder._id.toString() });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('ordinary non-demo orders');

    // Confirm regular order was NOT transitioned to picked_up
    const unmodOrder = await Order.findById(regularOrder._id);
    expect(unmodOrder!.status).toBe('partner_assigned');
    expect(unmodOrder!.timestamps?.pickedUpAt).toBeUndefined();
  });

  it('confirms kitchen handoff via POST /api/dev/demo/confirm-handoff for demo orders', async () => {
    const activeDemo = await Order.findOne({ isDemo: true, status: 'partner_assigned' });
    expect(activeDemo).not.toBeNull();

    // Set delivery to arrived_pickup to emulate courier arriving at kitchen
    await Delivery.findOneAndUpdate({ orderId: activeDemo!._id }, { status: 'arrived_pickup' });

    const res = await request(app)
      .post('/api/dev/demo/confirm-handoff')
      .send({ orderId: activeDemo!._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order.status).toBe('picked_up');

    const updatedOrder = await Order.findById(activeDemo!._id);
    expect(updatedOrder!.status).toBe('picked_up');
    expect(updatedOrder!.timestamps?.pickedUpAt).toBeDefined();

    const updatedDelivery = await Delivery.findOne({ orderId: activeDemo!._id });
    expect(updatedDelivery!.status).toBe('picked_up');

    // Stop simulator
    stopDeliverySimulation(updatedDelivery!._id.toString());
  });

  it('Automatic & Manual Handoff Concurrency: duplicate or repeated confirm-handoff is idempotent and returns 200 without corrupting state', async () => {
    const activeDemo = await Order.findOne({ isDemo: true, status: 'picked_up' });
    expect(activeDemo).not.toBeNull();

    // Call confirm-handoff again when already picked_up
    const duplicateRes = await request(app)
      .post('/api/dev/demo/confirm-handoff')
      .send({ orderId: activeDemo!._id.toString() });

    expect(duplicateRes.status).toBe(200);
    expect(duplicateRes.body.success).toBe(true);
    expect(duplicateRes.body.data.alreadyHandedOff).toBe(true);
    expect(duplicateRes.body.data.order.status).toBe('picked_up');

    const checkOrder = await Order.findById(activeDemo!._id);
    expect(checkOrder!.status).toBe('picked_up');
  });

  it('Rate Limiting: blocks abusive repeated requests with 429 Too Many Requests', async () => {
    // Fill the rate limit bucket (10 requests)
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/dev/demo/launch-live-order').send();
    }

    // 11th request must receive HTTP 429
    const blockedRes = await request(app).post('/api/dev/demo/launch-live-order').send();
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.success).toBe(false);
    expect(blockedRes.body.message).toContain('Too many demo launch requests');
  });

  it('Data Preservation: ordinary non-demo entities remain completely preserved and unmolested', async () => {
    const verifyRegularOrder = await Order.findById(regularOrder._id);
    expect(verifyRegularOrder).not.toBeNull();
    expect(verifyRegularOrder!.isDemo).toBe(false);

    const verifyRegularRestaurant = await Restaurant.findById(regularRestaurant._id);
    expect(verifyRegularRestaurant).not.toBeNull();
    expect(verifyRegularRestaurant!.ownerId?.toString()).toBe(regularOwner._id.toString());

    const verifyRegularPartner = await DeliveryPartner.findById(regularPartner._id);
    expect(verifyRegularPartner).not.toBeNull();
    expect(verifyRegularPartner!.status).toBe('on_delivery');
    expect(verifyRegularPartner!.currentAssignedDelivery).toBe('ord-regular-prev');

    const verifyRegularUser = await User.findById(regularUser._id);
    expect(verifyRegularUser).not.toBeNull();
    expect(verifyRegularUser!.isDemo).toBe(false);
  });

  describe('Demo Account Public Access & Authentication Integrity', () => {
    it('authenticates Customer demo account and validates legitimate role tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'demo-customer@foodhub.test', password: 'devdev' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('demo-customer@foodhub.test');
      expect(res.body.data.user.roles).toContain('user');
      expect(res.body.data.token).toBeDefined();
    });

    it('authenticates Restaurant Owner demo account and validates legitimate role tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'demo-owner@foodhub.test', password: 'devdev' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('demo-owner@foodhub.test');
      expect(res.body.data.user.roles).toContain('owner');
      expect(res.body.data.token).toBeDefined();
    });

    it('authenticates Delivery Partner demo account and validates legitimate role tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'demo-partner@foodhub.test', password: 'devdev' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('demo-partner@foodhub.test');
      expect(res.body.data.user.roles).toContain('partner');
      expect(res.body.data.token).toBeDefined();
    });

    it('authenticates Platform Administrator demo account and validates legitimate role tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'demo-admin@foodhub.test', password: 'devdev' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('demo-admin@foodhub.test');
      expect(res.body.data.user.roles).toContain('admin');
      expect(res.body.data.token).toBeDefined();
    });

    it('rejects demo account login when invalid credentials are provided', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'demo-customer@foodhub.test', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid password/i);
    });

    it('rejects non-existent non-demo accounts without bypass', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown-intruder@attacker.dev', password: 'devdev' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email/i);
    });

    it('safely handles comparePassword without throwing when user document lacks selected password field', async () => {
      const userWithoutPassword = await User.findOne({ email: 'demo-customer@foodhub.test' });
      expect(userWithoutPassword).not.toBeNull();
      expect(userWithoutPassword!.password).toBeUndefined();

      // Previously threw "Error: Illegal arguments: string, undefined"
      const resultWithUnselected = await userWithoutPassword!.comparePassword('devdev');
      expect(resultWithUnselected).toBe(false);

      const resultWithEmpty = await userWithoutPassword!.comparePassword('');
      expect(resultWithEmpty).toBe(false);
    });

    it('successfully launches live-order demo idempotently when demo fixtures already exist in database', async () => {
      // First ensure demo participants exist
      const launch1 = await request(app).post('/api/dev/demo/launch-live-order').send();
      expect([200, 201]).toContain(launch1.status);
      expect(launch1.body.success).toBe(true);

      // Call launch-live-order again with existing records in place
      // (Verifies resolveDedicatedDemoParticipants runs cleanly without Illegal arguments: string, undefined)
      const launch2 = await request(app).post('/api/dev/demo/launch-live-order').send();
      expect([200, 201]).toContain(launch2.status);
      expect(launch2.body.success).toBe(true);
      expect(launch2.body.data.order).toBeDefined();
    });
  });
});

