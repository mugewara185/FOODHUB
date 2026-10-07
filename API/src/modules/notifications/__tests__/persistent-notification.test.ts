import { describe, it, expect, beforeAll, afterAll, beforeEach, vi as jest } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../app';
import { Notification } from '../notification.model';
import { User } from '../../auth/auth.model';
import { Order } from '../../orders/order.model';
import { Restaurant } from '../../restaurants/restaurant.model';
import { notificationService } from '../notification.service';
import { getIO, initSocket } from '../../../socket';
import { createServer } from 'http';
import { transitionOrderStatus } from '../../orders/order.service';
import { DeliveryPartner } from '../../delivery/delivery-partner.model';
import { assignDelivery } from '../../delivery/delivery.service';

let server: any;
let tokenA: string;
let tokenB: string;
let userA: any;
let userB: any;
let restaurant: any;
let order: any;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodhub-test';
  if (!uri.includes('test')) {
    throw new Error('Safety guard: Refusing to run tests against non-test database: ' + uri);
  }
  await mongoose.connect(uri);
  server = createServer(app);
  initSocket(server);
});

afterAll(async () => {
  await mongoose.connection.close();
});

import jwt from 'jsonwebtoken';

beforeEach(async () => {
  await Notification.deleteMany({});
  await User.deleteMany({});
  await Order.deleteMany({});
  await Restaurant.deleteMany({});

  // User A (Customer)
  userA = await User.create({
    name: 'Customer A',
    email: 'customera@test.com',
    password: 'password123',
    phone: '1234567890',
    roles: ['user']
  });
  
  // User B (Owner)
  userB = await User.create({
    name: 'Owner B',
    email: 'ownerb@test.com',
    password: 'password123',
    phone: '0987654321',
    roles: ['owner']
  });

  tokenA = jwt.sign({ id: userA._id }, 'your_super_secret_jwt_key_here', { expiresIn: '7d' });
  tokenB = jwt.sign({ id: userB._id }, 'your_super_secret_jwt_key_here', { expiresIn: '7d' });

  restaurant = await Restaurant.create({
    name: 'Test Restaurant',
    ownerId: userB._id,
    address: '123 Main St',
    city: 'Test City',
    phone: '1234567890',
    cuisine: ['Test'],
    isOpen: true,
    menu: [],
  });

  order = await Order.create({
    userId: userA._id,
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    items: [],
    totalAmount: 100,
    status: 'pending_owner',
    deliveryAddress: '123 Main St',
    paymentMethod: 'cash',
    paymentStatus: 'pending'
  });
});

describe('Persistent Notification Architecture', () => {
  it('Test 1 & 5 — Persistence & Socket emission', async () => {
    // Intercept Socket.IO emission
    const io = getIO();
    const emitSpy = jest.spyOn(io, 'to').mockReturnValue({ emit: jest.fn() } as any);

    const notif = await notificationService.createNotification({
      userId: userA._id,
      title: 'Test Notification',
      message: 'Hello World',
      type: 'info',
    });

    expect(notif.userId.toString()).toBe(userA._id.toString());
    expect(notif.title).toBe('Test Notification');
    expect(notif.isRead).toBe(false);

    // Verify it was persisted
    const saved = await Notification.findById(notif._id);
    expect(saved).toBeTruthy();
    expect(saved?.message).toBe('Hello World');

    // Verify socket emission targeted user room with full mapped payload
    expect(emitSpy).toHaveBeenCalledWith(userA._id.toString());
    // Find the returned emitter mock to verify what was emitted
    const emitterMock = emitSpy.mock.results[0].value.emit;
    expect(emitterMock).toHaveBeenCalledWith('notification', expect.objectContaining({
      id: notif._id.toString(),
      title: 'Test Notification',
      isRead: false
    }));
  });

  it('Test 2 — User isolation', async () => {
    await notificationService.createNotification({
      userId: userA._id,
      title: 'A Notification',
      message: 'For A'
    });
    await notificationService.createNotification({
      userId: userB._id,
      title: 'B Notification',
      message: 'For B'
    });

    const resA = await request(app).get('/api/notifications').set('Authorization', `Bearer ${tokenA}`);
    expect(resA.body.data.notifications).toHaveLength(1);
    expect(resA.body.data.notifications[0].title).toBe('A Notification');

    const resB = await request(app).get('/api/notifications').set('Authorization', `Bearer ${tokenB}`);
    expect(resB.body.data.notifications).toHaveLength(1);
    expect(resB.body.data.notifications[0].title).toBe('B Notification');
  });

  it('Test 3 — Mark read', async () => {
    const notif = await notificationService.createNotification({
      userId: userA._id,
      title: 'Unread',
      message: 'Unread'
    });

    const res = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${tokenA}`);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.notification.isRead).toBe(true);

    const check = await Notification.findById(notif._id);
    expect(check?.isRead).toBe(true);
  });

  it('Test 4 — Mark all read', async () => {
    await notificationService.createNotification({ userId: userA._id, title: '1', message: '1' });
    await notificationService.createNotification({ userId: userA._id, title: '2', message: '2' });

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${tokenA}`);
    
    expect(res.body.success).toBe(true);

    const notifs = await Notification.find({ userId: userA._id });
    expect(notifs.every(n => n.isRead)).toBe(true);
  });

  it('Test 6 — Domain integration (Order service transition creates customer notification)', async () => {
    const io = getIO();
    const emitSpy = jest.spyOn(io, 'to').mockReturnValue({ emit: jest.fn() } as any);

    // Transition to delivered
    await transitionOrderStatus(order._id.toString(), 'confirmed', { id: userB._id.toString(), role: 'owner' });
    await transitionOrderStatus(order._id.toString(), 'preparing', { id: userB._id.toString(), role: 'owner' });
    await transitionOrderStatus(order._id.toString(), 'ready_for_pickup', { id: userB._id.toString(), role: 'owner' });
    
    // Set to out_for_delivery via system to bypass partner checks for this test
    order.status = 'out_for_delivery';
    await order.save();

    await transitionOrderStatus(order._id.toString(), 'delivered', { id: 'system', role: 'system' });

    // Verify Notification was created for Customer
    const notifs = await Notification.find({ userId: userA._id, orderId: order._id }).sort({ createdAt: -1 });
    
    // Should have confirmed, preparing, delivered
    expect(notifs.length).toBe(3);
    
    const deliveredNotif = notifs[0]; // Most recent
    expect(deliveredNotif.title).toBe('Order Delivered');
    expect(deliveredNotif.type).toBe('success');
  });

  it('Test 7 — Domain integration (Delivery service assigns partner)', async () => {
    // Create an available partner
    const partner = await DeliveryPartner.create({
      userId: userA._id, // reuse userA as partner for this test just to have a valid ID
      name: 'Test Partner',
      phone: '9999999999',
      status: 'available',
      currentLocation: { type: 'Point', coordinates: [0, 0] },
      completedDeliveries: 0,
      vehicle: 'bicycle'
    });

    // Assign delivery
    await assignDelivery(order._id.toString(), [0, 0], [1, 1]);

    // Verify Notification was created for Partner
    const notifs = await Notification.find({ userId: userA._id, orderId: order._id }).sort({ createdAt: -1 });
    expect(notifs.length).toBeGreaterThan(0);
    
    const assignNotif = notifs[0];
    expect(assignNotif.title).toBe('New Delivery');
    expect(assignNotif.type).toBe('info');
    expect(assignNotif.message).toContain('assigned a new delivery');
  });
});
