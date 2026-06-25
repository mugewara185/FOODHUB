import { describe, expect, it } from 'vitest';
import { buildFactorySeedPayload } from './factorySeed';

describe('buildFactorySeedPayload', () => {
  it('creates restaurants and menu items from the factory data', () => {
    const payload = buildFactorySeedPayload(3);

    expect(payload.restaurants).toHaveLength(3);
    expect(payload.menus.length).toBeGreaterThan(0);
    expect(payload.restaurants[0]).toMatchObject({
      factoryId: expect.any(String),
      name: expect.any(String),
      city: expect.any(String),
    });
    expect(payload.menus[0]).toMatchObject({
      factoryRestaurantId: payload.restaurants[0].factoryId,
      name: expect.any(String),
      price: expect.any(Number),
    });
  });
});
