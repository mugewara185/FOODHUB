import express from 'express';
import { Server as HttpServer } from 'http';
import mongoose from 'mongoose';
import { initSocket, getIO } from '../socket';

// Models
import { Order } from '../modules/orders/order.model';
import { Delivery } from '../modules/delivery/delivery.model';
import { DeliveryPartner } from '../modules/delivery/delivery-partner.model';
import { Restaurant } from '../modules/restaurants/restaurant.model';
import { User } from '../modules/auth/auth.model';

// Routes
import orderRoutes from '../modules/orders/order.routes';
import deliveryPartnerRoutes from '../modules/delivery/delivery.partner.routes';
import deliveryRoutes from '../modules/delivery/delivery.routes';
import { protect, authorize } from '../shared/middleware/auth.middleware';

// Services
import { updateDeliveryStatus } from '../modules/delivery/delivery.service';

async function runE2E() {
  console.log('--- STARTING MULTI-ACTOR APPLICATION E2E VERIFICATION (AUTOMATED INTEGRATION) ---');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB2_TEST_DB';
  if (!mongoUri.includes('TEST')) {
    console.error('❌ FAIL FAST: The MongoDB URI does not contain "TEST". Aborting.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to Test DB');

  // Clear relevant collections
  await Order.deleteMany({});
  await Delivery.deleteMany({});
  await DeliveryPartner.deleteMany({});
  await Restaurant.deleteMany({});
  
  // Set up actors
  const customerId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();
  const partnerId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  // Create Restaurant for owner
  const restaurant = new Restaurant({
    _id: new mongoose.Types.ObjectId(),
    ownerId: ownerId.toString(),
    name: 'E2E Test Restaurant',
    cuisine: ['Test'],
    address: '123 Test St',
    city: 'Test City',
    location: { lat: 12.9716, lng: 77.5946 },
    phone: '9999999999',
    menu: [
      { _id: new mongoose.Types.ObjectId(), name: 'Test Burger', price: 150, category: 'Food', isAvailable: true }
    ],
    rating: 5,
    totalRatings: 1,
    isOpen: true
  });
  await restaurant.save();

  // Create Partner profile
  const partnerProfile = new DeliveryPartner({
    _id: new mongoose.Types.ObjectId(),
    userId: partnerId.toString(),
    name: 'E2E Partner',
    phone: '9999999999',
    vehicle: 'Bike',
    status: 'available',
    completedDeliveries: 0,
    currentLocation: { type: 'Point', coordinates: [77.5946, 12.9716] }
  });
  await partnerProfile.save();

  // Express Setup
  const app = express();
  app.use(express.json());

  // Mock dev bypass to read identities from headers
  app.use((req: any, res, next) => {
    const overrideId = req.headers['x-dev-bypass-user-id'];
    const overrideRole = req.headers['x-dev-bypass-role'];
    if (overrideId && overrideRole) {
      req.user = { id: overrideId, roles: [overrideRole], email: 'test@test.com' };
    }
    next();
  });

  app.use('/orders', orderRoutes);
  app.use('/partner', deliveryPartnerRoutes);
  app.use('/deliveries', deliveryRoutes);

  const server = new HttpServer(app);
  
  // Intercept sockets natively
  const emittedEvents: Array<{ event: string; room?: string; payload: any }> = [];
  initSocket(server);
  const io = getIO();
  const originalTo = io.to.bind(io);
  io.to = (room: string) => {
    const broadcastOperator = originalTo(room);
    const originalBcastEmit = broadcastOperator.emit.bind(broadcastOperator);
    broadcastOperator.emit = (event: string, ...args: any[]) => {
      emittedEvents.push({ event, room, payload: args[0] });
      return originalBcastEmit(event, ...args);
    };
    return broadcastOperator;
  };

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const port = (server.address() as any).port;
  
  const fetchAs = async (path: string, method: string, actorId: mongoose.Types.ObjectId, role: string, body?: any) => {
    const res = await fetch(`http://localhost:${port}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-dev-bypass-user-id': actorId.toString(),
        'x-dev-bypass-role': role
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, data: (await res.json()) as any };
  };

  // ---------------------------------------------------------
  // ACT 1: CUSTOMER CREATES ORDER
  // ---------------------------------------------------------
  console.log('1. Customer placing order...');
  const orderRes = await fetchAs('/orders', 'POST', customerId, 'user', {
    restaurantId: restaurant._id.toString(),
    items: [{ menuItemId: (restaurant.menu[0] as any)._id.toString(), name: 'Test Burger', price: 150, quantity: 2 }],
    deliveryAddress: '456 Delivery Ave'
  });
  if (orderRes.status !== 201) throw new Error(`Order creation failed: ${JSON.stringify(orderRes.data)}`);
  
  const orderId = orderRes.data.data._id;
  console.log(`✅ Order created successfully: ${orderId}`);

  // ---------------------------------------------------------
  // ACT 2: OWNER ACCEPTS AND PROGRESSES
  // ---------------------------------------------------------
  console.log('2. Owner fetching and accepting order...');
  const ownerOrdersRes = await fetchAs('/orders/owned', 'GET', ownerId, 'owner');
  if (ownerOrdersRes.status !== 200) throw new Error(`Owner fetch failed: ${JSON.stringify(ownerOrdersRes.data)}`);
  
  const acceptRes = await fetchAs(`/orders/${orderId}/accept`, 'PATCH', ownerId, 'owner');
  if (acceptRes.status !== 200) throw new Error(`Accept failed: ${JSON.stringify(acceptRes.data)}`);
  
  const prepRes = await fetchAs(`/orders/${orderId}/preparing`, 'PATCH', ownerId, 'owner');
  if (prepRes.status !== 200) throw new Error(`Prep failed: ${JSON.stringify(prepRes.data)}`);

  const readyRes = await fetchAs(`/orders/${orderId}/ready`, 'PATCH', ownerId, 'owner');
  if (readyRes.status !== 200) throw new Error(`Ready failed: ${JSON.stringify(readyRes.data)}`);
  
  console.log(`✅ Owner successfully processed order to ready_for_pickup`);

  // Assert Socket Events for Customer tracking
  const customerEvents = emittedEvents.filter(e => e.room === customerId.toString());
  if (!customerEvents.find(e => e.payload.status === 'confirmed')) throw new Error('Customer did not get confirmed event');
  if (!customerEvents.find(e => e.payload.status === 'ready_for_pickup')) throw new Error('Customer did not get ready event');
  console.log(`✅ Customer received realtime Owner updates`);

  // ---------------------------------------------------------
  // ACT 3: PARTNER ACCEPTS AND DELIVERS
  // ---------------------------------------------------------
  console.log('3. Partner lifecycle...');
  
  const partnerAcceptRes = await fetchAs(`/partner/${orderId}/accept`, 'POST', partnerId, 'partner');
  if (partnerAcceptRes.status !== 200) throw new Error(`Partner accept failed: ${JSON.stringify(partnerAcceptRes.data)}`);

  const deliveryId = partnerAcceptRes.data.data._id;

  // Use the patch status route
  const arrivedRes = await fetchAs(`/deliveries/${deliveryId}/status`, 'PATCH', partnerId, 'partner', { status: 'arrived_pickup' });
  const pickedRes = await fetchAs(`/deliveries/${deliveryId}/status`, 'PATCH', partnerId, 'partner', { status: 'picked_up' });
  const outRes = await fetchAs(`/deliveries/${deliveryId}/status`, 'PATCH', partnerId, 'partner', { status: 'out_for_delivery' });
  const deliverRes = await fetchAs(`/deliveries/${deliveryId}/status`, 'PATCH', partnerId, 'partner', { status: 'delivered' });
  
  if (deliverRes.status !== 200) throw new Error(`Terminal delivery failed: ${JSON.stringify(deliverRes.data)}`);
  console.log(`✅ Partner successfully executed state machine to delivered`);

  // Verify Partner Release
  const refreshedPartner = await DeliveryPartner.findById(partnerProfile._id);
  if (refreshedPartner?.status !== 'available') throw new Error('Partner not returned to available');
  if (refreshedPartner?.completedDeliveries !== 1) throw new Error('Partner completed deliveries not incremented');
  
  // Verify Order Status
  const finalOrder = await Order.findById(orderId);
  if (finalOrder?.status !== 'delivered') throw new Error('Order not marked delivered');
  
  // Assert Customer Realtime
  const customerEventsEnd = emittedEvents.filter(e => e.room === customerId.toString());
  if (!customerEventsEnd.find(e => e.payload.status === 'out_for_delivery')) throw new Error('Customer did not get out_for_delivery');
  if (!customerEventsEnd.find(e => e.payload.status === 'delivered')) throw new Error('Customer did not get delivered');
  console.log(`✅ Customer received realtime Partner updates`);

  // ---------------------------------------------------------
  // ACT 4: ADMIN VERIFICATION
  // ---------------------------------------------------------
  console.log('4. Admin verifying visibility...');
  const adminRes = await fetchAs(`/orders/all`, 'GET', adminId, 'admin');
  if (adminRes.status !== 200) throw new Error(`Admin fetch failed: ${JSON.stringify(adminRes.data)}`);
  
  const foundOrder = adminRes.data.data.find((o: any) => o._id === orderId.toString());
  if (!foundOrder) throw new Error('Admin could not see the E2E order');
  if (foundOrder.status !== 'delivered') throw new Error('Admin sees wrong status');
  console.log(`✅ Admin perfectly retrieved terminal E2E order`);

  console.log('\n✅✅✅ FULL MULTI-ACTOR APPLICATION LIFECYCLE VERIFIED SUCCESSFULLY ✅✅✅');

  server.close();
  await mongoose.disconnect();
}

runE2E().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
