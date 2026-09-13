import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AIInsight, AIResponse, ToolCallRecord } from './adminAiApi';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  insight?: AIInsight;
  toolCalls?: ToolCallRecord[];
  requestId?: string;
  traceId?: string;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIInvestigation {
  id: string;
  question: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  toolsUsed: string[];
  insight: AIInsight | null;
  response: AIResponse | null;
  createdAt: string;
}

export interface AdminAIState {
  currentConversation: AIConversation | null;
  conversations: AIConversation[];
  isLoading: boolean;
  error: string | null;
  activeToolCalls: string[];
  currentInvestigation: AIInvestigation | null;
}

const initialState: AdminAIState = {
  currentConversation: null,
  conversations: [],
  isLoading: false,
  error: null,
  activeToolCalls: [],
  currentInvestigation: null,
};

const adminAiSlice = createSlice({
  name: 'adminAi',
  initialState,
  reducers: {
    startConversation(state) {
      const newConv: AIConversation = {
        id: crypto.randomUUID(),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.currentConversation = newConv;
      state.conversations.push(newConv);
      state.error = null;
    },
    addUserMessage(state, action: PayloadAction<string>) {
      if (!state.currentConversation) {
        state.currentConversation = {
          id: crypto.randomUUID(),
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.conversations.push(state.currentConversation);
      }
      state.currentConversation.messages.push({
        role: 'user',
        content: action.payload,
        timestamp: new Date().toISOString(),
      });
      state.currentConversation.updatedAt = new Date().toISOString();
    },
    addAssistantMessage(state, action: PayloadAction<AIResponse>) {
      if (state.currentConversation) {
        state.currentConversation.messages.push({
          role: 'assistant',
          content: action.payload.message,
          timestamp: new Date().toISOString(),
          insight: action.payload.insight,
          toolCalls: action.payload.toolCalls,
        });
        state.currentConversation.updatedAt = new Date().toISOString();
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearConversation(state) {
      state.currentConversation = null;
      state.error = null;
    },
    setCurrentInvestigation(state, action: PayloadAction<AIInvestigation | null>) {
      state.currentInvestigation = action.payload;
    },
  },
});

export const {
  startConversation,
  addUserMessage,
  addAssistantMessage,
  setLoading,
  setError,
  clearConversation,
  setCurrentInvestigation,
} = adminAiSlice.actions;

export default adminAiSlice.reducer;
