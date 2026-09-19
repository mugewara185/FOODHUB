import { NextFunction, Request, Response } from 'express';
import { config } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';
import { sendSuccess } from '../../shared/utils/response';
import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SeedCollectionPayload {
  modelName: string;
  documents: any[];
  clearFirst?: boolean;
}

interface FactorySeedPayload {
  collections: SeedCollectionPayload[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/dev/seed-factory-data
 *
 * Generic factory seed endpoint.
 * Accepts an array of { modelName, documents, clearFirst } entries.
 * The frontend factory is responsible for generating valid, schema-aligned
 * documents. The backend's only job is to insert them via the registered
 * Mongoose model.
 *
 * Only active in non-production environments.
 */
export async function seedFactoryData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const seedStart = Date.now();

  try {
    // Safety guard: never run in production
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

      console.dir({ modelName, documents, clearFirst }, { depth: null });

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
          // Use insertMany with ordered:false so individual doc failures don't
          // abort the whole batch. Validation errors are surfaced in the response.
          await Model.insertMany(documents, { ordered: false });
        } catch (insertErr: any) {
          // insertMany throws on duplicate key or validation errors but may
          // have partially inserted — capture and continue.
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
