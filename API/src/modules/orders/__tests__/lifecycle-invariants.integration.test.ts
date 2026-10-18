import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../../auth/auth.model';
import { Order } from '../order.model';
import { DeliveryPartner } from '../../delivery/delivery-partner.model';
import { Restaurant } from '../../restaurants/restaurant.model';
import { Delivery } from '../../delivery/delivery.model';
import { transitionOrderStatus } from '../order.service';
import { startDeliverySimulation } from '../../delivery/delivery.simulator';
import { initSocket, getIO } from '../../../socket';
import { createServer } from 'http';
import app from '../../../app';

describe('Order Lifecycle Invariants & Transition Guards', () => {
  let ownerUser: any;
  let partnerUser: any;
  let customerUser: any;
  let restaurant: any;
  let partner: any;
  const createdOrderIds: mongoose.Types.ObjectId[] = [];
  const createdDeliveryIds: mongoose.Types.ObjectId[] = [];

  beforeAll(async () => {
    const rawUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB3_TEST';
    const uri = /test|e2e/i.test(rawUri) ? rawUri : 'mongodb://127.0.0.1:27017/FOODHUB3_TEST';

    if (mongoose.connection.readyState !== 0 && !/test|e2e/i.test(mongoose.connection.name)) {
      await mongoose.disconnect();
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    const server = createServer(app);
    initSocket(server);

    // Mock IO emits
    const emitMock = vi.fn();
    const toMock = vi.fn().mockReturnValue({ emit: emitMock });
    vi.spyOn(getIO(), 'to').mockImplementation(toMock);

    // Create test participants
    ownerUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Lifecycle Owner',
      email: 'lifeowner@test.com',
      password: 'hash_password',
      roles: ['owner'],
    });
    await ownerUser.save();

    customerUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Lifecycle Customer',
      email: 'lifecustomer@test.com',
      password: 'hash_password',
      roles: ['user'],
    });
    await customerUser.save();

    partnerUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Lifecycle Partner',
      email: 'lifepartner@test.com',
      password: 'hash_password',
      roles: ['partner'],
    });
    await partnerUser.save();

    restaurant = new Restaurant({
      _id: new mongoose.Types.ObjectId(),
      ownerId: ownerUser._id,
      name: 'Lifecycle Kitchen',
      address: 'Indiranagar 100ft Road',
      city: 'Bangalore',
      phone: '9876543210',
      location: { lat: 12.9716, lng: 77.5946 },
      isOpen: true,
      cuisine: ['South Indian'],
    });
    await restaurant.save();

    partner = new DeliveryPartner({
      _id: new mongoose.Types.ObjectId(),
      userId: partnerUser._id,
      name: 'Lifecycle Partner',
      phone: '9123456789',
      status: 'assigned',
      vehicle: 'Electric Bike',
      currentLocation: { type: 'Point', coordinates: [77.585, 12.965] },
      completedDeliveries: 0,
    });
    await partner.save();
  });

  afterAll(async () => {
    vi.restoreAllMocks();

    for (const dId of createdDeliveryIds) {
      await Delivery.findByIdAndDelete(dId);
    }
    for (const oId of createdOrderIds) {
      await Order.findByIdAndDelete(oId);
    }
    if (partner) await DeliveryPartner.findByIdAndDelete(partner._id);
    if (restaurant) await Restaurant.findByIdAndDelete(restaurant._id);
    if (partnerUser) await User.findByIdAndDelete(partnerUser._id);
    if (customerUser) await User.findByIdAndDelete(customerUser._id);
    if (ownerUser) await User.findByIdAndDelete(ownerUser._id);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('1. Legal delivery progression: picked_up steps partner_assigned through arrived_pickup to satisfy state machine', async () => {
    const order = new Order({
      _id: new mongoose.Types.ObjectId(),
      userId: customerUser._id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      status: 'partner_assigned', // Order status is partner_assigned before pickup
      totalAmount: 350,
      deliveryAddress: 'Domlur Layout, Bangalore',
      items: [{ menuItemId: 'm1', name: 'Dosa', price: 350, quantity: 1 }],
    });
    await order.save();
    createdOrderIds.push(order._id);

    const delivery = new Delivery({
      _id: new mongoose.Types.ObjectId(),
      orderId: order._id,
      partnerId: partner._id,
      status: 'partner_assigned', // Currently partner_assigned, NOT yet arrived_pickup
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6408, 12.9784] },
      currentLocation: { type: 'Point', coordinates: [77.585, 12.965] },
      etaSeconds: 300,
      distanceRemainingMeters: 1500,
    });
    await delivery.save();
    createdDeliveryIds.push(delivery._id);

    // Transition order to picked_up via order.service
    const updatedOrder = await transitionOrderStatus(
      order._id.toString(),
      'picked_up',
      { id: ownerUser._id.toString(), role: 'owner' }
    );

    expect(updatedOrder.status).toBe('picked_up');

    // Invariant: Delivery record must step into arrived_pickup and then picked_up without Mongoose InvalidStateTransitionError
    const updatedDelivery = await Delivery.findById(delivery._id);
    expect(updatedDelivery).not.toBeNull();
    expect(updatedDelivery!.status).toBe('picked_up');
    expect(updatedDelivery!.timestamps?.pickedUpAt).toBeDefined();
  });

  it('2. Terminal-state safety: delivered order/delivery cannot be restarted or overwritten by simulator', async () => {
    const order = new Order({
      _id: new mongoose.Types.ObjectId(),
      userId: customerUser._id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      status: 'delivered',
      totalAmount: 280,
      deliveryAddress: 'Koramangala 4th Block',
      items: [{ menuItemId: 'm2', name: 'Idli', price: 280, quantity: 2 }],
    });
    await order.save();
    createdOrderIds.push(order._id);

    const terminalDelivery = new Delivery({
      _id: new mongoose.Types.ObjectId(),
      orderId: order._id,
      partnerId: partner._id,
      status: 'delivered', // Terminal status
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6408, 12.9784] },
      currentLocation: { type: 'Point', coordinates: [77.6408, 12.9784] },
      etaSeconds: 0,
      distanceRemainingMeters: 0,
    });
    await terminalDelivery.save();
    createdDeliveryIds.push(terminalDelivery._id);

    // Attempting to restart simulation on terminal delivery must refuse safely
    const simResult = await startDeliverySimulation(terminalDelivery._id.toString());
    expect(simResult.running).toBe(false);
    expect(simResult.started).toBe(false);
    expect(simResult.reason).toBe('terminal_status');

    // Assert database state remained untouched
    const freshDelivery = await Delivery.findById(terminalDelivery._id);
    expect(freshDelivery!.status).toBe('delivered');
  });

  it('3. Simulation start idempotency: duplicate concurrent start calls do not create competing simulator loops', async () => {
    const order = new Order({
      _id: new mongoose.Types.ObjectId(),
      userId: customerUser._id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      status: 'out_for_delivery',
      totalAmount: 420,
      deliveryAddress: 'Indiranagar 12th Main',
      items: [],
    });
    await order.save();
    createdOrderIds.push(order._id);

    const activeDelivery = new Delivery({
      _id: new mongoose.Types.ObjectId(),
      orderId: order._id,
      partnerId: partner._id,
      status: 'out_for_delivery',
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6408, 12.9784] },
      currentLocation: { type: 'Point', coordinates: [77.61, 12.974] },
      etaSeconds: 180,
      distanceRemainingMeters: 800,
    });
    await activeDelivery.save();
    createdDeliveryIds.push(activeDelivery._id);

    // Call startDeliverySimulation concurrently
    const [res1, res2] = await Promise.all([
      startDeliverySimulation(activeDelivery._id.toString()),
      startDeliverySimulation(activeDelivery._id.toString()),
    ]);

    // Both converge on running = true; exactly one starts the timer, the other deduplicates
    expect(res1.running).toBe(true);
    expect(res2.running).toBe(true);
    const startedCount = (res1.started ? 1 : 0) + (res2.started ? 1 : 0);
    expect(startedCount).toBe(1);
  });
});
