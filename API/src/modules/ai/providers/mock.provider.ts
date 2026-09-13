import { AIProvider, AIProviderCapabilities, AIProviderGenerateInput } from './ai.provider.interface';
import { AIResponse, AIInsight, AIMetric, AIEvidence } from '../types/ai.types';

/**
 * MockAIProvider
 *
 * Exercises the full AIProvider interface and produces structured AIInsight
 * grounded in the evidence retrieved by the AI Agent from MCP tools.
 *
 * IMPORTANT: This provider never fabricates metrics not present in evidence.
 * If a metric cannot be retrieved, the response explicitly states so.
 *
 * This is NOT a shortcut: Admin → hardcoded response.
 * The full path is: Admin → AIAgent → MCPClient → MockProvider → AIInsight.
 * The MockProvider only runs AFTER real MCP tool evidence has been collected.
 */
export class MockAIProvider implements AIProvider {
  capabilities(): AIProviderCapabilities {
    return {
      provider: 'mock',
      model: 'mock-v1',
      supportedFeatures: ['chat', 'structured_output', 'tool_calling'],
      maxContextTokens: 4096,
    };
  }

  async generate(input: AIProviderGenerateInput): Promise<AIResponse> {
    // Simulate provider latency
    await new Promise((resolve) => setTimeout(resolve, 200));

    const startTime = Date.now();
    const { request, context, evidence } = input;

    // ── Extract last user message ─────────────────────────────────────────
    const lastMessage = request.messages[request.messages.length - 1]?.content || '';
    const lower = lastMessage.toLowerCase();

    // ── Detect entity name ────────────────────────────────────────────────
    const restaurantName = context.entityName || this.extractRestaurantName(lower);

    // ── Build insight from evidence ───────────────────────────────────────
    if (restaurantName) {
      return this.buildRestaurantInsight(restaurantName, evidence, startTime, request, context);
    }

    return this.buildPlatformInsight(evidence, startTime, request, context, lower);
  }

  // ── Restaurant-specific insight ─────────────────────────────────────────

  private buildRestaurantInsight(
    restaurantName: string,
    evidence: AIEvidence[],
    startTime: number,
    request: AIProviderGenerateInput['request'],
    context: AIProviderGenerateInput['context']
  ): AIResponse {
    const metrics: AIMetric[] = [];
    let finding = `Analysis of ${restaurantName} based on Q4 2024 data.`;
    let summary = '';
    let likelyCauses: string[] = [];
    let recommendations: string[] = [];
    let severity: 'info' | 'warning' | 'critical' = 'info';

    // Parse evidence from analyze_restaurant_performance tool
    const perfAnalysis = evidence.find((e) => e.toolName === 'analyze_restaurant_performance');
    const perfSnapshot = evidence.find((e) => e.toolName === 'get_restaurant_performance');
    const cancellationEv = evidence.find((e) => e.toolName === 'get_cancellation_metrics');

    let performanceScore: number | null = null;
    let rank: number | null = null;
    let totalRestaurants: number | null = null;
    let revenue: number | null = null;
    let revenueShare: number | null = null;
    let rating: number | null = null;
    let platformAvgRating: number | null = null;
    let cancellationRate: number | null = null;
    let platformBenchmarkCancellation: number | null = null;
    let issues: Array<{ type: string; severity: string; detail: string }> = [];
    let analysisRecommendations: string[] = [];

    // Extract from analyze_restaurant_performance
    if (perfAnalysis?.data) {
      const d = perfAnalysis.data as Record<string, unknown>;
      if (typeof d.performanceScore === 'number') performanceScore = d.performanceScore;
      if (d.rank && typeof d.rank === 'object') {
        const rankObj = d.rank as Record<string, number>;
        if (typeof rankObj.position === 'number') rank = rankObj.position;
        if (typeof rankObj.outOf === 'number') totalRestaurants = rankObj.outOf;
      }
      if (d.revenue && typeof d.revenue === 'object') {
        const revObj = d.revenue as Record<string, number>;
        if (typeof revObj.total === 'number') revenue = revObj.total;
        if (typeof revObj.revenueShare === 'number') revenueShare = revObj.revenueShare;
      }
      if (d.rating && typeof d.rating === 'object') {
        const ratingObj = d.rating as Record<string, number | string>;
        if (typeof ratingObj.current === 'number') rating = ratingObj.current;
        if (typeof ratingObj.platformAvg === 'number') platformAvgRating = ratingObj.platformAvg;
      }
      if (Array.isArray(d.issues)) {
        issues = d.issues as typeof issues;
      }
      if (Array.isArray(d.recommendations)) {
        analysisRecommendations = d.recommendations as string[];
      }
    }

    // Extract from get_restaurant_performance
    if (perfSnapshot?.data) {
      const d = perfSnapshot.data as Record<string, unknown>;
      const perf = d.performance as Record<string, unknown> | undefined;
      if (perf) {
        if (revenue === null && typeof perf.revenue === 'number') revenue = perf.revenue;
        if (rating === null && typeof perf.rating === 'number') rating = perf.rating;
        if (rank === null && typeof perf.rank === 'number') rank = perf.rank;
        if (totalRestaurants === null && typeof perf.totalRestaurants === 'number') {
          totalRestaurants = perf.totalRestaurants;
        }
        if (revenueShare === null && typeof perf.revenueShare === 'number') {
          revenueShare = perf.revenueShare;
        }
      }
      const benchmarks = d.platformBenchmarks as Record<string, unknown> | undefined;
      if (benchmarks) {
        if (platformAvgRating === null && typeof benchmarks.avgRating === 'number') {
          platformAvgRating = benchmarks.avgRating;
        }
        if (platformBenchmarkCancellation === null && typeof benchmarks.avgCancellationRate === 'number') {
          platformBenchmarkCancellation = benchmarks.avgCancellationRate;
        }
      }
    }

    // Extract from get_cancellation_metrics
    if (cancellationEv?.data) {
      const d = cancellationEv.data as Record<string, unknown>;
      const metricsObj = d.metrics as Record<string, unknown> | undefined;
      if (metricsObj) {
        if (typeof metricsObj.cancellationRate === 'number') cancellationRate = metricsObj.cancellationRate;
        if (
          platformBenchmarkCancellation === null &&
          typeof metricsObj.platformBenchmarkCancellationRate === 'number'
        ) {
          platformBenchmarkCancellation = metricsObj.platformBenchmarkCancellationRate;
        }
      }
    }

    // ── Build metrics array ─────────────────────────────────────────────────
    if (performanceScore !== null) {
      const scoreStatus: AIMetric['status'] =
        performanceScore >= 70 ? 'good' : performanceScore >= 40 ? 'warning' : 'critical';
      metrics.push({
        name: 'Performance Score',
        value: performanceScore,
        unit: '/100',
        benchmark: 70,
        status: scoreStatus,
      });
    }

    if (rank !== null && totalRestaurants !== null) {
      const rankStatus: AIMetric['status'] =
        rank <= totalRestaurants * 0.3 ? 'good' : rank <= totalRestaurants * 0.6 ? 'warning' : 'critical';
      metrics.push({
        name: 'Platform Rank',
        value: `#${rank} of ${totalRestaurants}`,
        status: rankStatus,
      });
    }

    if (revenue !== null) {
      metrics.push({
        name: 'Revenue (Q4 2024)',
        value: revenue,
        unit: 'INR',
        status: 'info',
      });
    }

    if (revenueShare !== null) {
      const shareStatus: AIMetric['status'] = revenueShare >= 0.08 ? 'good' : revenueShare >= 0.04 ? 'warning' : 'critical';
      metrics.push({
        name: 'Revenue Share',
        value: `${(revenueShare * 100).toFixed(1)}%`,
        benchmark: '5% platform avg',
        status: shareStatus,
      });
    }

    if (rating !== null) {
      const ratingStatus: AIMetric['status'] =
        rating >= 4.2 ? 'good' : rating >= 3.8 ? 'warning' : 'critical';
      metrics.push({
        name: 'Rating',
        value: rating,
        unit: '/5',
        benchmark: platformAvgRating ?? 4.2,
        status: ratingStatus,
      });
    }

    if (cancellationRate !== null) {
      const cancelStatus: AIMetric['status'] =
        cancellationRate <= 0.08 ? 'good' : cancellationRate <= 0.15 ? 'warning' : 'critical';
      metrics.push({
        name: 'Cancellation Rate',
        value: `${(cancellationRate * 100).toFixed(1)}%`,
        benchmark: platformBenchmarkCancellation
          ? `${(platformBenchmarkCancellation * 100).toFixed(1)}% platform avg`
          : '8% platform avg',
        status: cancelStatus,
      });
    }

    // ── Determine severity and finding ─────────────────────────────────────
    const criticalIssues = issues.filter((i) => i.severity === 'high' || i.severity === 'critical');
    const warningIssues = issues.filter((i) => i.severity === 'medium');

    if (criticalIssues.length > 0) {
      severity = 'critical';
      finding = `${restaurantName} is significantly underperforming with ${criticalIssues.length} critical issue(s) identified.`;
    } else if (warningIssues.length > 0 || (performanceScore !== null && performanceScore < 50)) {
      severity = 'warning';
      finding = `${restaurantName} shows below-average performance requiring attention.`;
    } else if (metrics.length === 0) {
      finding = `Insufficient data retrieved for ${restaurantName}. Check if restaurant name is correct.`;
    } else {
      finding = `${restaurantName} shows stable performance within normal parameters.`;
    }

    // ── Build likely causes ──────────────────────────────────────────────────
    likelyCauses = issues.map((i) => i.detail);
    if (likelyCauses.length === 0 && (performanceScore !== null && performanceScore < 50)) {
      likelyCauses = [
        'Low revenue share compared to platform average',
        'Below-average customer ratings affecting repeat orders',
      ];
    }

    // ── Recommendations ──────────────────────────────────────────────────────
    recommendations = analysisRecommendations.length > 0
      ? analysisRecommendations
      : [
          'Review menu pricing and items to improve revenue per order',
          'Investigate customer reviews for specific service issues',
          'Schedule a partner consultation to discuss improvement plan',
        ];

    // ── Summary ──────────────────────────────────────────────────────────────
    const metricParts: string[] = [];
    if (revenue !== null) metricParts.push(`Revenue: ₹${revenue.toLocaleString()}`);
    if (rank !== null) metricParts.push(`Rank: #${rank}/${totalRestaurants}`);
    if (rating !== null) metricParts.push(`Rating: ${rating}/5`);
    if (cancellationRate !== null) metricParts.push(`Cancellation: ${(cancellationRate * 100).toFixed(1)}%`);

    summary = metricParts.length > 0
      ? `${restaurantName} Q4 2024 — ${metricParts.join(' | ')}. ${finding}`
      : `Analysis complete for ${restaurantName}. ${finding}`;

    const insight: AIInsight = {
      finding,
      severity,
      confidence: evidence.length > 0 ? 0.85 : 0.3,
      entity: {
        type: 'restaurant',
        name: restaurantName,
      },
      metrics,
      evidence,
      likelyCauses,
      recommendations,
      summary,
    };

    return {
      requestId: context.requestId,
      traceId: context.traceId,
      conversationId: request.conversationId,
      message: summary,
      insight: evidence.length > 0 ? insight : undefined,
      toolCalls: [], // Populated by AIAgent
      executionMetadata: {
        provider: 'mock',
        model: 'mock-v1',
        durationMs: Date.now() - startTime,
        mcpToolCount: evidence.length,
      },
    };
  }

  // ── Platform-level insight ──────────────────────────────────────────────────

  private buildPlatformInsight(
    evidence: AIEvidence[],
    startTime: number,
    request: AIProviderGenerateInput['request'],
    context: AIProviderGenerateInput['context'],
    questionLower: string
  ): AIResponse {
    const metrics: AIMetric[] = [];
    let summary = 'Platform analytics data retrieved.';
    let likelyCauses: string[] = [];
    let recommendations: string[] = [];
    let severity: 'info' | 'warning' | 'critical' = 'info';

    // Extract from get_analytics_summary
    const summaryEv = evidence.find((e) => e.toolName === 'get_analytics_summary');
    if (summaryEv?.data) {
      const d = summaryEv.data as Record<string, unknown>;
      const metricsObj = d.metrics as Record<string, unknown> | undefined;
      if (metricsObj) {
        const revenue = metricsObj.revenue as Record<string, unknown> | undefined;
        const orders = metricsObj.orders as Record<string, unknown> | undefined;
        const aov = metricsObj.averageOrderValue as Record<string, unknown> | undefined;

        if (revenue) {
          metrics.push({ name: 'Total Revenue', value: revenue.total as number, unit: 'INR', status: 'good' });
        }
        if (orders) {
          metrics.push({ name: 'Total Orders', value: orders.total as number, unit: 'count', status: 'good' });
          const cancelRate = orders.cancellationRate as number | undefined;
          if (typeof cancelRate === 'number') {
            const cancelStatus: AIMetric['status'] = cancelRate <= 0.08 ? 'good' : cancelRate <= 0.15 ? 'warning' : 'critical';
            metrics.push({
              name: 'Cancellation Rate',
              value: `${(cancelRate * 100).toFixed(1)}%`,
              benchmark: '8%',
              status: cancelStatus,
            });
            if (cancelRate > 0.15) {
              severity = 'warning';
              likelyCauses.push('Elevated platform-wide cancellation rate detected');
              recommendations.push('Investigate restaurants with highest cancellation rates');
            }
          }
        }
        if (aov) {
          metrics.push({ name: 'Avg Order Value', value: aov.value as number, unit: 'INR', status: 'info' });
        }
      }
    }

    // Extract from get_metrics tool
    const metricsEv = evidence.find((e) => e.toolName === 'get_metrics');
    if (metricsEv?.data && (metricsEv.data as Record<string, unknown>).results) {
      const results = (metricsEv.data as Record<string, unknown>).results as Record<string, { value: number; unit: string }>;
      for (const [metricName, metricData] of Object.entries(results)) {
        if (!metrics.some((m) => m.name.toLowerCase().includes(metricName))) {
          metrics.push({
            name: metricName.replace(/_/g, ' '),
            value: metricData.value,
            unit: metricData.unit,
            status: 'info',
          });
        }
      }
    }

    // Build summary
    if (evidence.length === 0) {
      summary = 'No evidence could be retrieved from MCP tools. The MCP server may not be running.';
      severity = 'warning';
    } else if (questionLower.includes('cancel')) {
      const cancelMetric = metrics.find((m) => m.name.toLowerCase().includes('cancellation'));
      summary = cancelMetric
        ? `Platform cancellation rate: ${cancelMetric.value}${typeof cancelMetric.benchmark === 'string' ? ` (benchmark: ${cancelMetric.benchmark})` : ''}.`
        : 'Cancellation data retrieved. See metrics for details.';
    } else {
      const revenueMetric = metrics.find((m) => m.name.toLowerCase().includes('revenue'));
      const ordersMetric = metrics.find((m) => m.name.toLowerCase().includes('orders'));
      summary = `Platform Q4 2024 overview: ${revenueMetric ? `Revenue ₹${revenueMetric.value}` : ''} ${ordersMetric ? `| Orders: ${ordersMetric.value}` : ''}`.trim();
    }

    const finding = severity === 'warning'
      ? 'Platform metric anomaly detected — review required.'
      : 'Platform metrics are within normal parameters.';

    const insight: AIInsight = {
      finding,
      severity,
      confidence: evidence.length > 0 ? 0.8 : 0.2,
      metrics,
      evidence,
      likelyCauses,
      recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring platform metrics'],
      summary,
    };

    return {
      requestId: context.requestId,
      traceId: context.traceId,
      conversationId: request.conversationId,
      message: summary,
      insight: evidence.length > 0 ? insight : undefined,
      toolCalls: [],
      executionMetadata: {
        provider: 'mock',
        model: 'mock-v1',
        durationMs: Date.now() - startTime,
        mcpToolCount: evidence.length,
      },
    };
  }

  private extractRestaurantName(lower: string): string | null {
    const known = [
      'Spice Garden', 'Pizza Paradise', 'Burger House', 'Sushi Master',
      'Taco Fiesta', 'Dragon Palace', 'The Biryani Co', 'Coastal Cravings',
      'The Cake Studio', 'Green Bowl',
    ];
    for (const name of known) {
      if (lower.includes(name.toLowerCase())) return name;
    }
    return null;
  }
}
