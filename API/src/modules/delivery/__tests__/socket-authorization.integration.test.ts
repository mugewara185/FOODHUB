import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import app from '../../../app';
import { initSocket, getIO } from '../../../socket';
import { User } from '../../auth/auth.model';
import { Order } from '../../orders/order.model';
import { Restaurant } from '../../restaurants/restaurant.model';
import { DeliveryPartner } from '../delivery-partner.model';
import { Delivery } from '../delivery.model';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/env';

function generateToken(id: string, role: string): string {
  return jwt.sign({ id, role }, config.jwt.secret as jwt.Secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

describe('Socket Authorization & Chat Persistence Safety Integration', () => {
  let server: any;
  let serverPort: number;

  // Users & Tokens
  let customerUser: any;
  let ownerUser: any;
  let partnerUserA: any;
  let partnerUserB: any;
  let strangerUser: any;

  let customerToken: string;
  let partnerTokenA: string;
  let partnerTokenB: string;
  let strangerToken: string;

  // DB Fixtures
  let restaurant: any;
  let partnerDocA: any;
  let partnerDocB: any;
  let testOrder: any;
  let testDeliveryA: any;

  beforeAll(async () => {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB3_TEST';
    const isDedicatedTestDb = /test|e2e/i.test(uri);
    if (!isDedicatedTestDb) {
      throw new Error(`[FAIL-CLOSED SAFETY GUARD] socket-authorization test must only run against a dedicated test database containing 'test' or 'e2e' in name, got: ${uri}`);
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
      name: 'Auth Cust',
      email: `cust-${Date.now()}@test.com`,
      password: 'password_hash',
      roles: ['user']
    });
    await customerUser.save();
    customerToken = generateToken(customerUser._id.toString(), 'user');

    // Create Owner
    ownerUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Auth Owner',
      email: `owner-${Date.now()}@test.com`,
      password: 'password_hash',
      roles: ['owner']
    });
    await ownerUser.save();

    // Create Restaurant
    restaurant = new Restaurant({
      _id: new mongoose.Types.ObjectId(),
      ownerId: ownerUser._id,
      name: 'Auth Restaurant',
      location: { lat: 12.9716, lng: 77.5946 },
      address: '123 Test St',
      city: 'Bangalore',
      phone: '9876543210',
      isOpen: true,
      cuisine: ['Indian']
    });
    await restaurant.save();

    // Create Partner A
    partnerUserA = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Partner Alpha',
      email: `partner-a-${Date.now()}@test.com`,
      password: 'password_hash',
      roles: ['partner']
    });
    await partnerUserA.save();
    partnerTokenA = generateToken(partnerUserA._id.toString(), 'partner');

    partnerDocA = new DeliveryPartner({
      _id: new mongoose.Types.ObjectId(),
      userId: partnerUserA._id,
      name: 'Partner Alpha',
      phone: '1111111111',
      status: 'assigned',
      vehicle: 'Bike',
      currentLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      completedDeliveries: 0
    });
    await partnerDocA.save();

    // Create Partner B
    partnerUserB = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Partner Beta',
      email: `partner-b-${Date.now()}@test.com`,
      password: 'password_hash',
      roles: ['partner']
    });
    await partnerUserB.save();
    partnerTokenB = generateToken(partnerUserB._id.toString(), 'partner');

    partnerDocB = new DeliveryPartner({
      _id: new mongoose.Types.ObjectId(),
      userId: partnerUserB._id,
      name: 'Partner Beta',
      phone: '2222222222',
      status: 'available',
      vehicle: 'Scooter',
      currentLocation: { type: 'Point', coordinates: [77.6000, 12.9800] },
      completedDeliveries: 0
    });
    await partnerDocB.save();

    // Create Stranger
    strangerUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Stranger User',
      email: `stranger-${Date.now()}@test.com`,
      password: 'password_hash',
      roles: ['user']
    });
    await strangerUser.save();
    strangerToken = generateToken(strangerUser._id.toString(), 'user');

    // Create Order
    testOrder = new Order({
      _id: new mongoose.Types.ObjectId(),
      userId: customerUser._id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      totalAmount: 350,
      status: 'partner_assigned',
      deliveryAddress: 'Customer destination',
      items: [{ menuItemId: 'item-1', name: 'Meal', price: 350, quantity: 1 }]
    });
    await testOrder.save();

    // Create Delivery assigned to Partner A
    testDeliveryA = new Delivery({
      _id: new mongoose.Types.ObjectId(),
      orderId: testOrder._id,
      partnerId: partnerDocA._id,
      status: 'partner_assigned',
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6146, 12.9916] },
      currentLocation: { type: 'Point', coordinates: [77.5946, 12.9716] }
    });
    await testDeliveryA.save();

    partnerDocA.currentAssignedDelivery = testDeliveryA._id;
    await partnerDocA.save();
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    // Scoped cleanup
    if (testDeliveryA) await Delivery.findByIdAndDelete(testDeliveryA._id);
    if (testOrder) await Order.findByIdAndDelete(testOrder._id);
    if (partnerDocA) await DeliveryPartner.findByIdAndDelete(partnerDocA._id);
    if (partnerDocB) await DeliveryPartner.findByIdAndDelete(partnerDocB._id);
    if (restaurant) await Restaurant.findByIdAndDelete(restaurant._id);
    if (customerUser) await User.findByIdAndDelete(customerUser._id);
    if (ownerUser) await User.findByIdAndDelete(ownerUser._id);
    if (partnerUserA) await User.findByIdAndDelete(partnerUserA._id);
    if (partnerUserB) await User.findByIdAndDelete(partnerUserB._id);
    if (strangerUser) await User.findByIdAndDelete(strangerUser._id);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  const connectClient = (token?: string, extraAuth?: any): Promise<ClientSocket> => {
    return new Promise((resolve, reject) => {
      const socket = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: {
          token,
          ...extraAuth
        }
      });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', reject);
    });
  };

  // =========================================================================
  // P0 TESTS: partner:location_updated Security & Authorization
  // =========================================================================

  it('P0.1 — Rejects unauthenticated location update without modifying DB or broadcasting', async () => {
    const unauthSocket = await connectClient();
    let errorReceived: any = null;
    unauthSocket.on('error', (err) => { errorReceived = err; });

    let broadcastReceived = false;
    unauthSocket.on('delivery:location', () => { broadcastReceived = true; });

    const initialDelivery = await Delivery.findById(testDeliveryA._id);
    const initialCoords = initialDelivery!.currentLocation.coordinates;

    unauthSocket.emit('partner:location_updated', {
      deliveryId: testDeliveryA._id.toString(),
      partnerId: partnerDocA._id.toString(),
      location: { lat: 13.0000, lng: 77.7000 }
    });

    await new Promise((r) => setTimeout(r, 200));

    expect(errorReceived).not.toBeNull();
    expect(errorReceived.message).toMatch(/Authentication required with partner role/i);
    expect(broadcastReceived).toBe(false);

    // Assert DB untouched
    const currentDelivery = await Delivery.findById(testDeliveryA._id);
    expect(currentDelivery!.currentLocation.coordinates).toEqual(initialCoords);

    unauthSocket.disconnect();
  });

  it('P0.2 — Rejects location update for another partner delivery (Partner B trying to update Partner A delivery)', async () => {
    const partnerBSocket = await connectClient(partnerTokenB);
    let errorReceived: any = null;
    partnerBSocket.on('error', (err) => { errorReceived = err; });

    let broadcastReceived = false;
    partnerBSocket.on('delivery:location', () => { broadcastReceived = true; });

    const initialDelivery = await Delivery.findById(testDeliveryA._id);
    const initialCoords = initialDelivery!.currentLocation.coordinates;

    // Partner B attempts to update Partner A's delivery
    partnerBSocket.emit('partner:location_updated', {
      deliveryId: testDeliveryA._id.toString(),
      partnerId: partnerDocB._id.toString(),
      location: { lat: 13.0000, lng: 77.7000 }
    });

    await new Promise((r) => setTimeout(r, 200));

    expect(errorReceived).not.toBeNull();
    expect(errorReceived.message).toMatch(/Unauthorized: delivery is not assigned to this partner/i);
    expect(broadcastReceived).toBe(false);

    // Assert DB untouched
    const currentDelivery = await Delivery.findById(testDeliveryA._id);
    expect(currentDelivery!.currentLocation.coordinates).toEqual(initialCoords);

    partnerBSocket.disconnect();
  });

  it('P0.3 — Rejects spoofed partnerId (Partner A sending Partner B ID in payload)', async () => {
    const partnerASocket = await connectClient(partnerTokenA);
    let errorReceived: any = null;
    partnerASocket.on('error', (err) => { errorReceived = err; });

    // Partner A passes Partner B's ID in payload
    partnerASocket.emit('partner:location_updated', {
      deliveryId: testDeliveryA._id.toString(),
      partnerId: partnerDocB._id.toString(),
      location: { lat: 13.0000, lng: 77.7000 }
    });

    await new Promise((r) => setTimeout(r, 200));

    expect(errorReceived).not.toBeNull();
    expect(errorReceived.message).toMatch(/Partner ID mismatch \/ spoof attempt rejected/i);

    partnerASocket.disconnect();
  });

  it('P0.4 — Rejects invalid coordinates (out of range latitude > 90, NaN, non-numeric)', async () => {
    const partnerASocket = await connectClient(partnerTokenA);
    let errorReceived: any = null;
    partnerASocket.on('error', (err) => { errorReceived = err; });

    // Latitude 195 is geographically impossible
    partnerASocket.emit('partner:location_updated', {
      deliveryId: testDeliveryA._id.toString(),
      partnerId: partnerDocA._id.toString(),
      location: { lat: 195.5, lng: 77.5946 }
    });

    await new Promise((r) => setTimeout(r, 200));

    expect(errorReceived).not.toBeNull();
    expect(errorReceived.message).toMatch(/Invalid coordinates/i);

    partnerASocket.disconnect();
  });

  it('P0.5 — Valid assigned-partner update updates Delivery, DeliveryPartner, and broadcasts', async () => {
    const partnerASocket = await connectClient(partnerTokenA);
    const customerSocket = await connectClient(customerToken);

    // Customer joins order room to receive broadcast
    customerSocket.emit('join_order_room', testOrder._id.toString());
    await new Promise((r) => setTimeout(r, 100));

    let broadcastPayload: any = null;
    customerSocket.on('delivery:location', (payload) => {
      broadcastPayload = payload;
    });

    const newLat = 12.9750;
    const newLng = 77.5980;

    partnerASocket.emit('partner:location_updated', {
      deliveryId: testDeliveryA._id.toString(),
      partnerId: partnerDocA._id.toString(),
      location: { lat: newLat, lng: newLng }
    });

    await new Promise((r) => setTimeout(r, 300));

    // Verify broadcast received by order room subscriber
    expect(broadcastPayload).not.toBeNull();
    expect(broadcastPayload.deliveryId).toBe(testDeliveryA._id.toString());
    expect(broadcastPayload.orderId).toBe(testOrder._id.toString());
    expect(broadcastPayload.location).toEqual({ lat: newLat, lng: newLng });

    // Verify DB persistence in Delivery
    const updatedDelivery = await Delivery.findById(testDeliveryA._id);
    expect(updatedDelivery!.currentLocation.coordinates).toEqual([newLng, newLat]);

    // Verify DB persistence in DeliveryPartner
    const updatedPartner = await DeliveryPartner.findById(partnerDocA._id);
    expect(updatedPartner!.currentLocation.coordinates).toEqual([newLng, newLat]);

    partnerASocket.disconnect();
    customerSocket.disconnect();
  });

  // =========================================================================
  // P1 TESTS: order:chat:send Persistence Failure & Broadcast Safety
  // =========================================================================

  it('P1.1 — Failed persistence does NOT broadcast chat message and returns error to sender', async () => {
    const customerSocket = await connectClient(customerToken);
    const partnerASocket = await connectClient(partnerTokenA);

    // Both join order room
    customerSocket.emit('join_order_room', testOrder._id.toString());
    partnerASocket.emit('join_order_room', testOrder._id.toString());
    await new Promise((r) => setTimeout(r, 100));

    let customerReceivedBroadcast = false;
    let partnerReceivedBroadcast = false;
    let senderErrorReceived: any = null;

    customerSocket.on('order:chat:message', () => { customerReceivedBroadcast = true; });
    partnerASocket.on('order:chat:message', () => { partnerReceivedBroadcast = true; });
    customerSocket.on('error', (err) => { senderErrorReceived = err; });

    // Mock Order.findByIdAndUpdate to simulate a database failure
    const spy = vi.spyOn(Order, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('Simulated DB connection failure'));

    customerSocket.emit('order:chat:send', {
      orderId: testOrder._id.toString(),
      message: 'This message will fail to persist',
      targetRole: 'partner'
    });

    await new Promise((r) => setTimeout(r, 300));

    // Assert that broadcast NEVER happened
    expect(customerReceivedBroadcast).toBe(false);
    expect(partnerReceivedBroadcast).toBe(false);

    // Assert error returned to sender
    expect(senderErrorReceived).not.toBeNull();
    expect(senderErrorReceived.message).toMatch(/Failed to persist chat message/i);

    spy.mockRestore();
    customerSocket.disconnect();
    partnerASocket.disconnect();
  });

  it('P1.2 — Successful persistence persists message in Order document and broadcasts to room', async () => {
    const customerSocket = await connectClient(customerToken);
    const partnerASocket = await connectClient(partnerTokenA);

    customerSocket.emit('join_order_room', testOrder._id.toString());
    partnerASocket.emit('join_order_room', testOrder._id.toString());
    await new Promise((r) => setTimeout(r, 100));

    let receivedChat: any = null;
    partnerASocket.on('order:chat:message', (payload) => {
      receivedChat = payload;
    });

    const chatContent = 'Hello partner, please bring extra napkins!';
    customerSocket.emit('order:chat:send', {
      orderId: testOrder._id.toString(),
      message: chatContent,
      targetRole: 'partner'
    });

    await new Promise((r) => setTimeout(r, 300));

    // Verify broadcast received
    expect(receivedChat).not.toBeNull();
    expect(receivedChat.message).toBe(chatContent);
    expect(receivedChat.senderId).toBe(customerUser._id.toString());
    expect(receivedChat.senderRole).toBe('user');

    // Verify DB persistence in Order.chatMessages
    const dbOrder = await Order.findById(testOrder._id);
    const savedMsg = dbOrder!.chatMessages.find((m: any) => m.message === chatContent);
    expect(savedMsg).toBeDefined();
    expect(savedMsg.senderId.toString()).toBe(customerUser._id.toString());

    customerSocket.disconnect();
    partnerASocket.disconnect();
  });

  it('P1.3 — Unauthorized stranger cannot join order room or send chat', async () => {
    const strangerSocket = await connectClient(strangerToken);

    let joinError: any = null;
    strangerSocket.on('error', (err) => { joinError = err; });

    strangerSocket.emit('join_order_room', testOrder._id.toString());
    await new Promise((r) => setTimeout(r, 200));

    expect(joinError).not.toBeNull();
    expect(joinError.message).toMatch(/Unauthorized to join order room/i);

    // Stranger attempts to send chat
    let sendError: any = null;
    strangerSocket.on('error', (err) => { sendError = err; });

    strangerSocket.emit('order:chat:send', {
      orderId: testOrder._id.toString(),
      message: 'Hacked message from stranger',
      targetRole: 'partner'
    });

    await new Promise((r) => setTimeout(r, 200));

    expect(sendError).not.toBeNull();
    expect(sendError.message).toMatch(/Unauthorized to send chat message for this order/i);

    strangerSocket.disconnect();
  });
});
