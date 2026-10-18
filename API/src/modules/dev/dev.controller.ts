import { NextFunction, Request, Response } from 'express';
import { config } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Order } from '../orders/order.model';
import { DeliveryPartner } from '../delivery/delivery-partner.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { toGeoJSON } from '../../utils/geo';
import { Delivery } from '../delivery/delivery.model';
import { emitDeliveryAssigned } from '../delivery/delivery.events';
import { getIO } from '../../socket';
import { transitionOrderStatus } from '../orders/order.service';
import {
  startDeliverySimulation,
  stopDeliverySimulation,
  computeInitialPartnerOrigin,
  calculateDistanceMeters,
} from '../delivery/delivery.simulator';

// Types
interface SeedCollectionPayload {
  modelName: string;
  documents?: any[];
  clearFirst?: boolean;
  deleteIds?: string[];
  deleteFilter?: Record<string, any>;
}

interface FactorySeedPayload {
  collections: SeedCollectionPayload[];
}

export function getConnectedDbInfo() {
  const dbName = mongoose.connection.db?.databaseName || mongoose.connection.name || '';
  const isDedicatedTestDb = /test|e2e/i.test(dbName);
  return { dbName, isDedicatedTestDb };
}

export async function getDbInfo(req: Request, res: Response) {
  if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
  }
  const { dbName, isDedicatedTestDb } = getConnectedDbInfo();
  res.json({
    success: true,
    data: {
      databaseName: dbName,
      isDedicatedTestDb,
      host: mongoose.connection.host,
      nodeEnv: config.nodeEnv,
      readyState: mongoose.connection.readyState
    }
  });
}

export async function seedFactoryData(req: Request, res: Response, next: NextFunction) {
  try {
    if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
    }

    const { collections, warnings: clientWarnings = [] } = req.body as {
      collections: SeedCollectionPayload[];
      warnings?: string[];
    };

    if (!collections || !Array.isArray(collections)) {
      return res.status(400).json({ success: false, message: 'Invalid payload. collections array required.' });
    }

    const { dbName, isDedicatedTestDb } = getConnectedDbInfo();

    // Explicit Safety Guard: destructive clearFirst must fail-closed unless active DB is demonstrably a test/e2e DB
    const hasClearFirst = collections.some(c => c.clearFirst === true);
    if (hasClearFirst) {
      const currentEnv = process.env.NODE_ENV || config.nodeEnv;
      const isExplicitlyAuthorized = (currentEnv === 'test' || process.env.ALLOW_DESTRUCTIVE_SEED === 'true' || req.headers['x-allow-destructive-seed'] === 'true');
      if (!isDedicatedTestDb || !isExplicitlyAuthorized) {
        console.warn(`[seed:guard:blocked] clearFirst rejected against database '${dbName}'. Dedicated test DB and explicit authorization required.`);
        return res.status(403).json({
          success: false,
          message: `Destructive clearFirst rejected: active database '${dbName}' is not a dedicated test/e2e database or destructive operation is unauthorized. Operation aborted to protect application data.`,
          data: { dbName, isDedicatedTestDb, isExplicitlyAuthorized }
        });
      }
    }

    const seedStart = Date.now();
    const results: Record<string, any> = {};
    const errors: string[] = [];

    for (const collection of collections) {
      const { modelName, documents = [], clearFirst, deleteIds, deleteFilter } = collection;
      const Model = mongoose.models[modelName];

      if (!Model) {
        errors.push(`${modelName}: Unknown model`);
        continue;
      }

      const colStart = Date.now();

      if (clearFirst) {
        await Model.deleteMany({});
      } else if (deleteIds && Array.isArray(deleteIds) && deleteIds.length > 0) {
        await Model.deleteMany({ _id: { $in: deleteIds } });
      } else if (deleteFilter && typeof deleteFilter === 'object' && Object.keys(deleteFilter).length > 0) {
        await Model.deleteMany(deleteFilter);
      }

      let inserted = 0;
      let failed = 0;
      let skipped = 0;
      let modelErrors: any[] = [];


      let documentsToInsert = documents;
      if (modelName === 'User' && documentsToInsert.length > 0) {
        // Only hash passwords for fixed development users
        documentsToInsert = await Promise.all(documents.map(async (doc: any) => {
          if (doc.__isFixed && doc.password === 'devdev') {
            doc.password = await bcrypt.hash('devdev', 12);
          }
          return doc;
        }));
      }

      if (documentsToInsert.length > 0) {

        try {
          await Model.insertMany(documentsToInsert, { ordered: false, rawResult: true });
          inserted = documentsToInsert.length;
        } catch (insertErr: any) {
          if (insertErr.name === 'MongoBulkWriteError' || insertErr.code === 11000 || insertErr.writeErrors) {
            inserted = insertErr.insertedCount ?? 0;
            const writeErrors = insertErr.writeErrors || [];
            
            // Distinguish skipped vs failed
            const genuineErrors = [];
            for (const we of writeErrors) {
              const doc = documentsToInsert[we.index];
              const errCode = we.code || we.err?.code; if (errCode === 11000 && doc && doc.__isFixed) {
                // Fixed account already exists -> intentionally skipped
                // But we must ensure its password is reset to devdev
                if (modelName === 'User' && doc.password) {
                  await Model.updateOne({ _id: doc._id }, { $set: { password: doc.password } });
                }
                skipped++;
              } else {
                genuineErrors.push(we);
              }
            }
            
            failed = documentsToInsert.length - inserted - skipped;
            
            if (genuineErrors.length > 0) {
              modelErrors = genuineErrors.map((we: any) => ({
                index: we.index,
                code: we.code || we.err?.code,
                message: (we.errmsg || we.err?.errmsg)?.substring(0, 200)
              })).slice(0, 10);
            }
          } else {
            failed = documentsToInsert.length;
            modelErrors.push({ message: insertErr.message?.substring(0, 200) });
          }
          
          if (failed > 0) {
            const summaryMsg = `[${modelName}] Inserted ${inserted}, Skipped ${skipped}, Failed ${failed}`;
            errors.push(summaryMsg);
            console.error(`[seed:${modelName}:error]`, summaryMsg, modelErrors);
          }
        }
      }

      const colDuration = Date.now() - colStart;
      results[modelName] = {
        requested: documents.length,
        inserted,
        skipped,
        failed,
        errors: modelErrors
      };
      console.log(`[seed:${modelName}:complete]`, { requested: documents.length, inserted, skipped, failed, durationMs: colDuration });
    }

    const totalDuration = Date.now() - seedStart;
    const seededCollections = Object.entries(results)
      .map(([model, data]) => `${model}: ${data.inserted}/${data.requested}`)
      .join(', ');

    const finalWarnings = [...clientWarnings, ...errors];

    console.log('[seed:complete]', { results, durationMs: totalDuration, errors: finalWarnings });

    sendSuccess({
      res,
      statusCode: 201,
      message: finalWarnings.length === 0
        ? `Seed completed. (${seededCollections})`
        : `Seed completed with warnings. (${seededCollections})`,
      data: {
        seeded: results,
        durationMs: totalDuration,
        warnings: finalWarnings.length > 0 ? finalWarnings : undefined,
      },
    });
  } catch (error) {
    console.error('[seed:error]', error);
    next(error);
  }
}

export async function assignPartner(req: Request, res: Response) {
  if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
  }

  const { orderId, partnerUserId } = req.body as {
    orderId?: string;
    partnerUserId?: string;
  };

  if (!orderId || !partnerUserId) {
    return res.status(400).json({ success: false, message: 'orderId and partnerUserId are required' });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const partner = await DeliveryPartner.findOne({ userId: partnerUserId });
  if (!partner) return res.status(404).json({ success: false, message: 'Partner not found for userId' });

  const restaurant = await Restaurant.findById(order.restaurantId);
  if (!restaurant || !restaurant.location) {
    return res.status(400).json({ success: false, message: 'Restaurant location missing' });
  }

  const pickupLocation = toGeoJSON(restaurant.location);

  // DEMO destination: fixed offset since Order has no coordinates.
  // Real geocoding is a separate concern.
  const destinationLocation = toGeoJSON({
    lat: restaurant.location.lat + 0.015,
    lng: restaurant.location.lng + 0.015,
  });

  const currentLocation = partner.currentLocation ?? pickupLocation;

  const delivery = await Delivery.create({
    orderId: order._id,
    partnerId: partner._id,
    status: 'partner_assigned',
    pickupLocation,
    destinationLocation,
    currentLocation,
    timestamps: { assignedAt: new Date() },
  });

  partner.status = 'on_delivery';
  partner.currentAssignedDelivery = delivery._id as any;
  await partner.save();

  emitDeliveryAssigned({
    deliveryId: delivery._id.toString(),
    orderId: order._id.toString(),
    partnerId: partner._id.toString(),
    partnerUserId: partner.userId!.toString(),
    status: 'partner_assigned',
    partnerName: partner.name,
    partnerPhone: partner.phone,
  });

  res.json({ success: true, data: delivery });
}

let isLaunchingDemo = false;

export async function getActiveDemoOrder(req: Request, res: Response, next: NextFunction) {
  try {
    if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
    }

    const demoOrder = await Order.findOne({ isDemo: true })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone')
      .populate('restaurantId', 'name address location');

    if (!demoOrder) {
      return res.json({ success: true, data: null });
    }

    const delivery = await Delivery.findOne({ orderId: demoOrder._id })
      .populate('partnerId', 'name phone vehicle rating status');

    const isTerminal = ['delivered', 'cancelled', 'rejected'].includes(demoOrder.status);

    return res.json({
      success: true,
      data: {
        order: demoOrder,
        delivery,
        isTerminal,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmDemoHandoff(req: Request, res: Response, next: NextFunction) {
  try {
    if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
    }

    const { orderId } = req.body as { orderId?: string };

    let order = orderId
      ? await Order.findById(orderId)
      : await Order.findOne({ isDemo: true, status: 'partner_assigned' }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Eligible demo order not found' });
    }

    if (order.status !== 'partner_assigned') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm handoff: order status is currently '${order.status}' (expected 'partner_assigned')`,
        currentStatus: order.status,
      });
    }

    // Server-authoritative transition to picked_up
    const updatedOrder = await transitionOrderStatus(order._id.toString(), 'picked_up', {
      id: 'system',
      role: 'system',
    });

    const delivery = await Delivery.findOne({ orderId: order._id });

    return res.json({
      success: true,
      message: 'Kitchen handoff confirmed; courier is now en route to customer',
      data: {
        order: updatedOrder,
        delivery,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function launchLiveOrderDemo(req: Request, res: Response, next: NextFunction) {
  try {
    if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
    }

    // Concurrency guard: Mutex check
    if (isLaunchingDemo) {
      return res.status(409).json({
        success: false,
        message: 'A demo launch is already in progress. Please wait a moment.',
      });
    }

    // Idempotency check: Is there already an active demo running?
    const existingActiveOrder = await Order.findOne({
      isDemo: true,
      status: { $nin: ['delivered', 'cancelled', 'rejected'] },
    });

    if (existingActiveOrder) {
      const existingDelivery = await Delivery.findOne({ orderId: existingActiveOrder._id });
      return res.json({
        success: true,
        message: 'An active demo order is already running',
        data: {
          order: existingActiveOrder,
          delivery: existingDelivery,
          alreadyRunning: true,
        },
      });
    }

    isLaunchingDemo = true;

    try {
      // 1. Resolve Demo Restaurant
      let restaurant = await Restaurant.findById('64e8e50f3c5f4a1b8c1a9905');
      if (!restaurant) {
        restaurant = await Restaurant.findOne({ isOpen: { $ne: false }, 'menu.0': { $exists: true } });
      }
      if (!restaurant) {
        restaurant = await Restaurant.create({
          _id: new mongoose.Types.ObjectId('64e8e50f3c5f4a1b8c1a9905'),
          name: 'Showcase Spice Kitchen',
          description: 'Live order demo restaurant specializing in authentic culinary excellence',
          cuisine: ['North Indian', 'Biryani'],
          address: '100 Indiranagar 100ft Road, Bangalore',
          city: 'Bangalore',
          rating: 4.8,
          totalRatings: 128,
          priceRange: 2,
          imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
          isOpen: true,
          deliveryTime: 20,
          minOrder: 150,
          phone: '+91 98765 43210',
          location: { lat: 12.9716, lng: 77.5946 },
          menu: [
            {
              name: 'Demo Butter Chicken Bowl',
              description: 'Tender chicken simmered in rich creamy tomato butter gravy with spiced basmati rice',
              price: 280,
              category: 'Main Course',
              isAvailable: true,
            },
          ],
        });
      }

      // 2. Resolve Owner User
      const User = mongoose.model('User');
      let ownerUser = restaurant.ownerId ? await User.findById(restaurant.ownerId) : null;
      if (!ownerUser) {
        ownerUser = await User.findOne({ role: 'owner' });
      }
      if (!ownerUser) {
        ownerUser = await User.findById('64e8e50f3c5f4a1b8c1a9902');
      }
      if (!ownerUser) {
        ownerUser = await User.create({
          _id: new mongoose.Types.ObjectId('64e8e50f3c5f4a1b8c1a9902'),
          name: 'Kitchen Manager',
          email: 'demo-owner@foodhub.test',
          password: await bcrypt.hash('devdev', 10),
          role: 'owner',
          phone: '9888888881',
          address: 'Demo Kitchen Address',
        });
      }
      if (!restaurant.ownerId || restaurant.ownerId.toString() !== ownerUser._id.toString()) {
        restaurant.ownerId = ownerUser._id;
        await restaurant.save();
      }

      // 3. Resolve Customer User
      let customerUser = await User.findById('64e8e50f3c5f4a1b8c1a9901');
      if (!customerUser) {
        customerUser = await User.findOne({ role: 'user' });
      }
      if (!customerUser) {
        customerUser = await User.create({
          _id: new mongoose.Types.ObjectId('64e8e50f3c5f4a1b8c1a9901'),
          name: 'Showcase Customer',
          email: 'demo-customer@foodhub.test',
          password: await bcrypt.hash('devdev', 10),
          role: 'user',
          phone: '9888888882',
          address: 'Flat 402, Showcase Heights, Bangalore',
        });
      }

      // 4. Resolve Delivery Partner
      let partner = await DeliveryPartner.findById('64e8e50f3c5f4a1b8c1a9907');
      if (!partner) {
        partner = await DeliveryPartner.findOne();
      }
      let partnerUser = partner?.userId ? await User.findById(partner.userId) : null;
      if (!partnerUser) {
        partnerUser = await User.findById('64e8e50f3c5f4a1b8c1a9903');
      }
      if (!partnerUser) {
        partnerUser = await User.findOne({ role: 'partner' });
      }
      if (!partnerUser) {
        partnerUser = await User.create({
          _id: new mongoose.Types.ObjectId('64e8e50f3c5f4a1b8c1a9903'),
          name: 'Ramesh Rider',
          email: 'demo-partner@foodhub.test',
          password: await bcrypt.hash('devdev', 10),
          role: 'partner',
          phone: '9888888883',
          address: 'Fleet Hub 1, Bangalore',
        });
      }
      if (!partner) {
        partner = await DeliveryPartner.create({
          _id: new mongoose.Types.ObjectId('64e8e50f3c5f4a1b8c1a9907'),
          userId: partnerUser._id,
          name: partnerUser.name || 'Ramesh Rider',
          phone: partnerUser.phone || '9888888883',
          vehicle: { type: 'bike', registrationNumber: 'KA-01-DEMO-99' },
          rating: 4.9,
          status: 'available',
          isOnline: true,
        });
      } else {
        // Reset partner status cleanly so assignment is guaranteed
        partner.status = 'available';
        partner.currentAssignedDelivery = undefined;
        await partner.save();
      }

      // Clean up past demo deliveries simulators
      const pastDemoDeliveries = await Delivery.find({ isDemo: true });
      for (const pd of pastDemoDeliveries) {
        stopDeliverySimulation(pd._id.toString());
      }

      // 5. Select Menu Item
      const menuItem = restaurant.menu && restaurant.menu.length > 0
        ? restaurant.menu[0]
        : { name: 'Demo Butter Chicken Bowl', price: 280 };

      // 6. Create Demo Order in 'pending_owner'
      const demoOrder = new Order({
        userId: customerUser._id,
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        items: [
          {
            menuItemId: (menuItem as any)._id ? (menuItem as any)._id.toString() : 'demo-item-1',
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
          },
        ],
        totalAmount: menuItem.price,
        deliveryAddress: 'Flat 402, Showcase Heights, Bangalore',
        status: 'pending_owner',
        paymentMethod: 'card',
        paymentStatus: 'completed',
        isDemo: true,
        timestamps: {},
      });
      await demoOrder.save();

      // 7. Legitimate Lifecycle Progression:
      // pending_owner -> confirmed -> preparing -> ready_for_pickup (auto-advances to awaiting_partner)
      await transitionOrderStatus(demoOrder._id.toString(), 'confirmed', {
        id: ownerUser._id.toString(),
        role: 'owner',
      });
      await transitionOrderStatus(demoOrder._id.toString(), 'preparing', {
        id: ownerUser._id.toString(),
        role: 'owner',
      });
      await transitionOrderStatus(demoOrder._id.toString(), 'ready_for_pickup', {
        id: ownerUser._id.toString(),
        role: 'owner',
      });

      // 8. Partner Acceptance & Assignment
      const rLat = restaurant.location?.lat || 12.9716;
      const rLng = restaurant.location?.lng || 77.5946;
      const pickupCoords: [number, number] = [rLng, rLat];
      const destCoords: [number, number] = [rLng + 0.015, rLat + 0.015];
      const startCoords: [number, number] = computeInitialPartnerOrigin(pickupCoords, demoOrder._id.toString());

      const initialDistanceMeters = calculateDistanceMeters(startCoords, pickupCoords);
      const initialEtaSeconds = Math.max(1, Math.round(initialDistanceMeters / 6.9));

      const updatedOrder = await Order.findByIdAndUpdate(
        demoOrder._id,
        { status: 'partner_assigned', 'timestamps.assignedAt': new Date() },
        { new: true }
      );

      const delivery = new Delivery({
        orderId: demoOrder._id,
        partnerId: partner._id,
        status: 'partner_assigned',
        pickupLocation: { type: 'Point', coordinates: pickupCoords },
        destinationLocation: { type: 'Point', coordinates: destCoords },
        currentLocation: { type: 'Point', coordinates: startCoords },
        distanceRemainingMeters: initialDistanceMeters,
        etaSeconds: initialEtaSeconds,
        isDemo: true,
        timestamps: { assignedAt: new Date() },
      });
      await delivery.save();

      partner.status = 'assigned';
      partner.currentAssignedDelivery = delivery._id as any;
      partner.currentLocation = { type: 'Point', coordinates: startCoords };
      await partner.save();

      // 9. Emit real Socket.IO events to all relevant rooms
      const io = getIO();
      io.to(demoOrder._id.toString()).emit('order_status_update', {
        orderId: demoOrder._id,
        status: 'partner_assigned',
      });
      io.to(ownerUser._id.toString()).emit('order:status_changed', {
        orderId: demoOrder._id,
        status: 'partner_assigned',
        actorRole: 'system',
      });
      io.to(customerUser._id.toString()).emit('order:status_changed', {
        orderId: demoOrder._id,
        status: 'partner_assigned',
        actorRole: 'system',
      });
      io.to('admin_fleet').emit('order:status_changed', {
        orderId: demoOrder._id,
        status: 'partner_assigned',
        actorRole: 'system',
      });

      emitDeliveryAssigned({
        deliveryId: delivery._id.toString(),
        orderId: demoOrder._id.toString(),
        partnerId: partner._id.toString(),
        partnerUserId: partnerUser._id.toString(),
        customerUserId: customerUser._id.toString(),
        partnerName: partner.name || 'Partner',
        partnerPhone: partner.phone || '9999999999',
        status: 'partner_assigned',
      });

      const initialLocationPayload = {
        deliveryId: delivery._id.toString(),
        orderId: demoOrder._id.toString(),
        partnerId: partner._id.toString(),
        location: { lat: startCoords[1], lng: startCoords[0] },
        etaSeconds: initialEtaSeconds,
        distanceRemainingMeters: initialDistanceMeters,
        status: 'partner_assigned',
        timestamp: new Date().toISOString(),
      };
      io.to(demoOrder._id.toString()).emit('delivery:location', initialLocationPayload);
      io.to('admin_fleet').emit('delivery:location', initialLocationPayload);
      io.to(partnerUser._id.toString()).emit('delivery:location', initialLocationPayload);
      io.to(ownerUser._id.toString()).emit('delivery:location', initialLocationPayload);

      // 10. Start the real delivery simulator
      startDeliverySimulation(delivery._id.toString());

      return res.status(201).json({
        success: true,
        message: 'Live order demo launched successfully',
        data: {
          order: updatedOrder,
          delivery,
          restaurant: {
            id: restaurant._id,
            name: restaurant.name,
            location: restaurant.location,
            address: restaurant.address,
          },
          customer: {
            id: customerUser._id,
            name: customerUser.name,
            address: demoOrder.deliveryAddress,
            destinationLocation: { lat: destCoords[1], lng: destCoords[0] },
          },
          partner: {
            id: partner._id,
            name: partner.name,
            phone: partner.phone,
            currentLocation: { lat: startCoords[1], lng: startCoords[0] },
          },
        },
      });
    } finally {
      isLaunchingDemo = false;
    }
  } catch (err) {
    isLaunchingDemo = false;
    next(err);
  }
}
