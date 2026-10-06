import express from 'express';
import { Server as HttpServer } from 'http';
import mongoose from 'mongoose';
import orderRoutes from '../order.routes';
import { Order } from '../order.model';
import { User } from '../../auth/auth.model';

async function runTest() {
  console.log('--- STARTING PHASE 5 ADMIN ORDERS TEST ---');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB2_TEST_DB';
  if (!mongoUri.includes('TEST')) {
    console.error('❌ FAIL FAST: The MongoDB URI does not contain "TEST". Aborting to prevent accidental data loss on dev DB.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to Test DB safely');

  await Order.deleteMany({});

  // Insert a mock order
  const orderId = new mongoose.Types.ObjectId();
  const order = new Order({
    _id: orderId,
    userId: new mongoose.Types.ObjectId().toString(),
    restaurantId: new mongoose.Types.ObjectId().toString(),
    restaurantName: 'Admin Test Rest',
    items: [{ menuItemId: new mongoose.Types.ObjectId().toString(), name: 'Test', price: 10, quantity: 1 }],
    totalAmount: 10,
    status: 'delivered', // Delivered order remains visible!
    deliveryAddress: '123 Test',
    paymentMethod: 'cash',
    paymentStatus: 'pending'
  });
  await order.save();

  // --- SETUP SERVER FOR ROUTE TESTING ---
  const app = express();
  app.use(express.json());

  let mockRoles: string[] = [];
  // Inject mock authentication bypassing JWT verification but executing role authorization
  // We will mock jwt.verify and User.findById to bypass auth securely for testing
  const jwt = require('jsonwebtoken');
  jwt.verify = () => ({ id: 'mocked-id' });

  const originalFindById = User.findById;
  User.findById = () => ({
    select: () => ({
      _id: new mongoose.Types.ObjectId(),
      email: 'test@test.com',
      roles: mockRoles,
      name: 'Test User'
    })
  }) as any;

  app.use((req, res, next) => {
    req.headers.authorization = 'Bearer test-token';
    next();
  });
  app.use('/orders', orderRoutes);

  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.statusCode || 500).json({ error: err.message, stack: err.stack });
  });

  const server = new HttpServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const port = (server.address() as any).port;

  // --- 1. Test Rejection: Non-admin ---
  console.log('Testing non-admin rejection...');
  mockRoles = ['user']; // Normal user
  const resRej = await fetch(`http://localhost:${port}/orders/all`);
  if (resRej.status !== 403) throw new Error(`Expected 403 Forbidden, got ${resRej.status}`);
  console.log('✅ Non-admin rejected correctly');

  // --- 2. Test Success: Admin ---
  console.log('Testing admin access...');
  mockRoles = ['admin'];
  const resSucc = await fetch(`http://localhost:${port}/orders/all`);
  if (resSucc.status !== 200) {
    const data = await resSucc.text();
    throw new Error(`Expected 200 OK, got ${resSucc.status}: ${data}`);
  }

  const responseJson: any = await resSucc.json();
  // We expect { success: true, message: 'All orders fetched', data: [...] } from sendSuccess wrapper
  if (!responseJson.success) throw new Error('Response wrapper indicates failure');
  if (!Array.isArray(responseJson.data)) throw new Error('Data payload is not an array');
  if (responseJson.data.length !== 1) throw new Error(`Expected 1 order, got ${responseJson.data.length}`);
  if (responseJson.data[0]._id !== orderId.toString()) throw new Error('Order ID mismatch');
  if (responseJson.data[0].status !== 'delivered') throw new Error('Order status mismatch, delivered order should be visible');

  console.log('✅ Admin visibility passed. Endpoint exists, authorization is intact, delivered order is visible, and wrapper shape is correct.');

  // Cleanup
  server.close();
  await mongoose.disconnect();
  console.log('All tests passed.');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
