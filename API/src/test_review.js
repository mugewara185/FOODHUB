const mongoose = require('mongoose');
const { Review } = require('./modules/reviews/review.model');
const { Order } = require('./modules/orders/order.model');
const { Restaurant } = require('./modules/restaurants/restaurant.model');
const { DeliveryPartner } = require('./modules/delivery/delivery-partner.model');
const { Delivery } = require('./modules/delivery/delivery.model');
const { User } = require('./modules/users/user.model'); // wait, auth.model?

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/zomato-clone');
  console.log('Connected to DB');
  
  // Find a delivered order
  const order = await Order.findOne({ status: 'delivered' });
  if (!order) { console.log('No delivered order'); return; }
  
  console.log('Found order', order._id);
  
  const req = {
    body: {
      orderId: order._id.toString(),
      restaurantRating: 5,
      partnerRating: 5,
      comment: 'Great'
    },
    user: {
      id: order.userId.toString(),
      roles: ['user']
    }
  };
  
  const res = {
    status: (code) => ({ json: (data) => console.log('res.status', code, data) }),
    json: (data) => console.log('res.json', data)
  };
  
  const next = (err) => console.log('next err', err);
  
  const { createReview } = require('./modules/reviews/review.controller');
  await createReview(req, res, next);
  
  process.exit(0);
}
run().catch(console.error);
