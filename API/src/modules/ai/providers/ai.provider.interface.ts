import { AIRequest, AIResponse, AIExecutionContext, AIEvidence } from '../types/ai.types';

export interface AIProviderCapabilities {
  provider: string;
  model: string;
  supportedFeatures: ('chat' | 'structured_output' | 'tool_calling')[];
  maxContextTokens: number;
}

export interface AIProviderGenerateInput {
  request: AIRequest;
  context: AIExecutionContext;
  evidence: AIEvidence[];
  systemPrompt?: string;
}

export interface AIProvider {
  generate(input: AIProviderGenerateInput): Promise<AIResponse>;
  capabilities(): AIProviderCapabilities;
}
