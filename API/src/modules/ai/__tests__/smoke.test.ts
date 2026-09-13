/**
 * AI Architecture Smoke Test
 *
 * This is a standalone Node.js test script (no test framework required).
 * Run with: npx ts-node src/modules/ai/__tests__/smoke.test.ts
 *
 * Tests the golden path: AIAgent → MCPClient (mocked) → MockProvider → AIResponse
 */

import { MockAIProvider } from '../providers/mock.provider';
import { MCPClient } from '../mcp/mcp.client';
import { AIAgent } from '../agent/ai.agent';
import { aiLogger } from '../observability/ai.logger';
import { AIRequest, AIExecutionContext } from '../types/ai.types';
import assert from 'assert';

// Simple assertion helper
function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert.strictEqual(actual, expected, `FAIL: ${message} — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

function assertDefined<T>(value: T | undefined | null, message: string): asserts value is T {
  assert.notEqual(value, undefined, `FAIL: ${message} — expected defined value, got undefined`);
  assert.notEqual(value, null, `FAIL: ${message} — expected defined value, got null`);
}

function assertGreaterThan(actual: number, threshold: number, message: string): void {
  assert.ok(actual > threshold, `FAIL: ${message} — got ${actual}, expected > ${threshold}`);
}

// ── Test: Golden Path Smoke Test ──────────────────────────────────────────────

async function runGoldenPathTest(): Promise<void> {
  console.log('[SMOKE TEST] Starting: Golden Path — "Why is Spice Garden underperforming?"');

  const provider = new MockAIProvider();

  // Stub MCPClient — override callTool and connect to avoid spawning a process
  const mcpClient = new MCPClient();

  // Override connect to be a no-op
  (mcpClient as unknown as Record<string, unknown>).connect = async () => { /* no-op */ };
  (mcpClient as unknown as Record<string, boolean>).initialized = true;

  // Override callTool with mock evidence
  (mcpClient as unknown as Record<string, unknown>).callTool = async (
    name: string,
    _args: Record<string, unknown>
  ) => {
    const mockResponses: Record<string, Record<string, unknown>> = {
      analyze_restaurant_performance: {
        restaurantName: 'Spice Garden',
        performanceScore: 32,
        rank: { position: 15, outOf: 20, percentile: 25 },
        revenue: { total: 2400, revenueShare: 0.04, benchmark: { avgPerRestaurant: 3500 } },
        orders: { total: 6, benchmark: { avgPerRestaurant: 10 } },
        rating: { current: 3.8, platformAvg: 4.2, assessment: 'below_average' },
        trend: { octToNov: { revenueChange: -0.05 }, novToDec: { revenueChange: 0.02 } },
        issues: [
          { type: 'low_revenue_share', severity: 'high', detail: 'Revenue share 4% vs platform avg 5%' },
          { type: 'low_rating', severity: 'medium', detail: 'Rating 3.8 vs platform avg 4.2' },
        ],
        recommendations: [
          'Review menu pricing and run promotions',
          'Investigate negative reviews',
        ],
        metadata: { dataSource: 'mock' },
      },
      get_restaurant_performance: {
        restaurantName: 'Spice Garden',
        found: true,
        performance: {
          rank: 15,
          totalRestaurants: 20,
          revenue: 2400,
          orders: 6,
          revenueShare: 0.04,
          rating: 3.8,
          city: 'Mumbai',
          cuisine: 'Indian',
        },
        platformBenchmarks: {
          avgRating: 4.2,
          avgCancellationRate: 0.08,
        },
      },
      get_cancellation_metrics: {
        scope: { restaurantName: 'Spice Garden' },
        metrics: {
          totalOrders: 6,
          cancelledOrders: 2,
          cancellationRate: 0.33,
          platformBenchmarkCancellationRate: 0.08,
        },
        assessment: 'above_benchmark',
      },
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(mockResponses[name] || {}) }],
      isError: false,
    };
  };

  const agent = new AIAgent(provider, mcpClient, aiLogger);

  const context: AIExecutionContext = {
    requestId: 'test-req-001',
    traceId: 'test-trace-001',
    userId: 'admin-user-1',
    userRole: 'admin',
    timestamp: new Date(),
    entityName: 'Spice Garden',
    entityType: 'restaurant',
  };

  const request: AIRequest = {
    messages: [{ role: 'user', content: 'Why is Spice Garden underperforming?' }],
    context: { entityName: 'Spice Garden', entityType: 'restaurant' },
  };

  const response = await agent.execute(request, context);

  // ── Assertions ─────────────────────────────────────────────────────────────
  assertDefined(response, 'response should be defined');
  assertEqual(response.requestId, 'test-req-001', 'requestId should match');
  assertEqual(response.traceId, 'test-trace-001', 'traceId should match');
  assertGreaterThan(response.toolCalls.length, 0, 'should have at least 1 tool call');
  assertDefined(response.message, 'message should be defined');
  assertDefined(response.insight, 'insight should be defined for restaurant query');

  if (response.insight) {
    assertDefined(response.insight.finding, 'insight.finding should be defined');
    assertGreaterThan(response.insight.metrics.length, 0, 'insight should have metrics');
    assertGreaterThan(response.insight.evidence.length, 0, 'insight should have evidence');
  }

  console.log('[SMOKE TEST] PASS: Golden path executed successfully');
  console.log(`[SMOKE TEST] Message: ${response.message.substring(0, 100)}...`);
  console.log(`[SMOKE TEST] Tool calls: ${response.toolCalls.map((t) => t.toolName).join(', ')}`);
  console.log(`[SMOKE TEST] Metrics: ${response.insight?.metrics.map((m) => `${m.name}=${m.value}`).join(', ')}`);
  console.log(`[SMOKE TEST] Severity: ${response.insight?.severity}`);
  console.log(`[SMOKE TEST] Execution metadata:`, response.executionMetadata);
}

// ── Test: Platform Summary ────────────────────────────────────────────────────

async function runPlatformSummaryTest(): Promise<void> {
  console.log('\n[SMOKE TEST] Starting: Platform summary query');

  const provider = new MockAIProvider();
  const mcpClient = new MCPClient();
  (mcpClient as unknown as Record<string, unknown>).connect = async () => { /* no-op */ };
  (mcpClient as unknown as Record<string, boolean>).initialized = true;
  (mcpClient as unknown as Record<string, unknown>).callTool = async () => ({
    content: [{ type: 'text', text: JSON.stringify({
      scope: 'all_time',
      metrics: {
        revenue: { total: 45000, platformFees: 7500, unit: 'INR' },
        orders: { total: 120, delivered: 100, cancellationRate: 0.12 },
        averageOrderValue: { value: 450, unit: 'INR' },
      },
    }) }],
    isError: false,
  });

  const agent = new AIAgent(provider, mcpClient, aiLogger);

  const context: AIExecutionContext = {
    requestId: 'test-req-002',
    traceId: 'test-trace-002',
    userId: 'admin-2',
    userRole: 'admin',
    timestamp: new Date(),
  };

  const request: AIRequest = {
    messages: [{ role: 'user', content: 'What is the platform cancellation rate?' }],
  };

  const response = await agent.execute(request, context);

  assertDefined(response, 'platform response should be defined');
  assertEqual(response.requestId, 'test-req-002', 'requestId should match');

  console.log('[SMOKE TEST] PASS: Platform summary query executed');
  console.log(`[SMOKE TEST] Message: ${response.message.substring(0, 100)}`);
}

// ── Run all tests ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('━━━ FoodHub AI Architecture Smoke Tests ━━━\n');
  let passed = 0;
  let failed = 0;

  const tests = [
    { name: 'Golden Path (Spice Garden)', fn: runGoldenPathTest },
    { name: 'Platform Summary', fn: runPlatformSummaryTest },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (err) {
      console.error(`[SMOKE TEST] FAIL: ${test.name}`);
      console.error(err);
      failed++;
    }
  }

  console.log(`\n━━━ Results: ${passed} passed, ${failed} failed ━━━`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[SMOKE TEST] Fatal error:', err);
  process.exit(1);
});
