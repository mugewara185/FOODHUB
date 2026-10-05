import { appConfig } from '../../../core/config/app.config';
export interface AIMetric {
  name: string;
  value: string | number;
  unit?: string;
  benchmark?: string | number;
}

export interface AIEvidence {
  source: string;
  toolName: string;
  dataPreview: any;
}

export interface AIInsight {
  severity: 'critical' | 'warning' | 'info';
  entityName: string;
  finding: string;
  confidence: number; // 0-100
  metrics: AIMetric[];
  likelyCauses: string[];
  recommendations: string[];
  summary: string;
  evidence?: AIEvidence[];
}

export interface ToolCallRecord {
  name: string;
  status: 'success' | 'error' | 'running';
  durationMs?: number;
}

export interface AIResponse {
  message: string;
  insight?: AIInsight;
  toolCalls?: ToolCallRecord[];
}

import { type AIMessage } from './adminAiSlice';

import api from '../../../core/utils/api';

export async function sendAIMessage(messages: AIMessage[], conversationId?: string): Promise<AIResponse> {
  const payload = await api.post<AIResponse>('/admin/ai/chat', { messages, conversationId });
  return payload;
}