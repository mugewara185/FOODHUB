import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import app from '../../../app';
import { initSocket, getIO } from '../../../socket';
import { User } from '../../auth/auth.model';
import { Order } from '../../orders/order.model';
import { Restaurant } from '../../restaurants/restaurant.model';
import { DeliveryPartner } from '../delivery-partner.model';
import { Delivery } from '../delivery.model';
import { advanceAlongWaypoints, fetchRoadWaypoints } from '../delivery.simulator';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/env';

function generateToken(id: string, role: string): string {
  return jwt.sign({ id, role }, config.jwt.secret as jwt.Secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

describe('Road Simulator, Chat Correlation & Multi-Partner Verification', () => {
  let server: any;
  let serverPort: number;

  // Actors
  let customerUser: any;
  let ownerUser: any;
  let assignedPartnerUser: any;
  let unassignedPartnerUser: any;

  let customerToken: string;
  let ownerToken: string;
  let assignedPartnerToken: string;
  let unassignedPartnerToken: string;

  // DB Fixtures
  let restaurant: any;
  let assignedPartnerDoc: any;
  let unassignedPartnerDoc: any;
  let testOrder: any;
  let testDelivery: any;

  beforeAll(async () => {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB3_TEST';
    const isDedicatedTestDb = /test|e2e/i.test(uri);
    if (!isDedicatedTestDb) {
      throw new Error(`[FAIL-CLOSED SAFETY GUARD] Test must run against dedicated test DB, got: ${uri}`);
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    server = createServer(app);
    initSocket(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        serverPort = (server.address() as any).port;
        resolve();
      });
    });

    // Create Customer
    customerUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'John Customer Test',
      email: `john-${Date.now()}@test.dev`,
      password: 'dev_password_hash',
      roles: ['user']
    });
    await customerUser.save();
    customerToken = generateToken(customerUser._id.toString(), 'user');

    // Create Owner
    ownerUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Spice Garden Owner Test',
      email: `owner.spice-${Date.now()}@foodhub.dev`,
      password: 'dev_password_hash',
      roles: ['owner']
    });
    await ownerUser.save();
    ownerToken = generateToken(ownerUser._id.toString(), 'owner');

    // Create Restaurant (Spice Garden #3)
    restaurant = new Restaurant({
      _id: new mongoose.Types.ObjectId(),
      ownerId: ownerUser._id,
      name: 'Spice Garden #3',
      address: 'Indiranagar 100ft Rd',
      city: 'Bangalore',
      phone: '+91 9876543210',
      location: { lat: 12.9716, lng: 77.5946 },
      isOpen: true,
      cuisine: ['Indian']
    });
    await restaurant.save();

    // Create Assigned Partner (Rahul Mehta)
    assignedPartnerUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Rahul Mehta Test',
      email: `rahul-${Date.now()}@foodhub.dev`,
      password: 'dev_password_hash',
      roles: ['partner']
    });
    await assignedPartnerUser.save();
    assignedPartnerToken = generateToken(assignedPartnerUser._id.toString(), 'partner');

    assignedPartnerDoc = new DeliveryPartner({
      _id: new mongoose.Types.ObjectId(),
      userId: assignedPartnerUser._id,
      name: 'Rahul Mehta Test',
      phone: '+91 8376537155',
      vehicle: 'Scooter',
      rating: 4.8,
      status: 'assigned',
      currentLocation: { type: 'Point', coordinates: [77.5900, 12.9700] }
    });
    await assignedPartnerDoc.save();

    // Create Unassigned Partner (Partner B)
    unassignedPartnerUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Unassigned Partner B',
      email: `partnerB-${Date.now()}@foodhub.dev`,
      password: 'dev_password_hash',
      roles: ['partner']
    });
    await unassignedPartnerUser.save();
    unassignedPartnerToken = generateToken(unassignedPartnerUser._id.toString(), 'partner');

    unassignedPartnerDoc = new DeliveryPartner({
      _id: new mongoose.Types.ObjectId(),
      userId: unassignedPartnerUser._id,
      name: 'Unassigned Partner B',
      phone: '+91 8888888888',
      vehicle: 'Bike',
      rating: 4.5,
      status: 'available',
      currentLocation: { type: 'Point', coordinates: [77.6500, 12.9800] }
    });
    await unassignedPartnerDoc.save();

    // Create Order
    testOrder = new Order({
      _id: new mongoose.Types.ObjectId(),
      userId: customerUser._id,
      restaurantId: restaurant._id,
      restaurantName: 'Spice Garden #3',
      status: 'partner_assigned',
      totalAmount: 480,
      items: [{ menuItemId: 'item-1', name: 'Paneer Butter Masala', price: 280, quantity: 1 }],
      deliveryAddress: 'Koramangala 4th Block, Bangalore',
      paymentMethod: 'upi',
      paymentStatus: 'completed'
    });
    await testOrder.save();

    // Create Delivery assigned to Rahul Mehta
    testDelivery = new Delivery({
      _id: new mongoose.Types.ObjectId(),
      orderId: testOrder._id,
      partnerId: assignedPartnerDoc._id,
      status: 'partner_assigned',
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6146, 12.9916] },
      currentLocation: { type: 'Point', coordinates: [77.5900, 12.9700] },
      timestamps: { assignedAt: new Date() }
    });
    await testDelivery.save();
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    // Clean up test documents
    if (testOrder) await Order.findByIdAndDelete(testOrder._id);
    if (testDelivery) await Delivery.findByIdAndDelete(testDelivery._id);
    if (restaurant) await Restaurant.findByIdAndDelete(restaurant._id);
    if (assignedPartnerDoc) await DeliveryPartner.findByIdAndDelete(assignedPartnerDoc._id);
    if (unassignedPartnerDoc) await DeliveryPartner.findByIdAndDelete(unassignedPartnerDoc._id);
    if (customerUser) await User.findByIdAndDelete(customerUser._id);
    if (ownerUser) await User.findByIdAndDelete(ownerUser._id);
    if (assignedPartnerUser) await User.findByIdAndDelete(assignedPartnerUser._id);
    if (unassignedPartnerUser) await User.findByIdAndDelete(unassignedPartnerUser._id);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  const connectClient = (token: string): Promise<ClientSocket> => {
    return new Promise((resolve, reject) => {
      const client = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token }
      });
      client.on('connect', () => resolve(client));
      client.on('connect_error', (err) => reject(err));
    });
  };

  // =========================================================================
  // 1. Polyline Waypoint Stepping Algorithm
  // =========================================================================
  describe('Polyline Waypoint Stepping Algorithm', () => {
    it('accurately advances through intermediate waypoints along a street polyline', () => {
      // 3-point polyline: A -> B -> C
      // [lng, lat]
      const waypoints: [number, number][] = [
        [77.5900, 12.9700],
        [77.5920, 12.9700], // ~216 meters east
        [77.5920, 12.9720]  // ~221 meters north
      ];

      const startCoord = waypoints[0];
      const stepMeters = 50; // 50m step

      // Step 1
      const step1 = advanceAlongWaypoints(startCoord, waypoints, 0, stepMeters);
      expect(step1.nextIndex).toBe(0); // Still in segment 0 -> 1
      expect(step1.nextCoord[0]).toBeGreaterThan(startCoord[0]); // Moved east
      expect(step1.distanceRemainingMeters).toBeGreaterThan(350);

      // Step multiple times until past waypoint 1
      let current = step1.nextCoord;
      let currentIndex = step1.nextIndex;
      for (let i = 0; i < 5; i++) {
        const step = advanceAlongWaypoints(current, waypoints, currentIndex, stepMeters);
        current = step.nextCoord;
        currentIndex = step.nextIndex;
      }

      // Should have advanced past waypoint 1 into segment 1 -> 2 (moving north)
      expect(currentIndex).toBe(1);
      expect(current[1]).toBeGreaterThan(12.9700); // Moved north
    });

    it('gracefully degrades to straight-line interpolation when waypoints length is 2', () => {
      const waypoints: [number, number][] = [
        [77.5900, 12.9700],
        [77.6000, 12.9800]
      ];
      const startCoord = waypoints[0];
      const stepMeters = 100;

      const result = advanceAlongWaypoints(startCoord, waypoints, 0, stepMeters);
      expect(result.nextIndex).toBe(0);
      expect(result.nextCoord[0]).toBeGreaterThan(startCoord[0]);
      expect(result.nextCoord[1]).toBeGreaterThan(startCoord[1]);
      expect(result.distanceRemainingMeters).toBeLessThan(1500);
    });
  });

  // =========================================================================
  // 2. Chat Correlation, Deduplication & Delivery Partner Authorization
  // =========================================================================
  describe('Chat Correlation & Cross-Role Delivery Partner Chat', () => {
    it('persists clientMessageId and _id on chat send and broadcasts to room', async () => {
      const assignedPartnerSocket = await connectClient(assignedPartnerToken);
      const customerSocket = await connectClient(customerToken);

      assignedPartnerSocket.emit('join_order_room', testOrder._id.toString());
      customerSocket.emit('join_order_room', testOrder._id.toString());
      await new Promise((r) => setTimeout(r, 100));

      let broadcastReceived: any = null;
      customerSocket.on('order:chat:message', (payload) => {
        broadcastReceived = payload;
      });

      const clientMessageId = `test-client-msg-${Date.now()}`;
      assignedPartnerSocket.emit('order:chat:send', {
        clientMessageId,
        orderId: testOrder._id.toString(),
        message: 'Hello, I have picked up your food and am on the way!',
        targetRole: 'user',
        senderRole: 'partner'
      });

      await new Promise((r) => setTimeout(r, 300));

      expect(broadcastReceived).not.toBeNull();
      expect(broadcastReceived.clientMessageId).toBe(clientMessageId);
      expect(broadcastReceived._id).toBeDefined();
      expect(broadcastReceived.senderRole).toBe('partner');
      expect(broadcastReceived.targetRole).toBe('user');
      expect(broadcastReceived.message).toBe('Hello, I have picked up your food and am on the way!');

      // Check DB persistence in Order.chatMessages
      const order = await Order.findById(testOrder._id);
      const savedMsg = order!.chatMessages.find((m: any) => m.clientMessageId === clientMessageId);
      expect(savedMsg).toBeDefined();
      expect(savedMsg!._id).toBeDefined();
      expect(savedMsg!.senderRole).toBe('partner');

      assignedPartnerSocket.disconnect();
      customerSocket.disconnect();
    });

    it('enforces multi-partner isolation: Unassigned Partner B cannot join room or chat on Order A', async () => {
      const unassignedSocket = await connectClient(unassignedPartnerToken);

      let joinError: any = null;
      unassignedSocket.on('error', (err) => { joinError = err; });

      // Partner B attempts to join Partner A's order room
      unassignedSocket.emit('join_order_room', testOrder._id.toString());
      await new Promise((r) => setTimeout(r, 200));

      expect(joinError).not.toBeNull();
      expect(joinError.message).toMatch(/Unauthorized to join order room/i);

      let chatError: any = null;
      unassignedSocket.on('error', (err) => { chatError = err; });

      // Partner B attempts to send chat on Partner A's order
      unassignedSocket.emit('order:chat:send', {
        orderId: testOrder._id.toString(),
        message: 'Malicious chat from unassigned courier',
        targetRole: 'user',
        senderRole: 'partner'
      });

      await new Promise((r) => setTimeout(r, 200));

      expect(chatError).not.toBeNull();
      expect(chatError.message).toMatch(/Unauthorized to send chat message for this order/i);

      unassignedSocket.disconnect();
    });

    it('allows assigned partner to chat with restaurant owner', async () => {
      const assignedPartnerSocket = await connectClient(assignedPartnerToken);
      const ownerSocket = await connectClient(ownerToken);

      assignedPartnerSocket.emit('join_order_room', testOrder._id.toString());
      ownerSocket.emit('join_order_room', testOrder._id.toString());
      await new Promise((r) => setTimeout(r, 100));

      let ownerReceivedMsg: any = null;
      ownerSocket.on('order:chat:message', (payload) => {
        ownerReceivedMsg = payload;
      });

      assignedPartnerSocket.emit('order:chat:send', {
        orderId: testOrder._id.toString(),
        message: 'Waiting outside the restaurant for pickup',
        targetRole: 'owner',
        senderRole: 'partner'
      });

      await new Promise((r) => setTimeout(r, 300));

      expect(ownerReceivedMsg).not.toBeNull();
      expect(ownerReceivedMsg.senderRole).toBe('partner');
      expect(ownerReceivedMsg.targetRole).toBe('owner');
      expect(ownerReceivedMsg.message).toBe('Waiting outside the restaurant for pickup');

      assignedPartnerSocket.disconnect();
      ownerSocket.disconnect();
    });

    it('GET /api/orders/:id/chat returns chat history with _id and clientMessageId for authorized actors', async () => {
      // Customer can fetch chat
      const custRes = await request(app)
        .get(`/api/orders/${testOrder._id}/chat`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(custRes.status).toBe(200);
      expect(Array.isArray(custRes.body.data)).toBe(true);
      expect(custRes.body.data.length).toBeGreaterThanOrEqual(2);
      expect(custRes.body.data[0]._id).toBeDefined();

      // Assigned Partner can fetch chat
      const partnerRes = await request(app)
        .get(`/api/orders/${testOrder._id}/chat`)
        .set('Authorization', `Bearer ${assignedPartnerToken}`);
      expect(partnerRes.status).toBe(200);
      expect(Array.isArray(partnerRes.body.data)).toBe(true);

      // Unassigned Partner B is rejected with 403
      const unassignedRes = await request(app)
        .get(`/api/orders/${testOrder._id}/chat`)
        .set('Authorization', `Bearer ${unassignedPartnerToken}`);
      expect(unassignedRes.status).toBe(403);
    });
  });

  // =========================================================================
  // 3. Delivery Timing & Elapsed Transit Duration
  // =========================================================================
  describe('Delivery Timing & Elapsed Transit Metrics', () => {
    it('persists pickedUpAt on pickup and deliveredAt on delivery with accurate elapsed minutes', async () => {
      const { transitionOrderStatus } = await import('../../orders/order.service');

      // 1. Transition to picked_up
      await transitionOrderStatus(testOrder._id.toString(), 'picked_up', { id: 'sys', role: 'system' });
      const pickedUpOrder = await Order.findById(testOrder._id);
      expect(pickedUpOrder!.timestamps?.pickedUpAt).toBeDefined();

      // Simulate transit time gap
      const pickedUpTime = new Date(Date.now() - 12 * 60 * 1000); // 12 minutes ago
      pickedUpOrder!.timestamps!.pickedUpAt = pickedUpTime;
      await pickedUpOrder!.save();

      // 2. Transition to delivered
      await transitionOrderStatus(testOrder._id.toString(), 'delivered', { id: 'sys', role: 'system' });
      const deliveredOrder = await Order.findById(testOrder._id);
      expect(deliveredOrder!.timestamps?.deliveredAt).toBeDefined();

      const diffMs = deliveredOrder!.timestamps!.deliveredAt!.getTime() - deliveredOrder!.timestamps!.pickedUpAt!.getTime();
      const elapsedMinutes = Math.round(diffMs / 60000);

      // Should be ~12 minutes elapsed
      expect(elapsedMinutes).toBeGreaterThanOrEqual(11);
      expect(elapsedMinutes).toBeLessThanOrEqual(13);
    });
  });
});
