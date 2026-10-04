import { NextFunction, Request, Response } from 'express';
import { config } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import mongoose from 'mongoose';
import { Order } from '../orders/order.model';
import { DeliveryPartner } from '../delivery/delivery-partner.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { toGeoJSON } from '../../utils/geo';
import { Delivery } from '../delivery/delivery.model';
import { emitDeliveryAssigned } from '../delivery/delivery.events';

// Types
interface SeedCollectionPayload {
  modelName: string;
  documents: any[];
  clearFirst?: boolean;
}

interface FactorySeedPayload {
  collections: SeedCollectionPayload[];
}

export async function seedFactoryData(req: Request, res: Response, next: NextFunction) {
  try {
    if (config.nodeEnv === 'production' || process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Dev endpoint disabled in production' });
    }

    const { collections, warnings: clientWarnings = [] } = req.body as {
      collections: { modelName: string; documents: any[]; clearFirst?: boolean }[];
      warnings?: string[];
    };

    if (!collections || !Array.isArray(collections)) {
      return res.status(400).json({ success: false, message: 'Invalid payload. collections array required.' });
    }

    const seedStart = Date.now();
    const results: Record<string, any> = {};
    const errors: string[] = [];

    for (const collection of collections) {
      const { modelName, documents, clearFirst } = collection;
      const Model = mongoose.models[modelName];

      if (!Model) {
        errors.push(`${modelName}: Unknown model`);
        continue;
      }

      const colStart = Date.now();

      if (clearFirst) {
        await Model.deleteMany({});
      }

      let inserted = 0;
      let failed = 0;
      let skipped = 0;
      let modelErrors: any[] = [];

      if (documents.length > 0) {
        try {
          await Model.insertMany(documents, { ordered: false, rawResult: true });
          inserted = documents.length;
        } catch (insertErr: any) {
          if (insertErr.name === 'MongoBulkWriteError' || insertErr.code === 11000 || insertErr.writeErrors) {
            inserted = insertErr.insertedCount ?? 0;
            const writeErrors = insertErr.writeErrors || [];
            
            // Distinguish skipped vs failed
            const genuineErrors = [];
            for (const we of writeErrors) {
              const doc = documents[we.index];
              if (we.code === 11000 && doc && doc.__isFixed) {
                // Fixed account already exists -> intentionally skipped
                skipped++;
              } else {
                genuineErrors.push(we);
              }
            }
            
            failed = documents.length - inserted - skipped;
            
            if (genuineErrors.length > 0) {
              modelErrors = genuineErrors.map((we: any) => ({
                index: we.index,
                code: we.code,
                message: we.errmsg?.substring(0, 200)
              })).slice(0, 10);
            }
          } else {
            failed = documents.length;
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
