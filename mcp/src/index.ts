/**
 * FoodHub Analytics MCP Server — Entry Point
 *
 * Connects the McpServer to the appropriate transport based on the TRANSPORT
 * environment variable (stdio or http).
 */

/// <reference types="node" />

import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { createServer } from './server';

async function main(): Promise<void> {
  const server = createServer();
  const transportType = process.env.TRANSPORT === 'http' ? 'http' : 'stdio';

  // Errors in tool handlers are caught per-tool; this catches unexpected crashes
  process.on('uncaughtException', (err) => {
    process.stderr.write(`[foodhub-mcp] Uncaught exception: ${err.message}\n`);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    process.stderr.write(`[foodhub-mcp] Unhandled rejection: ${String(reason)}\n`);
    process.exit(1);
  });

  if (transportType === 'http') {
    // Stateless HTTP Transport (Ideal for cloud/serverless scaling and local HTTP proxying)
    const app = createMcpExpressApp();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    // Optional: Add simple API key validation middleware for testing/production
    const API_KEY = process.env.API_KEY;

    app.all('/mcp', async (req, res) => {
      // Basic auth check if API_KEY is configured
      if (API_KEY) {
        const authHeader = req.headers.authorization || req.headers['x-api-key'];
        if (authHeader !== `Bearer ${API_KEY}` && authHeader !== API_KEY) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }
      
      await transport.handleRequest(req, res, req.body);
    });

    // Health check endpoint for cloud load balancers
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', server: 'foodhub-mcp-server' });
    });

    await server.connect(transport);
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      process.stderr.write(`[foodhub-mcp] Server running on HTTP. Ready at http://localhost:${port}/mcp\n`);
    });

  } else {
    // Stdio Transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Log to stderr (not stdout — stdout is reserved for the MCP protocol)
    process.stderr.write(`[foodhub-mcp] Server running on stdio. Ready for MCP client connections.\n`);
  }
}

main().catch((err: Error) => {
  process.stderr.write(`[foodhub-mcp] Fatal startup error: ${err.message}\n`);
  process.exit(1);
});
