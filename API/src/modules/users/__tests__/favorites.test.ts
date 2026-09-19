import { describe, it, expect, vi } from 'vitest';
import userRoutes from '../user.routes';
import * as userController from '../user.controller';
import { Request, Response } from 'express';

vi.mock('../../../shared/middleware/auth.middleware', () => ({
  protect: (req: any, res: any, next: any) => next(),
  authorize: () => (req: any, res: any, next: any) => next(),
}));

vi.mock('../user.controller', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../user.controller')>();
  return {
    ...actual,
    toggleFavorite: vi.fn(),
    toggleFoodFavorite: vi.fn(),
  };
});

describe('Favorites Routing', () => {
  it('routes POST /favorites/food/:foodItemId to toggleFoodFavorite', async () => {
    let matched = false;
    const req = { method: 'POST', url: '/favorites/food/item-123' } as any;
    const res = {} as any;
    const next = () => {};
    
    // Express router acts as a middleware function
    await userRoutes(req, res, next);
    
    expect(userController.toggleFoodFavorite).toHaveBeenCalled();
    expect(userController.toggleFavorite).not.toHaveBeenCalled();
  });

  it('routes POST /favorites/:restaurantId to toggleFavorite', async () => {
    vi.clearAllMocks();
    const req = { method: 'POST', url: '/favorites/rest-456' } as any;
    const res = {} as any;
    const next = () => {};
    
    await userRoutes(req, res, next);
    
    expect(userController.toggleFavorite).toHaveBeenCalled();
    expect(userController.toggleFoodFavorite).not.toHaveBeenCalled();
  });
});
