// @ts-nocheck
/**
 * Tool registry — imports and re-exports all register functions.
 * The server calls each function to attach tools to the McpServer instance.
 */

export { registerGetAnalyticsSummaryTool } from './get-analytics-summary.tool';
export { registerGetMetricsTool } from './get-metrics.tool';
export { registerComparePeriodsTool } from './compare-periods.tool';
export { registerGetBreakdownTool } from './get-breakdown.tool';
export { registerGetTopEntitiesTool } from './get-top-entities.tool';
export { registerAnalyzeTrendTool } from './analyze-trend.tool';

