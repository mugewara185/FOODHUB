import { AIProvider, AIProviderCapabilities, AIProviderGenerateInput } from './ai.provider.interface';
import { AIResponse, AIInsight } from '../types/ai.types';
import { GoogleGenAI } from '@google/genai';

export class GeminiAIProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      console.warn('AI_API_KEY is not set. GeminiAIProvider will fail if used.');
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'dummy' });
  }

  capabilities(): AIProviderCapabilities {
    return {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      supportedFeatures: ['chat', 'structured_output'],
      maxContextTokens: 128000,
    };
  }

  async generate(input: AIProviderGenerateInput): Promise<AIResponse> {
    const startTime = Date.now();
    const { request, context, evidence, systemPrompt } = input;

    // Delivery-operations specific path
    const isDeliveryCopilot = systemPrompt?.includes('FoodHub Operations Copilot');
    
    if (isDeliveryCopilot) {
      try {
        const lastMessage = request.messages[request.messages.length - 1]?.content || '';
        const payload = JSON.stringify({
          question: lastMessage,
          riskFacts: evidence.filter(e => e.toolName === 'risk_facts').map(e => e.data),
          deliverySummaries: evidence.filter(e => e.toolName === 'delivery_summaries').map(e => e.data)
        });

        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: payload,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                answer: { type: "STRING" },
                citedDeliveryId: { type: "STRING", nullable: true },
                citedEvidence: { type: "ARRAY", items: { type: "STRING" }, nullable: true },
                confidence: { type: "STRING", enum: ["low", "medium", "high"] }
              },
              required: ["answer", "confidence"]
            }
          }
        });

        const text = response.text || "{}";
        const result = JSON.parse(text);

        return {
          requestId: context.requestId,
          traceId: context.traceId,
          conversationId: request.conversationId,
          message: result.answer,
          insight: {
            finding: result.answer,
            severity: 'info',
            confidence: result.confidence === 'high' ? 0.9 : result.confidence === 'medium' ? 0.6 : 0.3,
            metrics: [],
            evidence: [],
            likelyCauses: [],
            recommendations: [],
            summary: result.answer
          },
          toolCalls: [],
          executionMetadata: {
            provider: 'gemini',
            model: 'gemini-2.5-flash',
            durationMs: Date.now() - startTime,
            mcpToolCount: 0,
          },
          ...result 
        };
      } catch (err) {
        console.error('Gemini generate error:', err);
        throw err;
      }
    }

    // Default fallback to dummy/mock behavior if not delivery copilot for now
    throw new Error('Gemini provider only implemented for FoodHub Operations Copilot path.');
  }
}
