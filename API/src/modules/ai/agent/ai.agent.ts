import { AIProvider } from '../providers/ai.provider.interface';
import { MCPClient } from '../mcp/mcp.client';
import { AILogger } from '../observability/ai.logger';
import {
  AIRequest,
  AIResponse,
  AIExecutionContext,
  AIEvidence,
  ToolCallRecord,
  AIErrorCode,
  AIError,
} from '../types/ai.types';
import crypto from 'crypto';

// Default Q4 2024 range matching MCP mock data
const DEFAULT_FROM = '2024-10-01';
const DEFAULT_TO = '2024-12-31';

/**
 * Extracts a restaurant name from the user message.
 * Returns null if no restaurant name can be detected.
 */
function extractRestaurantName(message: string): string | null {
  // Known restaurants in the mock data
  const knownRestaurants = [
    'Spice Garden',
    'Pizza Paradise',
    'Burger House',
    'Sushi Master',
    'Taco Fiesta',
    'Dragon Palace',
    'The Biryani Co',
    'Coastal Cravings',
    'The Cake Studio',
    'Green Bowl',
    'Kathi Roll King',
    'The South Indian',
    'Pav Bhaji Express',
    'Noodle Nest',
    'Tandoor Tales',
    'The Continental',
    'Waffle House',
    'Mughal Darbar',
    'The Sandwich Co',
    'Street Food Hub',
  ];

  const lower = message.toLowerCase();
  for (const name of knownRestaurants) {
    if (lower.includes(name.toLowerCase())) {
      return name;
    }
  }
  return null;
}

/**
 * Determines which MCP tools to call and with what arguments,
 * based on the user question and execution context.
 */
function planToolCalls(
  request: AIRequest,
  context: AIExecutionContext
): Array<{ toolName: string; args: Record<string, unknown> }> {
  const lastMessage = request.messages[request.messages.length - 1]?.content || '';
  const lower = lastMessage.toLowerCase();

  // Detect restaurant name from message or context
  const restaurantName =
    context.entityName || extractRestaurantName(lastMessage);

  if (restaurantName) {
    // Restaurant-specific investigation path (golden path)
    return [
      {
        toolName: 'analyze_restaurant_performance',
        args: { restaurantName },
      },
      {
        toolName: 'get_restaurant_performance',
        args: { restaurantName, from: DEFAULT_FROM, to: DEFAULT_TO },
      },
      {
        toolName: 'get_cancellation_metrics',
        args: { restaurantName, from: DEFAULT_FROM, to: DEFAULT_TO },
      },
    ];
  }

  // Cancellation-specific question
  if (lower.includes('cancel')) {
    return [
      {
        toolName: 'get_cancellation_metrics',
        args: { from: DEFAULT_FROM, to: DEFAULT_TO },
      },
      {
        toolName: 'get_analytics_summary',
        args: { from: DEFAULT_FROM, to: DEFAULT_TO },
      },
    ];
  }

  // Trend/performance question
  if (lower.includes('trend') || lower.includes('revenue')) {
    return [
      {
        toolName: 'get_analytics_summary',
        args: { from: DEFAULT_FROM, to: DEFAULT_TO },
      },
      {
        toolName: 'analyze_trend',
        args: { metric: 'revenue', from: DEFAULT_FROM, to: DEFAULT_TO, granularity: 'month' },
      },
    ];
  }

  // Top restaurants question
  if (lower.includes('top') || lower.includes('best') || lower.includes('perform')) {
    return [
      {
        toolName: 'get_top_entities',
        args: {
          entityType: 'restaurant',
          sortBy: 'revenue',
          limit: 5,
          from: DEFAULT_FROM,
          to: DEFAULT_TO,
        },
      },
      {
        toolName: 'get_analytics_summary',
        args: { from: DEFAULT_FROM, to: DEFAULT_TO },
      },
    ];
  }

  // Default: platform summary + metrics
  return [
    {
      toolName: 'get_analytics_summary',
      args: { from: DEFAULT_FROM, to: DEFAULT_TO },
    },
    {
      toolName: 'get_metrics',
      args: {
        metrics: ['revenue', 'orders', 'cancellation_rate', 'avg_order_value'],
        from: DEFAULT_FROM,
        to: DEFAULT_TO,
      },
    },
  ];
}

/**
 * AIAgent — central AI orchestrator.
 *
 * Responsibilities:
 * 1. Establish execution context
 * 2. Plan which MCP tools to call
 * 3. Execute MCP tools via MCPClient
 * 4. Collect structured evidence
 * 5. Ground response in retrieved evidence via AIProvider
 * 6. Emit structured observability events throughout
 * 7. Return normalized AIResponse
 *
 * The agent does NOT query MongoDB directly.
 * The agent does NOT contain FoodHub-specific Mongo queries.
 * All data retrieval happens through the MCP tool boundary.
 */
export class AIAgent {
  constructor(
    private readonly provider: AIProvider,
    private readonly mcpClient: MCPClient,
    private readonly logger: AILogger
  ) {}

  async execute(
    request: AIRequest,
    context: AIExecutionContext
  ): Promise<AIResponse> {
    const getDuration = this.logger.startTimer();
    const toolCalls: ToolCallRecord[] = [];
    const evidence: AIEvidence[] = [];

    // ── 1. Log request start ──────────────────────────────────────────────────
    this.logger.log({
      event: 'ai:request:start',
      requestId: context.requestId,
      traceId: context.traceId,
      conversationId: context.conversationId,
      userId: context.userId,
      status: 'start',
    });

    this.logger.log({
      event: 'ai:context:created',
      requestId: context.requestId,
      traceId: context.traceId,
      entityName: context.entityName,
      entityType: context.entityType,
      status: 'start',
    });

    try {
      // ── 2. Plan tool calls ────────────────────────────────────────────────
      const plannedTools = planToolCalls(request, context);

      // ── 3. Ensure MCP client is connected ────────────────────────────────
      this.logger.log({
        event: 'mcp:request:start',
        requestId: context.requestId,
        traceId: context.traceId,
        status: 'start',
      });

      try {
        await this.mcpClient.connect();
      } catch (connError: unknown) {
        const msg = connError instanceof Error ? connError.message : String(connError);
        this.logger.log({
          event: 'mcp:tool:error',
          requestId: context.requestId,
          traceId: context.traceId,
          toolName: 'connect',
          status: 'error',
          error: `MCP connection failed: ${msg}`,
        });
        // Continue — provider will generate best-effort response with no evidence
      }

      // ── 4. Execute MCP tools ──────────────────────────────────────────────
      for (const { toolName, args } of plannedTools) {
        const toolCallId = crypto.randomUUID();
        const getToolDuration = this.logger.startTimer();

        this.logger.log({
          event: 'mcp:tool:start',
          requestId: context.requestId,
          traceId: context.traceId,
          toolCallId,
          toolName,
          status: 'start',
        });

        try {
          const result = await this.mcpClient.callTool(toolName, args, toolCallId);
          const duration = getToolDuration();

          if (result.isError) {
            const errorText = result.content[0]?.text || 'Tool execution failed';
            toolCalls.push({
              toolCallId,
              toolName,
              arguments: args,
              status: 'error',
              durationMs: duration,
              error: errorText,
            });

            this.logger.log({
              event: 'mcp:tool:error',
              requestId: context.requestId,
              traceId: context.traceId,
              toolCallId,
              toolName,
              status: 'error',
              durationMs: duration,
              error: errorText,
            });
          } else {
            // Parse JSON result from MCP text content
            const dataStr = result.content.find((c) => c.type === 'text')?.text || '{}';
            let data: Record<string, unknown> = {};
            try {
              data = JSON.parse(dataStr);
            } catch {
              data = { raw: dataStr };
            }

            evidence.push({
              source: 'mcp',
              toolCallId,
              toolName,
              data,
              retrievedAt: new Date(),
              durationMs: duration,
            });

            toolCalls.push({
              toolCallId,
              toolName,
              arguments: args,
              status: 'success',
              durationMs: duration,
              result: data,
            });

            this.logger.log({
              event: 'mcp:tool:complete',
              requestId: context.requestId,
              traceId: context.traceId,
              toolCallId,
              toolName,
              status: 'success',
              durationMs: duration,
            });
          }
        } catch (toolError: unknown) {
          const duration = getToolDuration();
          const msg = toolError instanceof Error ? toolError.message : String(toolError);

          this.logger.log({
            event: 'mcp:tool:error',
            requestId: context.requestId,
            traceId: context.traceId,
            toolCallId,
            toolName,
            status: 'error',
            durationMs: duration,
            error: msg,
          });

          toolCalls.push({
            toolCallId,
            toolName,
            arguments: args,
            status: 'error',
            durationMs: duration,
            error: msg,
          });
          // Continue — collect as much evidence as possible
        }
      }

      // ── 5. Call AI Provider ───────────────────────────────────────────────
      const caps = this.provider.capabilities();

      this.logger.log({
        event: 'ai:provider:start',
        requestId: context.requestId,
        traceId: context.traceId,
        provider: caps.provider,
        model: caps.model,
        status: 'start',
      });

      let response: AIResponse;
      try {
        response = await this.provider.generate({
          request,
          context,
          evidence,
        });
      } catch (providerError: unknown) {
        const msg = providerError instanceof Error ? providerError.message : String(providerError);
        this.logger.log({
          event: 'ai:provider:error',
          requestId: context.requestId,
          traceId: context.traceId,
          provider: caps.provider,
          status: 'error',
          error: msg,
        });
        throw new AIError(
          AIErrorCode.PROVIDER_ERROR,
          msg,
          'AI provider failed to generate response.',
          providerError instanceof Error ? providerError : undefined
        );
      }

      // Attach the tool call audit trail
      response.toolCalls = toolCalls;

      this.logger.log({
        event: 'ai:provider:complete',
        requestId: context.requestId,
        traceId: context.traceId,
        provider: caps.provider,
        model: caps.model,
        status: 'success',
        durationMs: response.executionMetadata.durationMs,
      });

      // ── 6. Final response ─────────────────────────────────────────────────
      const totalDuration = getDuration();

      this.logger.log({
        event: 'ai:response:complete',
        requestId: context.requestId,
        traceId: context.traceId,
        conversationId: context.conversationId,
        status: 'success',
        durationMs: totalDuration,
      });

      return response;
    } catch (error: unknown) {
      const totalDuration = getDuration();
      const msg = error instanceof Error ? error.message : String(error);

      this.logger.log({
        event: 'ai:response:error',
        requestId: context.requestId,
        traceId: context.traceId,
        status: 'error',
        durationMs: totalDuration,
        error: msg,
      });

      if (error instanceof AIError) {
        throw error;
      }

      throw new AIError(
        AIErrorCode.PROVIDER_ERROR,
        msg,
        'Failed to generate AI response. Please try again later.',
        error instanceof Error ? error : undefined
      );
    }
  }
}
