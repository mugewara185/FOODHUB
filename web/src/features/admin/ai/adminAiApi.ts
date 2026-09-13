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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function sendAIMessage(messages: AIMessage[], conversationId?: string): Promise<AIResponse> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/admin/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, conversationId }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'AI request failed');
  }

  const data = await response.json();
  return data.data as AIResponse;
}
