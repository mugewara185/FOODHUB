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

describe('Simulator Concurrency and Terminal State Integration', () => {
  let partnerToken: string;
  let ownerToken: string;
  let partnerUser: any;
  let ownerUser: any;
  let restaurant: any;
  let partner: any;
  let createdOrder: any;
  let deliveryId: string;

  beforeAll(async () => {
    // Setup logic from original test
    vi.useFakeTimers({ toFake: ['setInterval', 'setTimeout', 'Date'] });

    const uri = config.mongoUri || 'mongodb://127.0.0.1:27017/FOODHUB3_TEST_DB';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    const server = require('http').createServer(app);
    initSocket(server);
    const emitMock = vi.fn();
    const toMock = vi.fn().mockReturnValue({ emit: emitMock });
    vi.spyOn(getIO(), 'to').mockImplementation(toMock);
    (global as any).emitMock = emitMock;
    (global as any).toMock = toMock;

    ownerUser = new User({ _id: new mongoose.Types.ObjectId(), name: 'Sim Owner', email: 'simowner2@test.com', password: 'hash_password', roles: ['owner'] });
    await ownerUser.save();
    ownerToken = generateToken(ownerUser._id.toString(), 'owner');

    partnerUser = new User({ _id: new mongoose.Types.ObjectId(), name: 'Sim Partner', email: 'simpartner2@test.com', password: 'hash_password', roles: ['partner'] });
    await partnerUser.save();
    partnerToken = generateToken(partnerUser._id.toString(), 'partner');

    restaurant = new Restaurant({
      _id: new mongoose.Types.ObjectId(),
      ownerId: ownerUser._id,
      name: 'Concurrency Rest',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
      isActive: true,
      address: '123 Test St',
      phone: '1234567890',
      city: 'TestCity'
    });
    await restaurant.save();

    partner = new DeliveryPartner({
      userId: partnerUser._id,
      name: 'Sim Partner',
      phone: '1231231234',
      vehicle: 'motorcycle',
      status: 'available',
      currentLocation: { type: 'Point', coordinates: [-122.4200, 37.7755] },
      completedDeliveries: 0,
      activeDeliveries: 0
    });
    await partner.save();
  });

  afterAll(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('Setup: Create order and assign partner', async () => {
    createdOrder = new Order({
      _id: new mongoose.Types.ObjectId(),
      userId: ownerUser._id,
      customerId: new mongoose.Types.ObjectId(),
      restaurantId: restaurant._id,
      restaurantName: 'Concurrency Rest',
      status: 'awaiting_partner',
      totalAmount: 20,
      items: [{ menuItemId: new mongoose.Types.ObjectId(), quantity: 1, price: 20, name: 'Pizza' }],
      deliveryLocation: { type: 'Point', coordinates: [-122.4100, 37.7700], address: '123 Dest' },
      deliveryAddress: '123 Dest',
      paymentStatus: 'completed'
    });
    await createdOrder.save();

    const res = await request(app)
      .post(`/api/delivery/partner/${createdOrder._id}/accept`)
      .set('Authorization', `Bearer ${partnerToken}`);
    expect(res.status).toBe(200);

    const updatedPartner = await DeliveryPartner.findById(partner._id);
    deliveryId = updatedPartner!.currentAssignedDelivery!.toString();
  });

  it('Test A: Competing completion ticks do not double-count or cause stale overwrites', async () => {
    // 1. Manually transition to picked_up to allow travel to destination
    await Order.findByIdAndUpdate(createdOrder._id, { status: 'picked_up' });
    await Delivery.findByIdAndUpdate(deliveryId, { status: 'picked_up' });

    // We fast-forward to just before the destination so the next ticks will complete it
    const delivery = await Delivery.findById(deliveryId);
    delivery!.currentLocation = delivery!.destinationLocation; // Exactly at destination
    await delivery!.save();

    // 2. Force two simulator ticks to overlap at the exact moment of completion.
    let findByIdCalls = 0;
    let releaseTick1: any;
    let releaseTick2: any;
    const promise1 = new Promise(resolve => releaseTick1 = resolve);
    const promise2 = new Promise(resolve => releaseTick2 = resolve);

    vi.spyOn(Delivery, 'findById').mockImplementation((async (id: any) => {
      if (id.toString() === deliveryId.toString()) {
        findByIdCalls++;
        if (findByIdCalls === 1) await promise1;
        if (findByIdCalls === 2) await promise2;
      }
      return Delivery.findOne({ _id: id });
    }) as any);

    (global as any).emitMock.mockClear();

    // Now trigger the first tick
    await vi.advanceTimersByTimeAsync(3000);

    // Trigger the second tick
    await vi.advanceTimersByTimeAsync(3000);

    // Both ticks have now been scheduled and are paused at Delivery.findById.
    releaseTick1();
    releaseTick2();

    vi.useRealTimers();
    await new Promise(resolve => setTimeout(resolve, 150));
    vi.useFakeTimers();

    // Verify invariants
    const finalDelivery = await Delivery.findById(deliveryId);
    expect(finalDelivery!.status).toBe('delivered');

    const finalPartner = await DeliveryPartner.findById(partner._id);
    expect(finalPartner!.completedDeliveries).toBe(1); // EXACTLY ONE, proving no double counting!

    // Verify socket emissions
    const emitCalls = (global as any).emitMock.mock.calls;
    const statusEmits = emitCalls.filter((call: any) => call[0] === 'delivery:status' && call[1].status === 'delivered');
    
    const orderRoomEmits = statusEmits.filter((call: any) => call[1].orderId.toString() === createdOrder._id.toString());
    // Since io.to().emit is mocked with a single spy, all calls to `emit` are recorded flatly. 
    // It emits to the order room only ONCE per transition.
    // Without the concurrency fix, this might be emitted multiple times, or the stale tick would not emit this but might emit out_for_delivery again.
    // Let's ensure NO stale emits occurred.
    const outForDeliveryEmits = emitCalls.filter((call: any) => call[0] === 'delivery:status' && call[1].status === 'out_for_delivery');
    expect(outForDeliveryEmits.length).toBe(0); // The stale tick must NOT have emitted a stale status

    vi.spyOn(Delivery, 'findById').mockRestore();
  });

  it('Test B: Cancellation race does not revive delivery', async () => {
    // Setup a new order and delivery
    const order2 = new Order({
      _id: new mongoose.Types.ObjectId(),
      userId: ownerUser._id,
      customerId: new mongoose.Types.ObjectId(),
      restaurantId: restaurant._id,
      restaurantName: 'Concurrency Rest',
      status: 'awaiting_partner',
      totalAmount: 20,
      items: [{ menuItemId: new mongoose.Types.ObjectId(), quantity: 1, price: 20, name: 'Burger' }],
      deliveryLocation: { type: 'Point', coordinates: [-122.4100, 37.7700], address: '123 Dest' },
      deliveryAddress: '123 Dest',
      paymentStatus: 'completed'
    });
    await order2.save();

    await DeliveryPartner.findByIdAndUpdate(partner._id, { status: 'available' });

    const res = await request(app)
      .post(`/api/delivery/partner/${order2._id}/accept`)
      .set('Authorization', `Bearer ${partnerToken}`);
    expect(res.status).toBe(200);

    const updatedPartner = await DeliveryPartner.findById(partner._id);
    const deliveryId2 = updatedPartner!.currentAssignedDelivery!.toString();

    // Force overlap
    let findByIdCalls = 0;
    let releaseTick1: any;
    const promise1 = new Promise(resolve => releaseTick1 = resolve);

    const originalFindById = Delivery.findById;
    vi.spyOn(Delivery, 'findById').mockImplementation((async (id: any) => {
      if (id.toString() === deliveryId2.toString()) {
        findByIdCalls++;
        if (findByIdCalls === 1) await promise1;
      }
      return Delivery.findOne({ _id: id });
    }) as any);

    // Advance timer so a tick gets stuck reading
    await vi.advanceTimersByTimeAsync(3000);

    // Now CANCEL the delivery from the outside
    await Delivery.findByIdAndUpdate(deliveryId2, { status: 'cancelled' });
    await Order.findByIdAndUpdate(order2._id, { status: 'cancelled' });

    // Release the tick
    releaseTick1();

    vi.useRealTimers();
    await new Promise(resolve => setTimeout(resolve, 100));
    vi.useFakeTimers();

    // Verify it didn't overwrite the cancellation!
    const finalDelivery = await Delivery.findById(deliveryId2);
    expect(finalDelivery!.status).toBe('cancelled'); // Stale save did not overwrite!

    vi.spyOn(Delivery, 'findById').mockRestore();
  });
});
