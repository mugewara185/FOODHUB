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

export async function seedFactoryData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const seedStart = Date.now();

  try {
    if (config.nodeEnv === 'production') {
      throw new AppError('Factory seeding is disabled in production.', 403);
    }

    const payload = req.body as FactorySeedPayload;

    if (!payload.collections || !Array.isArray(payload.collections)) {
      throw new AppError(
        'Invalid payload. Expected: { collections: [{ modelName, documents }] }',
        400
      );
    }

    console.log('[seed:start]', {
      collections: payload.collections.map((c) => `${c.modelName}(${c.documents?.length ?? 0})`).join(', '),
    });

    const results: Record<string, number> = {};
    const errors: string[] = [];

    for (const col of payload.collections) {
      const { modelName, documents, clearFirst = true } = col;

      if (!modelName || !Array.isArray(documents)) {
        errors.push(`Skipped invalid collection entry (missing modelName or documents array)`);
        continue;
      }

      let Model: mongoose.Model<any>;
      try {
        Model = mongoose.model(modelName);
      } catch (_err) {
        const msg = `Model '${modelName}' is not registered. Ensure it is imported in app.ts.`;
        errors.push(msg);
        console.warn(`[seed:error] ${msg}`);
        continue;
      }

      const colStart = Date.now();
      console.log(`[seed:${modelName}:start]`, { count: documents.length, clearFirst });

      if (clearFirst) {
        await Model.deleteMany({});
        console.log(`[seed:${modelName}:cleared]`);
      }

      if (documents.length > 0) {
        try {
          await Model.insertMany(documents, { ordered: false });
        } catch (insertErr: any) {
          const message =
            insertErr?.message?.substring(0, 200) ?? 'Unknown insert error';
          errors.push(`${modelName}: ${message}`);
          console.error(`[seed:${modelName}:error]`, message);
        }
      }

      const colDuration = Date.now() - colStart;
      results[modelName] = documents.length;
      console.log(`[seed:${modelName}:complete]`, { count: documents.length, durationMs: colDuration });
    }

    const totalDuration = Date.now() - seedStart;
    const seededCollections = Object.entries(results)
      .map(([model, count]) => `${model}: ${count}`)
      .join(', ');

    console.log('[seed:complete]', { results, durationMs: totalDuration, errors });

    sendSuccess({
      res,
      statusCode: 201,
      message: errors.length === 0
        ? `Seed completed. (${seededCollections})`
        : `Seed completed with warnings. (${seededCollections})`,
      data: {
        seeded: results,
        durationMs: totalDuration,
        warnings: errors.length > 0 ? errors : undefined,
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
