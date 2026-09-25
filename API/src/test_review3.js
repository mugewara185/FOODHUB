const mongoose = require('mongoose');
const { Review } = require('./modules/reviews/review.model');
const { Order } = require('./modules/orders/order.model');
const { Restaurant } = require('./modules/restaurants/restaurant.model');
const { DeliveryPartner } = require('./modules/delivery/delivery-partner.model');
const { Delivery } = require('./modules/delivery/delivery.model');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/zomato-clone');
  console.log('Connected to DB');
  
  let order = await Order.findOne();
  if (!order) { console.log('No order'); return; }
  
  order.status = 'delivered';
  await order.save();
  
  // also create delivery
  let delivery = await Delivery.findOne({ orderId: order._id });
  if (!delivery) {
     const partner = await DeliveryPartner.findOne();
     delivery = await Delivery.create({ orderId: order._id, partnerId: partner._id, pickupLocation: {lat:0, lng:0}, destinationLocation: {lat:0, lng:0}, status: 'delivered' });
  }

  // delete existing review
  await Review.deleteOne({ orderId: order._id });

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
  
  const next = (err) => console.log('next err', err.message);
  
  const { createReview } = require('./modules/reviews/review.controller');
  await createReview(req, res, next);
  
  process.exit(0);
}
run().catch(console.error);
