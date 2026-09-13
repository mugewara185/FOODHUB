import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { createInterface, Interface } from 'readline';

export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export class MCPClient {
  private process: ChildProcess | null = null;
  private rl: Interface | null = null;
  private initialized = false;
  private messageId = 1;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();
  
  async connect(): Promise<void> {
    if (this.process) return;

    const serverPath = process.env.MCP_SERVER_PATH || path.join(process.cwd(), '..', 'mcp', 'dist', 'index.js');
    
    this.process = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    if (!this.process.stdout || !this.process.stdin) {
        throw new Error('Failed to create stdio streams for MCP process');
    }

    this.rl = createInterface({
      input: this.process.stdout,
      terminal: false,
    });

    this.rl.on('line', (line) => this.handleMessage(line));

    this.process.on('error', (err) => {
      console.error('MCP process error:', err);
    });

    this.process.on('exit', () => {
      this.process = null;
      this.initialized = false;
      this.pendingRequests.forEach((p) => p.reject(new Error('MCP process exited')));
      this.pendingRequests.clear();
    });

    // Initialize MCP
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'foodhub-ai', version: '1.0.0' }
    });
    
    // Some MCP servers require an initialized notification after initialize request
    this.sendNotification('notifications/initialized', {});
    this.initialized = true;
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.initialized = false;
    }
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.initialized) await this.connect();
    const result = await this.sendRequest('tools/list', {}) as any;
    return result.tools || [];
  }

  async callTool(name: string, args: Record<string, unknown>, toolCallId: string): Promise<MCPToolResult> {
    if (!this.initialized) await this.connect();
    try {
      const result = await this.sendRequest('tools/call', { name, arguments: args });
      return result as MCPToolResult;
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: error.message || 'Unknown error calling tool' }],
        isError: true
      };
    }
  }

  async listResources(): Promise<Array<{ uri: string; name: string }>> {
    if (!this.initialized) await this.connect();
    const result = await this.sendRequest('resources/list', {}) as any;
    return result.resources || [];
  }

  isConnected(): boolean {
    return this.process !== null && !this.process.killed && this.initialized;
  }

  private handleMessage(line: string) {
    if (!line.trim()) return;
    try {
      const msg = JSON.parse(line);
      if (msg.id && this.pendingRequests.has(msg.id)) {
        const { resolve, reject, timeout } = this.pendingRequests.get(msg.id)!;
        clearTimeout(timeout);
        this.pendingRequests.delete(msg.id);
        
        if (msg.error) {
          reject(new Error(msg.error.message || 'MCP Error'));
        } else {
          resolve(msg.result);
        }
      }
    } catch (e) {
      console.error('Failed to parse MCP message:', line);
    }
  }

  private sendRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin) {
        return reject(new Error('Not connected'));
      }

      const id = this.messageId++;
      const timeoutMs = parseInt(process.env.AI_TIMEOUT || '30000', 10);
      
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCP request timeout after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      const payload = JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params
      }) + '\n';

      this.process.stdin.write(payload);
    });
  }

  private sendNotification(method: string, params: any) {
     if (!this.process || !this.process.stdin) return;
     const payload = JSON.stringify({
        jsonrpc: '2.0',
        method,
        params
      }) + '\n';
      this.process.stdin.write(payload);
  }
}
