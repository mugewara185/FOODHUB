const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/FOODHUB2');
  const db = mongoose.connection.db;

  console.log('--- Step 1 ---');
  const targetId = new mongoose.Types.ObjectId('6aaa5854cef1bf6a6d5c0325');
  const user = await db.collection('users').findOne({ _id: targetId });
  const partner = await db.collection('deliverypartners').findOne({ _id: targetId });
  
  if (user) {
    console.log('ID is a User:', { _id: user._id, name: user.name, email: user.email, roles: user.roles });
  } else if (partner) {
    console.log('ID is a DeliveryPartner:', partner);
  } else {
    console.log('ID found in NEITHER collection.');
  }

  // Also see if any deliveries have a partnerId to see what IDs they typically hold
  const someDelivery = await db.collection('deliveries').findOne({});
  if (someDelivery) {
    console.log('Found a delivery document, its partnerId is:', someDelivery.partnerId);
    if (someDelivery.partnerId) {
      const pUser = await db.collection('users').findOne({ _id: someDelivery.partnerId });
      const pPartner = await db.collection('deliverypartners').findOne({ _id: someDelivery.partnerId });
      if (pUser) console.log('Delivery partnerId belongs to User:', pUser.email);
      if (pPartner) console.log('Delivery partnerId belongs to DeliveryPartner:', pPartner.name);
    }
  } else {
    console.log('No delivery documents found.');
  }

  console.log('\n--- Step 2 ---');
  const partners = await db.collection('deliverypartners').find().limit(10).toArray();
  console.log(`Found ${partners.length} DeliveryPartner documents.`);
  for (const p of partners) {
    console.log(p);
  }

  console.log('\n--- Step 3 ---');
  const partnerUsers = await db.collection('users').find({ roles: 'delivery_partner' }).limit(10).toArray();
  console.log(`Found ${partnerUsers.length} Users with role 'delivery_partner'.`);
  for (const pu of partnerUsers) {
    console.log({ _id: pu._id, name: pu.name, email: pu.email, phone: pu.phone });
  }

  console.log('\n--- Step 4 ---');
  const orders = await db.collection('orders').find({ status: { $nin: ['cancelled', 'delivered'] } }).limit(5).toArray();
  console.log(`Found ${orders.length} eligible orders.`);
  for (const o of orders) {
    console.log({ _id: o._id, status: o.status, userId: o.userId, restaurantId: o.restaurantId, restaurantName: o.restaurantName, deliveryAddress: o.deliveryAddress });
  }

  console.log('\n--- Step 5 ---');
  if (orders.length > 0 && orders[0].restaurantId) {
    const restaurant = await db.collection('restaurants').findOne({ _id: orders[0].restaurantId });
    if (restaurant) {
      console.log('Restaurant location:', restaurant.location);
    } else {
      console.log('Restaurant not found for ID:', orders[0].restaurantId);
    }
  } else {
    console.log('No order or restaurantId to check.');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
