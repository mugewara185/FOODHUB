# Provider Swap Guide

Everything needed to add a real LLM provider (Claude or OpenAI) alongside the mock.

---

## Current AIProvider Interface

Exact content of `API/src/modules/ai/providers/ai.provider.interface.ts`:

```typescript
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
  evidence: AIEvidence[];   // Pre-retrieved tool evidence to ground the response
  systemPrompt?: string;
}

export interface AIProvider {
  generate(input: AIProviderGenerateInput): Promise<AIResponse>;
  capabilities(): AIProviderCapabilities;
}
```

---

## How the Factory Picks the Provider

`API/src/modules/ai/providers/provider.factory.ts` reads `process.env.AI_PROVIDER`:

```typescript
switch (providerType) {
  case 'claude':
    if (!process.env.AI_API_KEY) throw new Error('AI_API_KEY required');
    throw new Error('Claude provider not yet implemented');  // ← replace this line
  case 'openai':
    if (!process.env.AI_API_KEY) throw new Error('AI_API_KEY required');
    throw new Error('OpenAI provider not yet implemented'); // ← replace this line
  case 'mock':
  default:
    return new MockAIProvider();
}
```

To add Claude: create `claude.provider.ts`, import it here, return `new ClaudeProvider()`.

---

## Required Env Vars

```env
AI_PROVIDER=claude          # or 'openai'
AI_MODEL=claude-3-5-sonnet-20241022   # or 'gpt-4o'
AI_API_KEY=sk-ant-api03-...           # Anthropic key / OpenAI key
AI_ENDPOINT=                # Leave empty for default Anthropic/OpenAI endpoints
AI_TIMEOUT=30000            # ms — should be generous for real LLMs
```

---

## What the Real Provider MUST Return

The `generate()` method must return a valid `AIResponse`:

```typescript
{
  requestId: context.requestId,     // pass-through from context
  traceId: context.traceId,         // pass-through from context
  conversationId: request.conversationId,
  message: string,                  // natural language response
  insight?: AIInsight,              // structured if parseable from LLM output
  toolCalls: [],                    // DO NOT populate — AIAgent fills this after
  executionMetadata: {
    provider: string,               // 'claude' or 'openai'
    model: string,
    durationMs: number,             // measure with Date.now() start/end
    mcpToolCount: evidence.length,
  }
}
```

---

## What the AIAgent Provides to the Provider

The provider receives `AIProviderGenerateInput`:

```typescript
{
  request: AIRequest,         // contains messages[] (the conversation)
  context: AIExecutionContext, // requestId, traceId, userId, entityName etc.
  evidence: AIEvidence[],     // pre-retrieved MCP tool results
}
```

**Key: evidence is pre-populated.** The real provider does NOT call any MCP tools — the AIAgent already called them. The provider just synthesizes evidence into a response.

**Each `AIEvidence` item contains:**
```typescript
{
  source: 'mcp',
  toolCallId: string,
  toolName: string,   // e.g. 'analyze_restaurant_performance'
  data: Record<string, unknown>,  // the parsed JSON from the tool result
  retrievedAt: Date,
  durationMs: number
}
```

---

## What the AIAgent Does vs. What the Provider Does

| Responsibility | AIAgent | AIProvider |
|---------------|---------|------------|
| Tool planning | ✅ | ❌ |
| MCP tool calls | ✅ | ❌ |
| Evidence collection | ✅ | ❌ |
| System prompt assembly | ❌ | ✅ |
| Calling the LLM API | ❌ | ✅ |
| Parsing LLM output to AIInsight | ❌ | ✅ |
| Tool call audit trail | ✅ (after provider returns) | ❌ |
| Observability logging | ✅ | ❌ (provider should not log) |

---

## What MockAIProvider Does That Real Provider Must NOT

1. **Parses evidence to determine severity/metrics** — a real LLM reads the evidence text and reasons about it. The mock hardcodes patterns. Real provider: include the evidence as context in the LLM system prompt.

2. **Returns deterministic insight** — mock always returns the same insight for "Spice Garden." Real LLM: varies. This is expected and desired.

3. **Simulates latency** (`await new Promise(r => setTimeout(r, 200))`) — real provider: no artificial delay needed, real API latency is the delay.

---

## Recommended Claude Implementation Approach

```typescript
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.AI_API_KEY });
  }

  capabilities(): AIProviderCapabilities {
    return {
      provider: 'claude',
      model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
      supportedFeatures: ['chat', 'structured_output'],
      maxContextTokens: 200000,
    };
  }

  async generate(input: AIProviderGenerateInput): Promise<AIResponse> {
    const start = Date.now();
    
    // Build system prompt with evidence
    const systemPrompt = this.buildSystemPrompt(input.evidence, input.context);
    
    // Build messages from conversation
    const messages = input.request.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await this.client.messages.create({
      model: this.capabilities().model,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
    // Try to parse structured insight from the LLM output
    const insight = this.parseInsightFromText(text, input.evidence);

    return {
      requestId: input.context.requestId,
      traceId: input.context.traceId,
      conversationId: input.request.conversationId,
      message: text,
      insight,
      toolCalls: [], // AIAgent fills this
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      executionMetadata: {
        provider: 'claude',
        model: this.capabilities().model,
        durationMs: Date.now() - start,
        mcpToolCount: input.evidence.length,
      },
    };
  }

  private buildSystemPrompt(evidence: AIEvidence[], context: AIExecutionContext): string {
    const evidenceText = evidence.map(e =>
      `## Tool: ${e.toolName}\n\`\`\`json\n${JSON.stringify(e.data, null, 2)}\n\`\`\``
    ).join('\n\n');

    return `You are the FoodHub AI Analytics Assistant. You have retrieved the following analytics data via MCP tools:

${evidenceText}

Based ONLY on this data, answer the user's question. Format your response clearly.
If asked about a restaurant's performance, provide:
1. A finding (one sentence summary)
2. Key metrics with benchmarks
3. Likely causes
4. Actionable recommendations

Entity context: ${context.entityName ? `Restaurant: ${context.entityName}` : 'Platform-wide'}`;
  }

  private parseInsightFromText(text: string, evidence: AIEvidence[]): AIInsight | undefined {
    // Attempt to extract structured insight from the LLM text response
    // This is optional — if parsing fails, return undefined and show raw text
    // A production implementation would ask the LLM for JSON output
    return undefined;
  }
}
```

**Install:** `cd API && npm install @anthropic-ai/sdk`

---

## Testing the New Provider Without Real Credentials

You can stub `AI_API_KEY=sk-test-fake` and mock the Anthropic client in the smoke test, exactly as the MCP client is mocked. The interface guarantees the same test pattern works.
