import { Server as HttpServer } from 'http';
import express from 'express';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import mongoose from 'mongoose';
import { initSocket } from '../../../socket';
import devRoutes from '../dev.routes';
import { Delivery } from '../../delivery/delivery.model';
import { DeliveryPartner } from '../../delivery/delivery-partner.model';

async function runTest() {
  console.log('--- STARTING DEV ENDPOINT SOCKET TEST ---');

  // Connect to test DB (or local dev DB)
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB2';
  await mongoose.connect(mongoUri);
  console.log('Connected to DB');

  // Setup Express, HTTP and Socket.IO Server
  const app = express();
  app.use(express.json());
  app.use('/api/dev', devRoutes);

  const httpServer = new HttpServer(app);
  initSocket(httpServer);
  
  await new Promise<void>((resolve) => httpServer.listen(() => resolve()));
  const port = (httpServer.address() as any).port;
  console.log(`Server listening on port ${port}`);

  const partnerUserId = '6aad6084ed0930cf2320b59f'; // admin0 from backfill
  const orderId = '6aaa5854ff940430bb4a64b9'; // Eligible order from DB

  // Setup Client
  const clientSocket: ClientSocket = Client(`http://localhost:${port}`);
  await new Promise<void>((resolve) => {
    clientSocket.on('connect', resolve);
  });
  console.log(`Client connected with id ${clientSocket.id}`);

  // Join User Room
  clientSocket.emit('join_user_room', partnerUserId);
  await new Promise((r) => setTimeout(r, 200)); // wait for join

  let receivedPayload: any = null;
  clientSocket.on('delivery:assigned', (payload) => {
    receivedPayload = payload;
  });

  // Execute test POST request using fetch
  console.log('Executing POST /api/dev/assign-partner');
  const response = await fetch(`http://localhost:${port}/api/dev/assign-partner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, partnerUserId })
  });
  
  const resData = await response.json();
  console.log('Response:', response.status, resData);

  if (response.status !== 200) {
    console.error('Test failed: non-200 response');
    process.exit(1);
  }

  // Wait for socket event
  await new Promise((r) => setTimeout(r, 500));

  if (!receivedPayload) {
    console.error('Test failed: Did not receive delivery:assigned event on partnerUserId room');
    process.exit(1);
  }

  console.log('Received delivery:assigned payload:', receivedPayload);

  // Assertions
  if (receivedPayload.orderId !== orderId) throw new Error('orderId mismatch');
  if (receivedPayload.partnerUserId !== partnerUserId) throw new Error('partnerUserId mismatch');
  if (receivedPayload.status !== 'partner_assigned') throw new Error('status mismatch');

  // DB Checks
  const delivery = await Delivery.findById(receivedPayload.deliveryId);
  if (!delivery) throw new Error('Delivery not saved to DB');
  if (delivery.status !== 'partner_assigned') throw new Error('Delivery status is not assigned in DB');
  
  const partner = await DeliveryPartner.findOne({ userId: partnerUserId });
  if (partner?.status !== 'on_delivery') throw new Error('Partner status is not on_delivery');
  if (partner?.currentAssignedDelivery?.toString() !== delivery._id.toString()) throw new Error('Partner currentAssignedDelivery mismatch');

  console.log('✅ Main success flow PASSED!');

  console.log('Testing negative cases...');
  // 404 test
  const res404 = await fetch(`http://localhost:${port}/api/dev/assign-partner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: new mongoose.Types.ObjectId().toString(), partnerUserId })
  });
  if (res404.status !== 404) throw new Error('Expected 404 for unknown order');
  console.log('✅ 404 case PASSED!');

  // 403 test (production)
  process.env.NODE_ENV = 'production';
  const res403 = await fetch(`http://localhost:${port}/api/dev/assign-partner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, partnerUserId })
  });
  if (res403.status !== 403) throw new Error('Expected 403 for production env');
  console.log('✅ 403 production case PASSED!');
  process.env.NODE_ENV = 'development'; // restore

  // Cleanup
  console.log('Cleaning up...');
  await Delivery.findByIdAndDelete(delivery._id);
  if (partner) {
    partner.status = 'assigned'; // restore to old state
    partner.currentAssignedDelivery = '6aaaa2eae628f03f4c2dbf6b' as any; // restore old active delivery
    await partner.save();
  }

  clientSocket.disconnect();
  httpServer.close();
  await mongoose.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});


