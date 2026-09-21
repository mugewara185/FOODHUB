import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import mongoose from 'mongoose';
import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { updateDeliveryStatus } from './delivery.service';
import { initSocket } from '../../socket';

async function runTest() {
  console.log('--- STARTING S2 SOCKET ROUND-TRIP TEST ---');

  // 1. Setup HTTP and Socket.IO Server
  const httpServer = new HttpServer();
  initSocket(httpServer);
  
  await new Promise<void>((resolve) => httpServer.listen(() => resolve()));
  const port = (httpServer.address() as any).port;
  console.log(`Server listening on port ${port}`);

  // 2. Setup Client
  const clientSocket: ClientSocket = Client(`http://localhost:${port}`);
  await new Promise<void>((resolve) => {
    clientSocket.on('connect', resolve);
  });
  console.log(`Client connected with id ${clientSocket.id}`);

  // 3. Mock Mongoose Model Methods
  const mockDeliveryId = new mongoose.Types.ObjectId().toString();
  const mockOrderId = new mongoose.Types.ObjectId().toString();
  const mockPartnerId = new mongoose.Types.ObjectId().toString();

  const mockDeliveryDoc = {
    _id: mockDeliveryId,
    orderId: mockOrderId,
    partnerId: mockPartnerId,
    status: 'partner_assigned',
    timestamps: {},
    save: async function () { return this; }
  };

  const originalFindById = Delivery.findById;
  Delivery.findById = (id: string) => {
    if (id === mockDeliveryId) return mockDeliveryDoc as any;
    return null as any;
  };

  const originalPartnerFindById = DeliveryPartner.findById;
  DeliveryPartner.findById = (id: string) => {
    if (id === mockPartnerId) return {
      id: mockPartnerId,
      userId: 'mock-user-id',
      name: 'Mock Partner',
      phone: '+91 0000000000'
    } as any;
    return null as any;
  };

  // 4. Test Legal Transition & Emit
  let receivedPayload: any = null;
  clientSocket.emit('join_order_room', mockOrderId); // Client joins order room
  
  // Wait a tiny bit for room join to process
  await new Promise(r => setTimeout(r, 100));
  
  clientSocket.on('delivery:status', (payload) => {
    receivedPayload = payload;
  });

  console.log('Triggering updateDeliveryStatus(partner_assigned -> arrived_pickup)...');
  await updateDeliveryStatus(mockDeliveryId, 'arrived_pickup');

  // Wait for socket event
  await new Promise(r => setTimeout(r, 200));

  if (!receivedPayload) {
    console.error('❌ FAILED: No event received by client');
    process.exit(1);
  }

  if (receivedPayload.deliveryId === mockDeliveryId && 
      receivedPayload.orderId === mockOrderId && 
      receivedPayload.partnerId === mockPartnerId && 
      receivedPayload.status === 'arrived_pickup') {
    console.log('✅ PASS: Socket round-trip verified. Received valid delivery:status with payload:', receivedPayload);
  } else {
    console.error('❌ FAILED: Received invalid payload:', receivedPayload);
    process.exit(1);
  }

  // 5. Negative Assertion: Illegal Transition
  console.log('Triggering updateDeliveryStatus(arrived_pickup -> partner_assigned)... expecting failure & no emit');
  let illegalPayloadReceived = false;
  clientSocket.on('delivery:status', () => { illegalPayloadReceived = true; });
  
  try {
    await updateDeliveryStatus(mockDeliveryId, 'partner_assigned');
    console.error('❌ FAILED: Illegal transition did not throw an error');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ PASS: Illegal transition rejected: ${err.message}`);
  }

  // Wait to ensure no event sneaks in
  await new Promise(r => setTimeout(r, 200));
  if (illegalPayloadReceived) {
    console.error('❌ FAILED: Event was emitted despite illegal transition');
    process.exit(1);
  } else {
    console.log('✅ PASS: No event was emitted for illegal transition');
  }

  // Teardown
  clientSocket.disconnect();
  httpServer.close();
  Delivery.findById = originalFindById; // restore
  DeliveryPartner.findById = originalPartnerFindById; // restore
  console.log('--- TEST FINISHED SUCCESSFULLY ---');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
