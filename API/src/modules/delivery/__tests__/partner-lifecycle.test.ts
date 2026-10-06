import mongoose from 'mongoose';
import { Delivery } from '../delivery.model';
import { DeliveryPartner } from '../delivery-partner.model';
import { updateDeliveryStatus } from '../delivery.service';
import { Order } from '../../orders/order.model';
import { transitionOrderStatus } from '../../orders/order.service';
import { Server as HttpServer } from 'http';
import { initSocket } from '../../../socket';

const httpServer = new HttpServer();
initSocket(httpServer);

async function runTest() {
  console.log('--- STARTING PHASE 4 PARTNER LIFECYCLE TEST ---');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB2_TEST_DB';
  await mongoose.connect(mongoUri);
  console.log('Connected to Test DB');

  // Clear test DB
  await Order.deleteMany({});
  await DeliveryPartner.deleteMany({});
  await Delivery.deleteMany({});

  // 1. Setup mock order and partner
  const order = new Order({
    userId: new mongoose.Types.ObjectId(),
    restaurantId: new mongoose.Types.ObjectId(),
    restaurantName: 'Test Rest',
    items: [{ menuItemId: new mongoose.Types.ObjectId().toString(), name: 'Test', price: 10, quantity: 1 }],
    totalAmount: 10,
    status: 'awaiting_partner',
    deliveryAddress: '123 Test',
    paymentMethod: 'cash',
    paymentStatus: 'pending'
  });
  await order.save();

  const partner = new DeliveryPartner({
    userId: new mongoose.Types.ObjectId(),
    name: 'Test Partner',
    phone: '1234567890',
    vehicle: 'Bike',
    rating: 5,
    status: 'available',
    currentLocation: { type: 'Point', coordinates: [0, 0] }
  });
  await partner.save();

  console.log('Setup complete. Testing accept flow...');

  // 2. Simulate Accept Flow (what delivery.partner.routes.ts does)
  // Check if partner is available
  if (partner.status !== 'available') throw new Error('Partner not available');

  const fetchedOrder = await Order.findOne({ _id: order._id, status: 'awaiting_partner' });
  if (!fetchedOrder) throw new Error('Order not awaiting_partner');

  // Transition order canonically
  const updatedOrder = await transitionOrderStatus(order._id.toString(), 'partner_assigned', {
    id: partner.userId.toString(),
    role: 'system'
  });

  const delivery = new Delivery({
    orderId: updatedOrder._id,
    partnerId: partner._id,
    status: 'partner_assigned',
    pickupLocation: partner.currentLocation,
    destinationLocation: partner.currentLocation
  });
  await delivery.save();

  partner.status = 'assigned';
  partner.currentAssignedDelivery = delivery._id as any;
  await partner.save();

  // Validate state after accept
  const checkPartner = await DeliveryPartner.findById(partner._id);
  if (checkPartner?.status !== 'assigned') throw new Error('Partner status not assigned');
  if (checkPartner?.currentAssignedDelivery?.toString() !== delivery._id.toString()) throw new Error('currentAssignedDelivery missing');

  console.log('✅ Accept flow PASSED!');

  // 3. Test Invalid Transition (partner_assigned -> picked_up without arrived_pickup)
  console.log('Testing invalid delivery transition...');
  try {
    await updateDeliveryStatus(delivery._id.toString(), 'picked_up');
    throw new Error('Should have rejected invalid transition');
  } catch (err: any) {
    if (err.name === 'InvalidStateTransitionError') {
      console.log('✅ Invalid transition rejected correctly!');
    } else {
      throw err;
    }
  }

  // 4. Test Valid Progression
  console.log('Testing valid delivery progression...');
  await updateDeliveryStatus(delivery._id.toString(), 'arrived_pickup');
  await updateDeliveryStatus(delivery._id.toString(), 'picked_up');
  await updateDeliveryStatus(delivery._id.toString(), 'out_for_delivery');
  
  const checkDelivery = await Delivery.findById(delivery._id);
  if (checkDelivery?.status !== 'out_for_delivery') throw new Error('Delivery status incorrect');

  console.log('✅ Valid progression PASSED!');

  // 5. Test Terminal Completion (out_for_delivery -> delivered)
  console.log('Testing partner release upon completion...');
  await updateDeliveryStatus(delivery._id.toString(), 'delivered');

  const finalDelivery = await Delivery.findById(delivery._id);
  if (finalDelivery?.status !== 'delivered') throw new Error('Delivery not delivered');

  const finalOrder = await Order.findById(order._id);
  if (finalOrder?.status !== 'delivered') throw new Error('Order not delivered');

  const finalPartner = await DeliveryPartner.findById(partner._id);
  if (finalPartner?.status !== 'available') throw new Error('Partner not released to available');
  if (finalPartner?.currentAssignedDelivery) throw new Error('Partner assignedDelivery not cleared');
  if ((finalPartner as any).completedDeliveries !== 1) throw new Error('Completed deliveries not incremented');

  console.log('✅ Partner release PASSED!');

  // Cleanup
  await mongoose.disconnect();
  console.log('All tests passed.');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
