process.env.DEV_BYPASS_AUTH = 'false';
import mongoose from 'mongoose';
import express from 'express';
import { Server as HttpServer } from 'http';
import partnerRoutes from '../delivery.partner.routes';
import { Delivery } from '../delivery.model';
import { DeliveryPartner } from '../delivery-partner.model';
import { updateDeliveryStatus } from '../delivery.service';
import { Order } from '../../orders/order.model';

import { initSocket, getIO } from '../../../socket';

// We will spy on the real IO instance after initialization
let emittedEvents: Array<{ event: string; room?: string; payload: any }> = [];


async function runTest() {
  console.log('--- STARTING PHASE 4 PARTNER LIFECYCLE TEST ---');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB2_TEST_DB';
  if (!mongoUri.includes('TEST')) {
    console.error('❌ FAIL FAST: The MongoDB URI does not contain "TEST". Aborting to prevent accidental data loss on dev DB.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to Test DB safely');

  await Order.deleteMany({});
  await DeliveryPartner.deleteMany({});
  await Delivery.deleteMany({});

  // --- SETUP SERVER FOR ROUTE TESTING ---
  const app = express();
  app.use(express.json());

  let mockUserId: string = '';
  // Inject mock authentication
  app.use((req: any, res, next) => {
    req.user = { id: mockUserId, roles: ['partner'] };
    next();
  });
  app.use('/partner', partnerRoutes);

  app.use((err: any, req: any, res: any, next: any) => {
    res.status(500).json({ error: err.message, stack: err.stack });
  });

  const server = new HttpServer(app);
  initSocket(server);
  
  // Spy on real IO
  const io = getIO();
  const originalTo = io.to.bind(io);
  const originalEmit = io.emit.bind(io);
  
  io.to = (room: string) => {
    const broadcastOperator = originalTo(room);
    const originalBcastEmit = broadcastOperator.emit.bind(broadcastOperator);
    broadcastOperator.emit = (event: string, ...args: any[]) => {
      emittedEvents.push({ event, room, payload: args[0] });
      return originalBcastEmit(event, ...args);
    };
    return broadcastOperator;
  };
  
  io.emit = (event: string, ...args: any[]) => {
    emittedEvents.push({ event, payload: args[0] });
    return originalEmit(event, ...args);
  };

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const port = (server.address() as any).port;

  // --- 1. Setup ---
  process.env.DEV_BYPASS_AUTH = 'true';
  const partnerUserId = '64e8e50f3c5f4a1b8c1a9999';
  mockUserId = partnerUserId;

  const partner = new DeliveryPartner({
    userId: partnerUserId,
    name: 'Test Partner',
    phone: '1234567890',
    vehicle: 'Bike',
    rating: 5,
    status: 'available',
    currentLocation: { type: 'Point', coordinates: [0, 0] },
    completedDeliveries: 0
  });
  await partner.save();

  const order1 = new Order({
    userId: new mongoose.Types.ObjectId().toString(),
    restaurantId: new mongoose.Types.ObjectId().toString(),
    restaurantName: 'Test Rest',
    items: [{ menuItemId: new mongoose.Types.ObjectId().toString(), name: 'Test', price: 10, quantity: 1 }],
    totalAmount: 10,
    status: 'awaiting_partner',
    deliveryAddress: '123 Test',
    paymentMethod: 'cash',
    paymentStatus: 'pending'
  });
  await order1.save();

  // --- 2. Test Rejection: Non-awaiting_partner order ---
  console.log('Testing route rejection for non-awaiting_partner order...');
  const invalidOrder = new Order({ ...order1.toObject(), _id: new mongoose.Types.ObjectId(), status: 'preparing' });
  await invalidOrder.save();
  const resRej1 = await fetch(`http://localhost:${port}/partner/${invalidOrder._id}/accept`, { method: 'POST' });
  if (resRej1.status !== 409) throw new Error(`Expected 409, got ${resRej1.status}`);

  // --- 3. Test Rejection: Unavailable partner ---
  console.log('Testing route rejection for unavailable partner...');
  partner.status = 'offline';
  await partner.save();
  const resRej2 = await fetch(`http://localhost:${port}/partner/${order1._id}/accept`, { method: 'POST' });
  if (resRej2.status !== 400) throw new Error(`Expected 400, got ${resRej2.status}`);

  // Restore availability
  partner.status = 'available';
  await partner.save();

  // --- 4. Test Successful Accept Route ---
  console.log('Testing route successful accept...');
  emittedEvents = []; // clear
  const resAccept = await fetch(`http://localhost:${port}/partner/${order1._id}/accept`, { method: 'POST' });
  const acceptData: any = await resAccept.json();
  if (resAccept.status !== 200) throw new Error(`Expected 200, got ${resAccept.status}: ${JSON.stringify(acceptData)}`);

  const activeDeliveryId = acceptData.data._id;
  
  // Verify DB state
  const checkOrder = await Order.findById(order1._id);
  if (checkOrder?.status !== 'partner_assigned') throw new Error('Order not transitioned');
  const checkPartner = await DeliveryPartner.findById(partner._id);
  if (checkPartner?.status !== 'assigned') throw new Error('Partner not assigned');
  if (checkPartner?.currentAssignedDelivery?.toString() !== activeDeliveryId) throw new Error('Partner assigned ref incorrect');

  // Verify Events
  const orderStatusEvent = emittedEvents.find(e => e.event === 'order:status_changed' && e.payload.status === 'partner_assigned');
  if (!orderStatusEvent) throw new Error(`order:status_changed not emitted on accept. Events were: ${JSON.stringify(emittedEvents)}`);

  console.log('✅ Route-level Accept Flow PASSED!');

  // --- 5. Test Invalid Delivery Transition ---
  try {
    await updateDeliveryStatus(activeDeliveryId, 'picked_up');
    throw new Error('Should have rejected invalid transition');
  } catch (err: any) {
    if (err.name === 'InvalidStateTransitionError') console.log('✅ Invalid transition rejected correctly!');
    else throw err;
  }

  // --- 6. Test Valid Progression ---
  await updateDeliveryStatus(activeDeliveryId, 'arrived_pickup');
  await updateDeliveryStatus(activeDeliveryId, 'picked_up');
  await updateDeliveryStatus(activeDeliveryId, 'out_for_delivery');
  console.log('✅ Direct path out_for_delivery PASSED!');

  // Test optional 'nearby' node
  await updateDeliveryStatus(activeDeliveryId, 'nearby');
  console.log('✅ Alternative path nearby PASSED!');

  // --- 7. Test Terminal Completion (delivered) ---
  emittedEvents = [];
  await updateDeliveryStatus(activeDeliveryId, 'delivered');

  const finalOrder = await Order.findById(order1._id);
  if (finalOrder?.status !== 'delivered') throw new Error('Order not delivered');

  const finalPartner = await DeliveryPartner.findById(partner._id);
  if (finalPartner?.status !== 'available') throw new Error('Partner not released');
  if (finalPartner?.currentAssignedDelivery) throw new Error('Partner ref not cleared');
  if (finalPartner?.completedDeliveries !== 1) throw new Error('completedDeliveries not incremented');

  const deliveryEvent = emittedEvents.find(e => e.event === 'order:status_changed' && e.payload.status === 'delivered');
  if (!deliveryEvent) throw new Error('order:status_changed delivered not emitted');
  console.log('✅ Terminal completion & partner release PASSED!');

  // --- 8. Test Subsequent Assignment ---
  console.log('Testing subsequent assignment...');
  const order2 = new Order({
    ...order1.toObject(),
    _id: new mongoose.Types.ObjectId(),
    status: 'awaiting_partner'
  });
  await order2.save();

  const resAccept2 = await fetch(`http://localhost:${port}/partner/${order2._id}/accept`, { method: 'POST' });
  if (resAccept2.status !== 200) throw new Error(`Second assignment failed with ${resAccept2.status}`);

  const checkPartner2 = await DeliveryPartner.findById(partner._id);
  if (checkPartner2?.status !== 'assigned') throw new Error('Partner not assigned on second order');
  if (!checkPartner2?.currentAssignedDelivery) throw new Error('Partner missing active delivery on second order');
  
  console.log('✅ Subsequent assignment PASSED!');

  // Cleanup
  server.close();
  await mongoose.disconnect();
  console.log('All tests passed.');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
