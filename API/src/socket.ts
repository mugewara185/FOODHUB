import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Clients can join rooms based on their user ID to receive private notifications
    socket.on('join_user_room', (userId) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined user room: ${userId}`);
    });

    // Clients can join specific order rooms to track an order directly
    socket.on('join_order_room', (orderId) => {
      socket.join(orderId);
      console.log(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    socket.on('join_admin_fleet', () => {
      socket.join('admin_fleet');
      console.log(`Socket ${socket.id} joined admin fleet room`);
    });

    socket.on('partner:location_updated', async (payload) => {
      // payload: { deliveryId, orderId, partnerId, location: { lat, lng } }
      try {
        const { toGeoJSON } = require('./utils/geo');
        const { Delivery } = require('./modules/delivery/delivery.model');
        const { DeliveryPartner } = require('./modules/delivery/delivery-partner.model');
        const { emitDeliveryLocation } = require('./modules/delivery/delivery.events');

        // 1. Persist to Delivery.currentLocation
        //    Convert { lat, lng } to GeoJSON via toGeoJSON from utils/geo.ts
        const geo = toGeoJSON(payload.location);
        await Delivery.updateOne(
          { _id: payload.deliveryId },
          { $set: { currentLocation: geo } }
        );

        // 2. Update DeliveryPartner.currentLocation
        await DeliveryPartner.updateOne(
          { _id: payload.partnerId },
          { $set: { currentLocation: geo } }
        );

        // 3. Broadcast
        emitDeliveryLocation(payload);
      } catch (err) {
        console.error('Socket partner:location_updated error:', err);
        // Log via existing logger, do not crash the socket
      }
    });
    // TODO: authenticate socket connection before trusting payload.partnerId.
    // Currently any client can spoof a partner location. Deferred.

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
