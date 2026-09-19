// link-test-partner.js
const { MongoClient, ObjectId } = require('mongodb');
// import { config } from '../src/config/env.ts'
// const config = require('../src/config/env.ts');

async function main() {
    // console.log('Connecting to MongoDB...', config.MONGO_URI);
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017/FOODHUB2', { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db();

  const userId = new ObjectId('6aad6084ed0930cf2320b59f');       // admin0
  const partnerId = new ObjectId('6aaa5854cef1bf6a6d5c0325');    // Kavitha Singh
    console.log('Linking partner', partnerId, 'to user', userId);
  // Add userId to the DeliveryPartner doc (even though the schema
  // doesn't have the field yet, MongoDB will accept it)
  await db.collection('deliverypartners').updateOne(
    { _id: partnerId },
    { $set: { userId: userId } }
  );

  console.log('Linked partner', partnerId, '-> user', userId);
  await client.close();
}

main();