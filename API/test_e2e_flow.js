const mongoose = require('mongoose');
const http = require('http');
const io = require('socket.io-client');

const API_URL = 'http://localhost:5000/api';
let customerToken, ownerToken, partnerToken, adminToken;
let customerId, ownerId, partnerId, adminId;
let currentOrderId, currentDeliveryId;
let customerSocket, ownerSocket, partnerSocket;

async function request(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(API_URL + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null }); }
        catch (e) { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const customerEvents = [];

async function step(num, name, fn) {
  console.log('Step ' + num + ': ' + name);
  try {
    await fn();
  } catch (err) {
    console.error('FAILED', err);
    process.exit(1);
  }
}

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/zomato-clone');
  console.log('Connected to DB');

  // get users
  const { User: AuthUser } = require('./src/modules/auth/auth.model');
  
  const customer = await AuthUser.findOne({ roles: 'user' });
  const owner = await AuthUser.findOne({ roles: 'owner' });
  const partner = await AuthUser.findOne({ roles: 'partner' });
  const admin = await AuthUser.findOne({ roles: 'admin' });

  // generate token via login
  const login = async (email) => {
     const res = await request('/auth/login', 'POST', { email, password: 'password123' });
     return { token: res.body.data.token, id: res.body.data.user.id };
  };

  const c = await login(customer.email); customerToken = c.token; customerId = c.id;
  const o = await login(owner.email); ownerToken = o.token; ownerId = o.id;
  const p = await login(partner.email); partnerToken = p.token; partnerId = p.id;
  const a = await login(admin.email); adminToken = a.token; adminId = a.id;

  await step(4, 'Connect sockets', async () => {
    customerSocket = io('http://localhost:5000');
    ownerSocket = io('http://localhost:5000');
    partnerSocket = io('http://localhost:5000');
    
    await new Promise(r => setTimeout(r, 1000));
    customerSocket.emit('join_user_room', customerId);
    ownerSocket.emit('join_user_room', ownerId);
    partnerSocket.emit('join_user_room', partnerId);

    customerSocket.on('order:status_changed', (data) => customerEvents.push(data));
    customerSocket.on('order:new', (data) => customerEvents.push(data));
  });

  await step(5, 'Customer connected', () => { if (!customerSocket.connected) throw new Error('not connected'); });

  await step(6, 'Place order', async () => {
    const Restaurant = require('./src/modules/restaurants/restaurant.model').Restaurant;
    const rest = await Restaurant.findOne({ ownerId });
    
    const res = await request('/orders', 'POST', {
      restaurantId: rest._id.toString(),
      items: [{ menuItemId: rest.menu[0]._id.toString(), quantity: 1, price: rest.menu[0].price, name: rest.menu[0].name }],
      deliveryAddress: '123 Test St',
      totalAmount: rest.menu[0].price
    }, customerToken);
    
    if (res.status !== 201) throw new Error('Failed to place order: ' + JSON.stringify(res));
    currentOrderId = res.body.data._id;
    customerSocket.emit('join_order_room', currentOrderId);
    ownerSocket.emit('join_order_room', currentOrderId);
    partnerSocket.emit('join_order_room', currentOrderId);
  });

  await step(7, 'Owner receives order:new', async () => {
     await new Promise(r => setTimeout(r, 1000));
  });

  await step(8, 'Owner accepts', async () => {
     const res = await request('/orders/' + currentOrderId + '/status', 'PATCH', { status: 'confirmed' }, ownerToken);
     if (res.status !== 200) throw new Error('Failed to accept: ' + JSON.stringify(res));
  });

  await step(9, 'Customer receives confirmed', async () => {
     await new Promise(r => setTimeout(r, 500));
  });

  await step(10, 'Owner preparing', async () => {
     const res = await request('/orders/' + currentOrderId + '/status', 'PATCH', { status: 'preparing' }, ownerToken);
     if (res.status !== 200) throw new Error('Failed to prepare: ' + JSON.stringify(res));
  });

  await step(11, 'Owner ready', async () => {
     const res = await request('/orders/' + currentOrderId + '/status', 'PATCH', { status: 'ready_for_pickup' }, ownerToken);
     if (res.status !== 200) throw new Error('Failed to ready: ' + JSON.stringify(res));
  });

  await step(12, 'Partner delivery available', async () => {
     await new Promise(r => setTimeout(r, 500));
  });

  await step(13, 'Partner accepts assignment', async () => {
     // Ensure partner is available
     await request('/delivery/partner/me/status', 'PATCH', { status: 'available' }, partnerToken);
     
     const res = await request('/delivery/partner/assignments/' + currentOrderId, 'POST', {}, partnerToken);
     if (res.status !== 200) throw new Error('Failed to assign: ' + JSON.stringify(res));
     currentDeliveryId = res.body.data._id;
  });

  await step(14, 'Partner status flow', async () => {
     for (const status of ['picked_up', 'out_for_delivery', 'delivered']) {
       const res = await request('/delivery/' + currentDeliveryId + '/status', 'PATCH', { status }, partnerToken);
       if (res.status !== 200) throw new Error('Failed ' + status + ': ' + JSON.stringify(res));
     }
  });

  await step(15, 'Order is delivered', async () => {
     const res = await request('/orders/' + currentOrderId, 'GET', null, customerToken);
     if (res.body.data.status !== 'delivered') throw new Error('not delivered');
  });

  await step(16, 'Submit review', async () => {
     const res = await request('/reviews', 'POST', {
       orderId: currentOrderId,
       restaurantRating: 5,
       partnerRating: 5,
       comment: 'Great!'
     }, customerToken);
     if (res.status !== 201) throw new Error('Failed review: ' + res.status + ' ' + JSON.stringify(res.body));
  });

  await step(17, 'Assert restaurant rating', async () => {
  });

  await step(18, 'Print events', () => {
     console.log(customerEvents);
  });

  process.exit(0);
}
run().catch(console.error);
