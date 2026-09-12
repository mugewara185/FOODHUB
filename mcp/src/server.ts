// @ts-nocheck
/**
 * FoodHub Analytics MCP Server
 *
 * Creates and configures the McpServer instance with all tools,
 * resources, and prompts. This module is transport-agnostic —
 * the transport (stdio today, SSE/HTTP in the future) is wired
 * in index.ts, not here.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  registerGetAnalyticsSummaryTool,
  registerGetMetricsTool,
  registerComparePeriodsTool,
  registerGetBreakdownTool,
  registerGetTopEntitiesTool,
  registerAnalyzeTrendTool,
} from './tools/index';
import { registerResources } from './resources/index';
import { registerPrompts } from './prompts/index';

const SERVER_NAME = process.env['MCP_SERVER_NAME'] ?? 'foodhub-analytics';
const SERVER_VERSION = process.env['MCP_SERVER_VERSION'] ?? '1.0.0';

/**
 * Builds and returns a fully configured McpServer instance.
 * Does NOT connect a transport — call server.connect(transport) in index.ts.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // ── Register Analytics Tools ──────────────────────────────────────────────
  // Each tool is registered through a dedicated module for clean separation.
  registerGetAnalyticsSummaryTool(server);
  registerGetMetricsTool(server);
  registerComparePeriodsTool(server);
  registerGetBreakdownTool(server);
  registerGetTopEntitiesTool(server);
  registerAnalyzeTrendTool(server);

  // ── Register Resources ─────────────────────────────────────────────────────
  // Read-only context documents (metric definitions, dimensions, data coverage).
  registerResources(server);

  // ── Register Prompts ───────────────────────────────────────────────────────
  // Pre-built analytics workflows for AI agent consumption.
  registerPrompts(server);

  return server;
}

