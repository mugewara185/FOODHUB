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
  let order2: any;
  let deliveryId2: string;

  beforeAll(async () => {
    // Setup logic from original test
    vi.useFakeTimers({ toFake: ['setInterval', 'setTimeout', 'Date'] });

    const uri = config.mongoUri || 'mongodb://127.0.0.1:27017/FOODHUB3_TEST_DB';
    const isDedicatedTestDb = /test|e2e/i.test(uri);
    if (!isDedicatedTestDb) {
      throw new Error(`[FAIL-CLOSED SAFETY GUARD] simulator-concurrency test must only run against a dedicated test database containing 'test' or 'e2e' in name, got: ${uri}`);
    }

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

    const dbName = mongoose.connection.db?.databaseName || mongoose.connection.name || '';
    const isDedicatedTestDb = /test|e2e/i.test(dbName);
    if (!isDedicatedTestDb) {
      console.warn(`[SAFETY GUARD] Skipping cleanup: ${dbName} is not a dedicated test database.`);
    } else {
      // Scoped deterministic cleanup of all created test fixtures
      if (createdOrder) await Order.findByIdAndDelete(createdOrder._id);
      if (order2) await Order.findByIdAndDelete(order2._id);
      if (deliveryId) await Delivery.findByIdAndDelete(deliveryId);
      if (deliveryId2) await Delivery.findByIdAndDelete(deliveryId2);
      if (partner) await DeliveryPartner.findByIdAndDelete(partner._id);
      if (restaurant) await Restaurant.findByIdAndDelete(restaurant._id);
      if (ownerUser) await User.findByIdAndDelete(ownerUser._id);
      if (partnerUser) await User.findByIdAndDelete(partnerUser._id);
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
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

    const findByIdSpy = vi.spyOn(Delivery, 'findById').mockImplementation((async (id: any) => {
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

    findByIdSpy.mockRestore();
  });

  it('Test B: Cancellation race does not revive delivery', async () => {
    // Setup a new order and delivery
    order2 = new Order({
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
    deliveryId2 = updatedPartner!.currentAssignedDelivery!.toString();

    // Transition order and delivery to picked_up and place at destination so the tick will attempt completion
    await Order.findByIdAndUpdate(order2._id, { status: 'picked_up' });
    await Delivery.findByIdAndUpdate(deliveryId2, { status: 'picked_up' });
    const delivery2 = await Delivery.findById(deliveryId2);
    delivery2!.currentLocation = delivery2!.destinationLocation; // Exactly at destination
    await delivery2!.save();

    const partnerBefore = await DeliveryPartner.findById(partner._id);
    const initialCompleted = partnerBefore!.completedDeliveries;

    // Spy on Delivery.findOneAndUpdate to verify that the tick genuinely attempts the terminal transition
    const findOneAndUpdateSpy = vi.spyOn(Delivery, 'findOneAndUpdate');

    // Deterministic barriers:
    // 1. barrierReady resolves when the tick has read and captured the active delivery snapshot.
    // 2. barrierPromise pauses the tick while holding that stale snapshot in memory.
    let onBarrierReady: any;
    const barrierReady = new Promise((resolve) => { onBarrierReady = resolve; });
    let releaseBarrier: any;
    const barrierPromise = new Promise((resolve) => { releaseBarrier = resolve; });
    let captured = false;

    const findByIdSpyB = vi.spyOn(Delivery, 'findById').mockImplementation((async (id: any) => {
      if (id.toString() === deliveryId2 && !captured) {
        captured = true;
        // Read and capture the active delivery document from the database
        const activeDoc = await Delivery.findOne({ _id: id });
        onBarrierReady(); // Notify test that active document is captured in memory
        await barrierPromise; // Pause execution holding the active snapshot
        return activeDoc;
      }
      return Delivery.findOne({ _id: id });
    }) as any);

    (global as any).emitMock.mockClear();

    // Trigger the simulator tick
    const tickTimerPromise = vi.advanceTimersByTimeAsync(3000);

    // Wait deterministically for the tick to read and capture the active snapshot
    await barrierReady;

    // Concurrently cancel the delivery and order in the database while the tick is holding its active snapshot
    await Delivery.findByIdAndUpdate(deliveryId2, { status: 'cancelled' });
    await Order.findByIdAndUpdate(order2._id, { status: 'cancelled' });

    // Verify the database is now cancelled before releasing the tick
    const intermediateDelivery = await Delivery.findOne({ _id: deliveryId2 });
    expect(intermediateDelivery!.status).toBe('cancelled');

    // Release the tick to force it through the terminal-transition attempt
    releaseBarrier();
    await tickTimerPromise;

    vi.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 150));
    vi.useFakeTimers();

    // Assert that the terminal transition was genuinely attempted with the valid-source-states filter
    expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: new mongoose.Types.ObjectId(deliveryId2),
        status: { $in: ['picked_up', 'out_for_delivery', 'nearby'] },
      }),
      expect.anything(),
      expect.anything()
    );

    // Assert that the database remains cancelled (was not revived to delivered or out_for_delivery)
    const finalDelivery = await Delivery.findOne({ _id: deliveryId2 });
    expect(finalDelivery!.status).toBe('cancelled');

    // Assert that completion metrics were not incremented
    const finalPartner = await DeliveryPartner.findById(partner._id);
    expect(finalPartner!.completedDeliveries).toBe(initialCompleted);

    // Assert that no false 'delivered' status event was emitted for order2
    const emitCalls = (global as any).emitMock.mock.calls;
    const deliveredEmits = emitCalls.filter(
      (call: any) => call[0] === 'delivery:status' && 
                     call[1]?.orderId?.toString() === order2._id.toString() && 
                     call[1]?.status === 'delivered'
    );
    expect(deliveredEmits.length).toBe(0);

    // Assert that timer does not continue running and reviving the cancelled delivery
    await vi.advanceTimersByTimeAsync(15000);
    const postTimerDelivery = await Delivery.findOne({ _id: deliveryId2 });
    expect(postTimerDelivery!.status).toBe('cancelled');

    findByIdSpyB.mockRestore();
    findOneAndUpdateSpy.mockRestore();
  });
});
