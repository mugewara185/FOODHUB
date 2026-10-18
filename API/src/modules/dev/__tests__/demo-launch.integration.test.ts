import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
import { stopDeliverySimulation } from '../../delivery/delivery.simulator';
import { config } from '../../../config/env';

describe('One-Click Live-Order Demo Integration Tests', () => {
  let server: any;
  let regularOrder: any;

  beforeAll(async () => {
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

    // Create an ordinary non-demo order to verify data isolation
    const regularUser = await User.create({
      name: 'Ordinary Non-Demo Customer',
      email: `regular-${Date.now()}@test.dev`,
      password: 'password123',
      role: 'user',
      address: '777 Regular St, Bangalore',
    });

    const regularRestaurant = await Restaurant.create({
      name: 'Ordinary Regular Restaurant',
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
      menu: [{ name: 'Masala Dosa', price: 90, category: 'Breakfast', isAvailable: true }],
    });

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

  afterAll(async () => {
    // Clean up demo deliveries and simulators
    const demoDeliveries = await Delivery.find({ isDemo: true });
    for (const d of demoDeliveries) {
      stopDeliverySimulation(d._id.toString());
    }
    await Order.deleteMany({ isDemo: true });
    await Delivery.deleteMany({ isDemo: true });
    if (regularOrder) {
      await Order.findByIdAndDelete(regularOrder._id);
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('P0 Safety Guard: fails closed in production environment', async () => {
    const originalEnv = config.nodeEnv;
    try {
      (config as any).nodeEnv = 'production';
      const res = await request(app).post('/api/dev/demo/launch-live-order');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('production');
    } finally {
      (config as any).nodeEnv = originalEnv;
    }
  });

  it('launches a live order demo with real server-authoritative state progression', async () => {
    const res = await request(app)
      .post('/api/dev/demo/launch-live-order')
      .send();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order).toBeDefined();
    expect(res.body.data.delivery).toBeDefined();
    expect(res.body.data.order.isDemo).toBe(true);
    expect(res.body.data.delivery.isDemo).toBe(true);

    const orderId = res.body.data.order._id;

    // Verify order in DB
    const dbOrder = await Order.findById(orderId);
    expect(dbOrder).not.toBeNull();
    expect(dbOrder!.isDemo).toBe(true);
    expect(dbOrder!.status).toBe('partner_assigned');
    expect(dbOrder!.timestamps?.assignedAt).toBeDefined();

    // Verify delivery in DB
    const dbDelivery = await Delivery.findOne({ orderId });
    expect(dbDelivery).not.toBeNull();
    expect(dbDelivery!.status).toBe('partner_assigned');
    expect(dbDelivery!.currentLocation?.coordinates?.length).toBe(2);

    // Stop simulator so it doesn't run indefinitely in test
    stopDeliverySimulation(dbDelivery!._id.toString());
  });

  it('idempotently handles duplicate / repeat launch while demo order is active', async () => {
    const res = await request(app)
      .post('/api/dev/demo/launch-live-order')
      .send();

    // Should return existing active demo order safely
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyRunning).toBe(true);
    expect(res.body.data.order.isDemo).toBe(true);
    expect(res.body.message).toContain('already running');
  });

  it('fetches active demo order via GET /api/dev/demo/active-order', async () => {
    const res = await request(app)
      .get('/api/dev/demo/active-order');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.order).toBeDefined();
    expect(res.body.data.delivery).toBeDefined();
    expect(res.body.data.isTerminal).toBe(false);
  });

  it('confirms kitchen handoff via POST /api/dev/demo/confirm-handoff', async () => {
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

  it('Data Safety: ordinary non-demo order is preserved and unmodified', async () => {
    const verifyRegular = await Order.findById(regularOrder._id);
    expect(verifyRegular).not.toBeNull();
    expect(verifyRegular!.isDemo).toBe(false);
    expect(verifyRegular!.status).toBe('confirmed');
    expect(verifyRegular!.totalAmount).toBe(90);
  });
});
