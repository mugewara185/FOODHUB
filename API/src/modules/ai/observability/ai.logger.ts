export type AIEventType = 
  | 'ai:request:start'
  | 'ai:context:created'
  | 'ai:provider:start'
  | 'ai:provider:complete'
  | 'ai:provider:error'
  | 'mcp:request:start'
  | 'mcp:tool:start'
  | 'mcp:tool:complete'
  | 'mcp:tool:error'
  | 'analytics:query:start'
  | 'analytics:query:complete'
  | 'analytics:query:error'
  | 'ai:response:complete'
  | 'ai:response:error';

export interface AILogEvent {
  event: AIEventType;
  requestId: string;
  traceId: string;
  conversationId?: string;
  userId?: string;
  toolCallId?: string;
  toolName?: string;
  provider?: string;
  model?: string;
  durationMs?: number;
  status?: 'start' | 'success' | 'error' | 'timeout';
  entityName?: string;
  error?: string;
  [key: string]: unknown;
}

export class AILogger {
  log(event: AILogEvent): void {
    // Basic sanitization
    const sanitized = { ...event };
    delete sanitized.apiKey;
    delete sanitized.password;
    delete sanitized.token;
    
    if (process.env.NODE_ENV === 'development') {
      const color = event.status === 'error' ? '\x1b[31m' : '\x1b[36m';
      console.log(`${color}[AI] ${event.event}\x1b[0m`, JSON.stringify(sanitized));
    } else {
      console.log(JSON.stringify({
        ...sanitized,
        timestamp: new Date().toISOString()
      }));
    }
  }

  startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }
}

export const aiLogger = new AILogger();
