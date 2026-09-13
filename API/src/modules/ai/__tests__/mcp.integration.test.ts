/**
 * MCP Integration Test
 * 
 * Tests the actual MCPClient against the real MCP server process.
 * This verifies the stdio JSON-RPC communication path is correct.
 * 
 * Run: npx ts-node src/modules/ai/__tests__/mcp.integration.test.ts
 * 
 * Requires: mcp/dist/index.js must exist (run 'npm run build' in mcp/ first)
 */

import { MCPClient } from '../mcp/mcp.client';
import path from 'path';
import assert from 'assert';

const MCP_SERVER_PATH = path.join(
  __dirname,
  '..', '..', '..', '..', '..', 'mcp', 'dist', 'index.js'
);

async function runMCPIntegrationTest(): Promise<void> {
  console.log('[MCP INTEGRATION] Starting MCPClient → real MCP server test');
  console.log(`[MCP INTEGRATION] MCP server path: ${MCP_SERVER_PATH}`);

  // Override the env so MCPClient finds the server
  process.env.MCP_SERVER_PATH = MCP_SERVER_PATH;

  const client = new MCPClient();

  try {
    // 1. Connect
    console.log('[MCP INTEGRATION] Connecting to MCP server...');
    await client.connect();
    console.log('[MCP INTEGRATION] Connected. isConnected:', client.isConnected());
    assert.ok(client.isConnected(), 'MCPClient should be connected');

    // 2. List tools
    console.log('[MCP INTEGRATION] Listing tools...');
    const tools = await client.listTools();
    console.log(`[MCP INTEGRATION] Found ${tools.length} tools:`, tools.map(t => t.name));
    assert.ok(tools.length >= 6, `Expected at least 6 tools, got ${tools.length}`);
    
    const toolNames = tools.map(t => t.name);
    assert.ok(toolNames.includes('get_analytics_summary'), 'Should have get_analytics_summary');
    assert.ok(toolNames.includes('get_metrics'), 'Should have get_metrics');

    // 3. Call get_analytics_summary
    console.log('[MCP INTEGRATION] Calling get_analytics_summary...');
    const summaryResult = await client.callTool('get_analytics_summary', {
      from: '2024-10-01',
      to: '2024-12-31',
    }, 'test-call-001');

    assert.ok(!summaryResult.isError, 'get_analytics_summary should not error');
    assert.ok(summaryResult.content.length > 0, 'Should have content');

    const summaryText = summaryResult.content[0]?.text;
    assert.ok(summaryText, 'Should have text content');
    const summaryData = JSON.parse(summaryText);
    assert.ok(summaryData.metrics, 'Should have metrics in summary response');
    console.log('[MCP INTEGRATION] Summary metrics:', JSON.stringify(summaryData.metrics, null, 2));

    // 4. Call get_top_entities
    console.log('[MCP INTEGRATION] Calling get_top_entities...');
    const topResult = await client.callTool('get_top_entities', {
      entityType: 'restaurant',
      sortBy: 'revenue',
      limit: 3,
      from: '2024-10-01',
      to: '2024-12-31',
    }, 'test-call-002');

    assert.ok(!topResult.isError, 'get_top_entities should not error');
    const topData = JSON.parse(topResult.content[0]?.text || '{}');
    assert.ok(Array.isArray(topData.results), 'Should have results array');
    assert.ok(topData.results.length > 0, 'Should have at least 1 restaurant');
    console.log('[MCP INTEGRATION] Top restaurants:', topData.results.map((r: Record<string, unknown>) => `${r.name} (₹${r.revenue})`));

    // 5. Call new analyze_restaurant_performance tool
    if (toolNames.includes('analyze_restaurant_performance')) {
      console.log('[MCP INTEGRATION] Calling analyze_restaurant_performance...');
      const analysisResult = await client.callTool('analyze_restaurant_performance', {
        restaurantName: 'Spice Garden',
      }, 'test-call-003');

      if (!analysisResult.isError) {
        const analysisData = JSON.parse(analysisResult.content[0]?.text || '{}');
        console.log('[MCP INTEGRATION] Analysis result:', {
          restaurantName: analysisData.restaurantName,
          performanceScore: analysisData.performanceScore,
          rank: analysisData.rank,
          issues: analysisData.issues?.length,
        });
      } else {
        console.log('[MCP INTEGRATION] analyze_restaurant_performance error:', analysisResult.content[0]?.text);
      }
    } else {
      console.log('[MCP INTEGRATION] Note: analyze_restaurant_performance tool not yet built into MCP dist. Run: npm run build in mcp/');
    }

    console.log('\n[MCP INTEGRATION] ALL TESTS PASSED ✓');
    console.log('[MCP INTEGRATION] Real MCP connection verified');

  } finally {
    await client.disconnect();
    console.log('[MCP INTEGRATION] Client disconnected');
  }
}

runMCPIntegrationTest().catch((err) => {
  console.error('[MCP INTEGRATION] FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
