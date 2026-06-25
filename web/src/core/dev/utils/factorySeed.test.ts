import { describe, expect, it } from 'vitest';
import { buildFactorySeedPayload } from './factorySeed';

describe('buildFactorySeedPayload', () => {
  it('creates a schema-driven payload for the selected factory targets', () => {
    const payload = buildFactorySeedPayload(3, {
      targets: ['restaurants', 'foodItems', 'users'],
      config: { users: { count: 2 } },
    });

    expect(payload.schemaVersion).toBe('factory-types-v1');
    expect(payload.targets).toEqual(['restaurants', 'foodItems', 'users']);
    expect(payload.config?.users?.count).toBe(2);
    expect(payload.data.restaurants).toHaveLength(3);
    expect(payload.data.restaurants[0]).toMatchObject({
      factoryId: expect.any(String),
      name: expect.any(String),
      city: expect.any(String),
    });
    expect(payload.data.foodItems.length).toBeGreaterThan(0);
    expect(payload.data.foodItems[0]).toMatchObject({
      factoryRestaurantId: payload.data.restaurants[0].factoryId,
      name: expect.any(String),
      price: expect.any(Number),
    });
    expect(payload.data.users).toHaveLength(2);
  });

  it('expands the generated users and restaurants when orders and reviews are requested', () => {
    const payload = buildFactorySeedPayload(2, {
      targets: ['orders', 'reviews'],
      config: {
        users: { count: 2 },
        restaurants: { count: 2 },
        orders: { count: 6 },
        reviews: { count: 6 },
      },
    });

    expect(payload.data.users.length).toBeGreaterThanOrEqual(6);
    expect(payload.data.restaurants.length).toBeGreaterThanOrEqual(6);
    expect(payload.data.orders).toHaveLength(6);
    expect(payload.data.reviews).toHaveLength(6);
  });
});
