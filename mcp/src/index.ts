/**
 * FoodHub Analytics MCP Server — Entry Point
 *
 * Connects the McpServer to the stdio transport.
 * stdio is the standard transport for local MCP usage:
 *  - Claude Desktop reads/writes via process stdin/stdout
 *  - MCP Inspector spawns this process and communicates the same way
 *
 * Transport selection:
 *  - Currently: stdio only (correct for local/desktop MCP usage)
 *  - Future: add an SSE/HTTP transport here when the web admin integration is built
 *    (see README.md — "Future Integration" section for architecture details)
 */

/// <reference types="node" />

import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server';

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  // Errors in tool handlers are caught per-tool; this catches unexpected crashes
  process.on('uncaughtException', (err) => {
    process.stderr.write(`[foodhub-mcp] Uncaught exception: ${err.message}\n`);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    process.stderr.write(`[foodhub-mcp] Unhandled rejection: ${String(reason)}\n`);
    process.exit(1);
  });

  await server.connect(transport);

  // Log to stderr (not stdout — stdout is reserved for the MCP protocol)
  process.stderr.write(`[foodhub-mcp] Server running on stdio. Ready for MCP client connections.\n`);
}

main().catch((err: Error) => {
  process.stderr.write(`[foodhub-mcp] Fatal startup error: ${err.message}\n`);
  process.exit(1);
});
