import { test } from 'node:test';
import * as assert from 'node:assert';

(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).window = { addEventListener: () => {}, dispatchEvent: () => {} };
(globalThis as any).document = { addEventListener: () => {} };

import { ApiSimulator } from '../simulator/ApiSimulator';
import { ApiClient } from '../../utils/api';
import { buildFactorySeedPayload } from '../../dev/utils/factorySeed';

// 1. Setup mock mode
const api = new ApiClient('http://localhost');
api.interceptors.request.push((config: any) => {
  config.mockAdapter = () => ApiSimulator.resolve(config);
  return config;
});

async function runTest() {
  console.log('--- RUNNING API SIMULATOR REFRESH TESTS ---\n');

  // Step 1: Initialize
  console.log('1. Initial mock GET before seed');
  let res = await api.get('/api/restaurants');
  const initialCount = res.restaurants.length;
  console.log(`   Initial restaurants count: ${initialCount}`);
  assert.ok(initialCount > 0, "Initial mock should have some restaurants");
  
  const sampleRestaurant = res.restaurants[0];
  assert.ok(sampleRestaurant._id, "Mock documents should use _id to match backend API schema");

  // Step 2: Seed explicitly
  console.log('\n2. Triggering seed with EXACT count = 13');
  const payload13 = buildFactorySeedPayload(13, {
    config: { restaurants: { count: 13 }, users: { count: 4 }, orders: { count: 2 }, reviews: { count: 2 } }
  });
  
  const seedRes13 = await api.post('/api/dev/seed-factory-data', payload13);
  console.log(`   Seed returned:`, seedRes13.seeded);
  assert.equal(seedRes13.seeded.restaurants.requested, 13, "Simulator should report 13 requested restaurants");

  // Step 3: Verify GET
  console.log('\n3. Fetching refreshed dataset');
  res = await api.get('/api/restaurants');
  console.log(`   Refreshed restaurants count: ${res.restaurants.length}`);
  assert.equal(res.restaurants.length, 13, "GET should return exactly 13 restaurants");

  // Step 4: Seed again
  console.log('\n4. Triggering seed again with EXACT count = 4');
  const payload4 = buildFactorySeedPayload(4, {
    config: { restaurants: { count: 4 }, users: { count: 2 }, orders: { count: 2 }, reviews: { count: 2 } }
  });
  
  const seedRes4 = await api.post('/api/dev/seed-factory-data', payload4);
  console.log(`   Seed returned:`, seedRes4.seeded);

  // Step 5: Verify GET
  console.log('\n5. Fetching second refreshed dataset');
  res = await api.get('/api/restaurants');
  console.log(`   Refreshed restaurants count: ${res.restaurants.length}`);
  assert.equal(res.restaurants.length, 4, "GET should return exactly 4 restaurants");

  console.log('\nALL TESTS PASSED: The DevConsole payload propagates perfectly into the MockDb without hard-coded defaults!');
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
