import { type ApiRequestConfig } from '../../utils/api';
import { buildFactorySeedPayload, type FactorySeedPayload } from '../utils/factorySeed';
import { logger } from '../logger';

// Simulated delay for realistic network latency
const SIMULATED_DELAY_MS = 600;

// Internal singleton for mock database stored exactly as backend Mongo collections
let mockCollections: any[] = [];

function getCollection(name: string): any[] {
  return mockCollections.find(c => c.modelName === name)?.documents || [];
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createJsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getCollectionKey(modelName: string): string {
  if (modelName === 'DeliveryPartner') return 'deliveryPartners';
  if (modelName === 'FoodItem') return 'foodItems';
  if (modelName === 'Delivery') return 'deliveries';
  return modelName.toLowerCase() + 's';
}

export class ApiSimulator {
  static refresh(config: any = {}) {
    const payload = buildFactorySeedPayload(config.restaurants?.count || 8, {
      config: config
    });
    mockCollections = payload.collections;
    
    // Explicitly seed the exact items we want for our UI API
    logger.info('SIMULATOR', 'Mock dataset refreshed locally', { collections: mockCollections.map(c => c.modelName) });
  }

  static async resolve(config: ApiRequestConfig): Promise<Response> {
    await delay(SIMULATED_DELAY_MS);
    if (mockCollections.length === 0) {
      this.refresh();
    }
    
    const method = config.method || 'GET';
    const url = new URL(config.url, 'http://localhost');
    const path = url.pathname;

    try {
      // --- DEV SEEDING ---
      if (path.endsWith('/dev/seed-factory-data') && method === 'POST') {
        const payload: FactorySeedPayload = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
        mockCollections = payload.collections || [];
        
        return createJsonResponse({
          success: true,
          message: 'Mock dataset seeded successfully (Simulator)',
          data: {
            seeded: mockCollections.reduce((acc, col) => ({
              ...acc,
              [getCollectionKey(col.modelName)]: { requested: col.documents.length, inserted: col.documents.length }
            }), {}),
            durationMs: SIMULATED_DELAY_MS
          }
        });
      }

      // --- AUTHENTICATION ---
      if (path.includes('/api/auth/login') && method === 'POST') {
        const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
        if (!body?.email || !body?.password) {
          return createJsonResponse({
            success: false,
            message: 'Validation Error',
            error: { details: [{ path: 'email', message: 'Required' }] }
          }, 400);
        }
        if (body.password === 'wrong') {
          return createJsonResponse({ success: false, message: 'Invalid password' }, 401);
        }
        const users = getCollection('User');
        let user = users.find(u => u.email === body.email) || users[0];
        if (!user) {
          user = { _id: 'mock-user-1', email: body.email, name: 'Mock User', roles: ['user'] };
        }
        return createJsonResponse({
          success: true,
          message: 'Login successful (Mock)',
          data: {
            token: 'mock-jwt-token-123',
            user,
          }
        });
      }

      if (path.includes('/api/auth/me') && method === 'GET') {
        const token = config.headers && (config.headers as any)['Authorization'];
        if (!token || token.includes('invalid_token') || token === 'Bearer null') {
          return createJsonResponse({ success: false, message: 'Invalid token' }, 401);
        }
        return createJsonResponse({
          success: true,
          message: 'User fetched (Mock)',
          data: getCollection('User')[0],
        });
      }

      // --- RESTAURANTS ---
      if (path.match(/\/api\/restaurants$/) && method === 'GET') {
        const docs = getCollection('Restaurant');
        return createJsonResponse({
          success: true,
          message: 'Restaurants fetched (Mock)',
          data: {
            restaurants: docs,
            pagination: { total: docs.length, page: 1, limit: docs.length, pages: 1 }
          }
        });
      }

      if (path.match(/\/api\/restaurants\/[a-zA-Z0-9-]+$/) && method === 'GET') {
        const id = path.split('/').pop();
        const docs = getCollection('Restaurant');
        const restaurant = docs.find(r => r._id === id);
        if (!restaurant) {
          return createJsonResponse({ success: false, message: 'Restaurant not found' }, 404);
        }
        return createJsonResponse({
          success: true,
          message: 'Restaurant fetched (Mock)',
          data: restaurant
        });
      }
      
      // --- ORDERS ---
      if (path.match(/\/api\/orders$/) && method === 'GET') {
        const docs = getCollection('Order');
        return createJsonResponse({
          success: true,
          message: 'Orders fetched (Mock)',
          data: docs
        });
      }
      
      if (path.match(/\/api\/orders\/[a-zA-Z0-9-]+$/) && method === 'GET') {
        const id = path.split('/').pop();
        const docs = getCollection('Order');
        const order = docs.find(o => o._id === id);
        if (!order) return createJsonResponse({ success: false, message: 'Order not found' }, 404);
        return createJsonResponse({
          success: true,
          data: order
        });
      }

      // --- REVIEWS ---
      if (path.match(/\/api\/reviews\/restaurant\/[a-zA-Z0-9-]+$/) && method === 'GET') {
        const restaurantId = path.split('/').pop();
        const docs = getCollection('Review');
        const reviews = docs.filter(r => r.restaurantId === restaurantId);
        return createJsonResponse({
          success: true,
          message: 'Reviews fetched (Mock)',
          data: {
            reviews,
            pagination: { total: reviews.length, page: 1, limit: reviews.length, pages: 1 }
          }
        });
      }

      if (path.match(/\/api\/reviews$/) && method === 'POST') {
        const token = config.headers && (config.headers as any)['Authorization'];
        if (!token) return createJsonResponse({ success: false, message: 'Unauthorized' }, 401);

        const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
        if (!body.orderId || !body.restaurantRating) {
          return createJsonResponse({
            success: false,
            message: 'Validation Error',
            error: { details: [{ path: 'orderId', message: 'Required' }] }
          }, 400);
        }

        const newReview = {
          _id: `mock-rev-${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString()
        };
        mockCollections.find(c => c.modelName === 'Review')?.documents.push(newReview);
        return createJsonResponse({
          success: true,
          message: 'Review created successfully (Mock)',
          data: newReview
        }, 201);
      }

      // Default Unhandled Mock Route
      logger.warn('SIMULATOR', `Unhandled mock route: ${method} ${path}`);
      return createJsonResponse({ success: false, message: `Mock route not implemented: ${path}` }, 404);

    } catch (e: any) {
      logger.error('SIMULATOR', 'Internal Simulator Error', e);
      return createJsonResponse({ success: false, message: 'Internal Server Error' }, 500);
    }
  }
}