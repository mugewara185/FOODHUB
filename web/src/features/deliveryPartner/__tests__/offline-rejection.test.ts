import { setPartnerStatus } from '../../../../../API/src/modules/delivery/delivery.service';
import { DeliveryPartner } from '../../../../../API/src/modules/delivery/delivery-partner.model';
import mongoose from '../../../../../API/node_modules/mongoose';

async function runTest() {
  console.log('--- STARTING OFFLINE REJECTION TEST ---');

  // Mock Mongoose Document
  const mockPartnerId = new mongoose.Types.ObjectId().toString();
  
  const mockPartnerDoc = {
    _id: mockPartnerId,
    status: 'assigned', // Critical: Partner is currently ON_DELIVERY / assigned
    save: async function () { return this; }
  };

  const originalFindById = DeliveryPartner.findById;
  DeliveryPartner.findById = (id: string) => {
    if (id === mockPartnerId) return mockPartnerDoc as any;
    return null as any;
  };

  try {
    console.log(`Attempting to set partner ${mockPartnerId} offline while status is 'assigned'...`);
    await setPartnerStatus(mockPartnerId, 'offline');
    console.error('❌ FAILED: The backend service allowed an illegal transition to OFFLINE while on delivery.');
    process.exit(1);
  } catch (err: any) {
    if (err.message.includes('Cannot go offline while on delivery')) {
      console.log(`✅ PASS: Authoritative service rejected illegal offline request: "${err.message}"`);
    } else {
      console.error(`❌ FAILED: Unexpected error message: ${err.message}`);
      process.exit(1);
    }
  } finally {
    // Restore
    DeliveryPartner.findById = originalFindById;
  }
}

runTest().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
