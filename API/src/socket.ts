import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

import { isOriginAllowed } from './config/corsOrigin';
import { config } from './config/env';
import { User } from './modules/auth/auth.model';
import { Order } from './modules/orders/order.model';
import { Restaurant } from './modules/restaurants/restaurant.model';
import { Delivery } from './modules/delivery/delivery.model';
import { DeliveryPartner } from './modules/delivery/delivery-partner.model';
import { emitDeliveryLocation } from './modules/delivery/delivery.events';
import { toGeoJSON } from './utils/geo';

let io: Server;

export interface SocketUser {
  id: string;
  email: string;
  roles: string[];
  name?: string;
}

export async function resolveSocketUser(socket: Socket, payloadAuth?: any): Promise<SocketUser | null> {
  const isDev = config.nodeEnv === 'development' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  const bypassHeader = socket.handshake?.headers?.['x-dev-bypass-auth'] === 'true' ||
                       socket.handshake?.auth?.devBypass === true ||
                       payloadAuth?.devBypass === true ||
                       process.env.DEV_BYPASS_AUTH === 'true';

  const bypassUserId = (socket.handshake?.headers?.['x-dev-bypass-user-id'] as string) ||
                       socket.handshake?.auth?.userId ||
                       payloadAuth?.userId;

  const bypassRole = (socket.handshake?.headers?.['x-dev-bypass-role'] as string) ||
                     socket.handshake?.auth?.role ||
                     payloadAuth?.role;

  if (isDev && bypassHeader && bypassUserId) {
    try {
      const dbUser = await User.findById(bypassUserId).select('-password');
      if (dbUser) {
        return {
          id: dbUser._id.toString(),
          email: dbUser.email,
          roles: dbUser.roles || [bypassRole || 'user'],
          name: dbUser.name
        };
      }
    } catch {}
    return {
      id: bypassUserId,
      email: 'dev@zom2.local',
      roles: bypassRole ? [bypassRole] : ['user', 'admin', 'owner', 'partner'],
      name: 'Dev User'
    };
  }

  let token = socket.handshake?.auth?.token ||
              payloadAuth?.token ||
              (socket.handshake?.query?.token as string);

  if (!token && socket.handshake?.headers?.authorization?.startsWith('Bearer ')) {
    token = socket.handshake.headers.authorization.split(' ')[1];
  }

  if (token && token !== 'dummy') {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        return {
          id: user._id.toString(),
          email: user.email,
          roles: user.roles,
          name: user.name
        };
      }
    } catch (err) {
      // invalid token
    }
  }

  if (isDev && bypassUserId) {
    try {
      const dbUser = await User.findById(bypassUserId).select('-password');
      if (dbUser) {
        return {
          id: dbUser._id.toString(),
          email: dbUser.email,
          roles: dbUser.roles || [bypassRole || 'user'],
          name: dbUser.name
        };
      }
    } catch {}
    return {
      id: bypassUserId,
      email: 'dev@zom2.local',
      roles: bypassRole ? [bypassRole] : ['user', 'admin', 'owner', 'partner'],
      name: 'Dev User'
    };
  }

  return null;
}

export async function isUserAuthorizedForOrder(user: SocketUser | null, orderId: string): Promise<boolean> {
  if (!user || !orderId) return false;
  if (user.roles.includes('admin')) return true;

  try {
    const order = await Order.findById(orderId).select('userId restaurantId');
    if (!order) return false;

    // Customer ownership
    if (order.userId?.toString() === user.id) return true;

    // Restaurant owner check
    if (user.roles.includes('owner')) {
      const restaurant = await Restaurant.findById(order.restaurantId).select('ownerId');
      if (restaurant?.ownerId?.toString() === user.id) return true;
    }

    // Delivery partner assignment check
    if (user.roles.includes('partner')) {
      const delivery = await Delivery.findOne({ orderId: order._id }).select('partnerId');
      if (delivery && delivery.partnerId) {
        const partner = await DeliveryPartner.findById(delivery.partnerId).select('userId');
        if (partner?.userId?.toString() === user.id) return true;
      }
    }

    return false;
  } catch (err) {
    console.error(`Error verifying order authorization for order ${orderId}:`, err);
    return false;
  }
}

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for socket origin: ${origin}`));
        }
      },
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const user = await resolveSocketUser(socket);
      if (user) {
        socket.data.user = user;
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Clients can join rooms based on their user ID to receive private notifications
    socket.on('join_user_room', async (userId) => {
      const user = socket.data.user || await resolveSocketUser(socket);
      if (user) socket.data.user = user;

      if (!user) {
        socket.emit('error', { message: 'Authentication required to join user room' });
        return;
      }

      if (user.id !== userId && !user.roles.includes('admin')) {
        console.warn(`[SECURITY] Socket ${socket.id} (user ${user.id}) unauthorized to join user room ${userId}`);
        socket.emit('error', { message: 'Unauthorized to join user room' });
        return;
      }

      socket.join(userId);
      console.log(`Socket ${socket.id} joined user room: ${userId}`);
    });

    // Clients can join specific order rooms to track an order directly
    socket.on('join_order_room', async (orderId) => {
      const user = socket.data.user || await resolveSocketUser(socket);
      if (user) socket.data.user = user;

      const authorized = await isUserAuthorizedForOrder(user, orderId);
      if (!authorized) {
        console.warn(`[SECURITY] Socket ${socket.id} (user ${user?.id}) unauthorized to join order room ${orderId}`);
        socket.emit('error', { message: 'Unauthorized to join order room' });
        return;
      }

      socket.join(orderId);
      console.log(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    socket.on('leave_order_room', (orderId) => {
      socket.leave(orderId);
      console.log(`Socket ${socket.id} left order room: ${orderId}`);
    });

    socket.on('join_admin_fleet', async () => {
      const user = socket.data.user || await resolveSocketUser(socket);
      if (user) socket.data.user = user;

      if (!user || (!user.roles.includes('admin') && !user.roles.includes('owner'))) {
        console.warn(`[SECURITY] Socket ${socket.id} unauthorized to join admin fleet`);
        socket.emit('error', { message: 'Unauthorized to join admin fleet' });
        return;
      }

      socket.join('admin_fleet');
      console.log(`Socket ${socket.id} joined admin fleet room`);
    });

    socket.on('order:chat:send', async (payload) => {
      try {
        if (!payload || !payload.orderId || !payload.message || typeof payload.message !== 'string') {
          socket.emit('error', { message: 'Malformed chat payload: orderId and message string are required' });
          return;
        }

        const trimmedMessage = payload.message.trim();
        if (!trimmedMessage || trimmedMessage.length > 2000) {
          socket.emit('error', { message: 'Message cannot be empty or exceed 2000 characters' });
          return;
        }

        const user = socket.data.user || await resolveSocketUser(socket, payload.auth);
        if (user) socket.data.user = user;

        if (!user) {
          socket.emit('error', { message: 'Authentication required to send chat message' });
          return;
        }

        const authorized = await isUserAuthorizedForOrder(user, payload.orderId);
        if (!authorized) {
          console.warn(`[SECURITY] Socket ${socket.id} (user ${user?.id}) unauthorized to send chat for order ${payload.orderId}`);
          socket.emit('error', { message: 'Unauthorized to send chat message for this order' });
          return;
        }

        // Determine sender role strictly from authenticated user roles
        let senderRole = payload.senderRole;
        if (!senderRole || !user.roles.includes(senderRole)) {
          senderRole = user.roles.includes('partner') ? 'partner' :
                       user.roles.includes('owner') ? 'owner' :
                       user.roles.includes('admin') ? 'admin' : 'user';
        }

        const timestamp = new Date().toISOString();
        const messageToSave = {
          orderId: payload.orderId,
          senderId: user.id,
          senderRole,
          senderName: user.name || payload.senderName || 'User',
          targetRole: payload.targetRole,
          message: trimmedMessage,
          timestamp
        };

        const updateResult = await Order.findByIdAndUpdate(
          payload.orderId,
          { $push: { chatMessages: messageToSave } },
          { new: true }
        );

        if (!updateResult) {
          socket.emit('error', { message: 'Order not found, message not persisted' });
          return;
        }

        // Broadcast to everyone in the order room ONLY after successful database persistence
        io.to(payload.orderId).emit('order:chat:message', messageToSave);
      } catch (err) {
        console.error('Failed to save chat message:', err);
        socket.emit('error', { message: 'Failed to persist chat message' });
        return;
      }
    });

    socket.on('partner:location_updated', async (payload) => {
      try {
        // 1. Authenticate user and verify partner or admin role
        const user = socket.data.user || await resolveSocketUser(socket, payload?.auth);
        if (user) socket.data.user = user;

        if (!user || !user.roles || (!user.roles.includes('partner') && !user.roles.includes('admin'))) {
          console.warn(`[SECURITY] Socket ${socket.id} (user ${user?.id}) unauthorized for partner:location_updated`);
          socket.emit('error', { message: 'Authentication required with partner role' });
          return;
        }

        // 2. Validate payload structure and coordinates
        if (!payload || !payload.deliveryId || !payload.location) {
          socket.emit('error', { message: 'Malformed payload: deliveryId and location are required' });
          return;
        }

        const { lat, lng } = payload.location;
        if (
          typeof lat !== 'number' || typeof lng !== 'number' ||
          !Number.isFinite(lat) || !Number.isFinite(lng) ||
          lat < -90 || lat > 90 ||
          lng < -180 || lng > 180
        ) {
          socket.emit('error', { message: 'Invalid coordinates: lat must be between -90 and 90, lng between -180 and 180' });
          return;
        }

        // 3. Resolve DeliveryPartner from authenticated user identity (never trust payload.partnerId)
        let partnerDoc: any = null;
        if (user.roles.includes('partner')) {
          partnerDoc = await DeliveryPartner.findOne({ userId: user.id });
          if (!partnerDoc) {
            socket.emit('error', { message: 'Partner profile not found for authenticated user' });
            return;
          }

          // If client supplied a partnerId, reject if it does not match resolved partner ID (spoof attempt)
          if (payload.partnerId && payload.partnerId.toString() !== partnerDoc._id.toString()) {
            console.warn(`[SECURITY] Partner ID spoof attempt by user ${user.id}: payload.partnerId ${payload.partnerId} != resolved ${partnerDoc._id}`);
            socket.emit('error', { message: 'Partner ID mismatch / spoof attempt rejected' });
            return;
          }
        } else if (user.roles.includes('admin')) {
          if (payload.partnerId) {
            partnerDoc = await DeliveryPartner.findById(payload.partnerId);
          }
          if (!partnerDoc) {
            socket.emit('error', { message: 'Partner not found' });
            return;
          }
        }

        // 4. Verify Delivery exists and is assigned to this partner
        const delivery = await Delivery.findById(payload.deliveryId);
        if (!delivery) {
          socket.emit('error', { message: 'Delivery not found' });
          return;
        }

        if (!delivery.partnerId || delivery.partnerId.toString() !== partnerDoc._id.toString()) {
          console.warn(`[SECURITY] Unauthorized delivery update: Delivery ${delivery._id} assigned to ${delivery.partnerId}, but socket partner is ${partnerDoc._id}`);
          socket.emit('error', { message: 'Unauthorized: delivery is not assigned to this partner' });
          return;
        }

        // 5. Persist to Delivery and DeliveryPartner only after authorization
        const geo = toGeoJSON({ lat, lng });

        await Delivery.updateOne(
          { _id: delivery._id },
          { $set: { currentLocation: geo } }
        );

        await DeliveryPartner.updateOne(
          { _id: partnerDoc._id },
          { $set: { currentLocation: geo } }
        );

        // 6. Emit broadcast event only after successful authorization and persistence
        emitDeliveryLocation({
          deliveryId: delivery._id.toString(),
          orderId: delivery.orderId.toString(),
          partnerId: partnerDoc._id.toString(),
          location: { lat, lng }
        });
      } catch (err) {
        console.error('Socket partner:location_updated error:', err);
        socket.emit('error', { message: 'Failed to process partner location update' });
      }
    });

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
