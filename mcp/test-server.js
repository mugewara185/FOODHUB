const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { createMcpExpressApp } = require('@modelcontextprotocol/sdk/server/express.js');

async function main() {
  const server = new McpServer({ name: 'test', version: '1.0.0' });
  
  const app = createMcpExpressApp();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  
  app.all('/mcp', async (req, res) => {
    await transport.handleRequest(req, res, req.body);
  });
  
  await server.connect(transport);
  
  app.listen(3000, () => console.log('Listening on 3000'));
}
main();
