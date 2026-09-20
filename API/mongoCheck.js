const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('FOODHUB2');
  
  const activeDel = await db.collection('deliveries').findOne({ status: { $in: ['assigned', 'on_delivery'] } });
  const activeOrder = await db.collection('orders').findOne({ status: { $ne: 'cancelled' } });
  const linkedPartner = await db.collection('deliverypartners').findOne({ userId: { $exists: true, $ne: null } });
  
  console.log('Active Delivery:', !!activeDel);
  console.log('Active Order:', !!activeOrder);
  console.log('Linked Partner:', !!linkedPartner);
  
  await client.close();
}

run().catch(console.error);
