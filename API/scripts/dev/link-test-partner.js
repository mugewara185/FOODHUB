require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB2';
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const partnerId = new mongoose.Types.ObjectId('6aaa5854cef1bf6a6d5c0325'); // Kavitha Singh
    const userId = new mongoose.Types.ObjectId('6aad6084ed0930cf2320b59f');    // admin0

    const result = await db.collection('deliverypartners').updateOne(
      { _id: partnerId },
      { $set: { userId: userId } }
    );

    if (result.matchedCount === 0) {
      console.error(`Partner ${partnerId} not found.`);
      process.exit(1);
    }

    if (result.modifiedCount > 0) {
      console.log(`Successfully linked Partner ${partnerId} to User ${userId}.`);
    } else {
      console.log(`Partner ${partnerId} is already linked to User ${userId}.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
}

run();
