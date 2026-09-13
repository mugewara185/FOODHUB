export interface AIExecutionContext {
  requestId: string;
  traceId: string;
  conversationId?: string;
  userId: string;
  userRole: string;
  timestamp: Date;
  entityType?: 'restaurant' | 'order' | 'user' | 'platform';
  entityId?: string;
  entityName?: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  conversationId?: string;
  messages: AIMessage[];
  context?: {
    entityType?: string;
    entityId?: string;
    entityName?: string;
  };
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface AIEvidence {
  source: string;
  toolCallId: string;
  toolName: string;
  data: Record<string, unknown>;
  retrievedAt: Date;
  durationMs: number;
}

export interface ToolCallRecord {
  toolCallId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  status: 'success' | 'error' | 'timeout' | 'unavailable';
  durationMs: number;
  result?: unknown;
  error?: string;
}

export interface AIMetric {
  name: string;
  value: number | string;
  unit?: string;
  benchmark?: number | string;
  status?: 'good' | 'warning' | 'critical' | 'info';
}

export interface AIInsight {
  finding: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
  entity?: {
    type: string;
    id?: string;
    name: string;
  };
  metrics: AIMetric[];
  evidence: AIEvidence[];
  likelyCauses: string[];
  recommendations: string[];
  summary: string;
}

export interface AIResponse {
  requestId: string;
  traceId: string;
  conversationId?: string;
  message: string;
  insight?: AIInsight;
  toolCalls: ToolCallRecord[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  executionMetadata: {
    provider: string;
    model: string;
    durationMs: number;
    mcpToolCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export enum AIErrorCode {
  VALIDATION_ERROR = 'AI_VALIDATION_ERROR',
  PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  MCP_CONNECTION_ERROR = 'AI_MCP_CONNECTION_ERROR',
  MCP_TOOL_ERROR = 'AI_MCP_TOOL_ERROR',
  ANALYTICS_ERROR = 'AI_ANALYTICS_ERROR',
  TIMEOUT_ERROR = 'AI_TIMEOUT_ERROR',
  UNAUTHORIZED = 'AI_UNAUTHORIZED',
}

export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly safeMessage: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AIError';
  }
}
