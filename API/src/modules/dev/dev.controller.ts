import { NextFunction, Request, Response } from 'express';
import { config } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import mongoose from 'mongoose';

interface SeedCollectionPayload {
  modelName: string;
  documents: any[];
  clearFirst?: boolean;
}

interface FactorySeedPayload {
  collections: SeedCollectionPayload[];
}

export async function seedFactoryData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (config.nodeEnv === 'production') {
      throw new AppError('Factory seeding is disabled in production.', 403);
    }

    const payload = req.body as FactorySeedPayload;
    
    // Fallback for legacy payload if necessary, but we are enforcing generic structure
    if (!payload.collections || !Array.isArray(payload.collections)) {
      throw new AppError('Invalid payload format. Expected { collections: [{ modelName, documents }] }', 400);
    }

    const results: Record<string, number> = {};

    for (const col of payload.collections) {
      const { modelName, documents, clearFirst = true } = col;
      
      if (!modelName || !Array.isArray(documents)) {
        continue;
      }

      let Model;
      try {
        Model = mongoose.model(modelName);
      } catch (err) {
        throw new AppError(`Model ${modelName} is not registered with Mongoose.`, 400);
      }

      if (clearFirst) {
        await Model.deleteMany({});
      }

      if (documents.length > 0) {
        await Model.create(documents);
      }

      results[modelName] = documents.length;
    }

    sendSuccess({
      res,
      statusCode: 201,
      message: `Successfully seeded data.`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}
