// @ts-nocheck
/**
 * Tool: analyze_trend
 *
 * Generates a time-series and trend analysis for a metric over a date range.
 * Returns daily/weekly/monthly data points plus trend direction, peak/trough dates,
 * percent change first-to-last, and a volatility assessment.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { analyticsService, Metric } from '../services/analytics.service';

const VALID_METRICS: [Metric, ...Metric[]] = [
  'revenue',
  'orders',
  'platform_fees',
  'avg_order_value',
];

export function registerAnalyzeTrendTool(server: McpServer): void {
  server.tool(
    'analyze_trend',
    `Generates a time-series breakdown and trend assessment for a single metric over a given date range.
Returns the full series of data points (daily/weekly/monthly), overall trend direction
(upward/downward/flat), peak and trough dates with values, first-to-last percentage change,
and a volatility classification (high/medium/low). Use this to answer "is revenue trending
upward?" or "when did we peak in December?" or "plot order volume over Q4".`,
    {
      metric: z.enum(VALID_METRICS).describe(
        `The metric to analyse over time:
• revenue — gross revenue from delivered orders
• orders — order volume
• platform_fees — commission collected by FoodHub
• avg_order_value — mean basket size`
      ),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').describe('Start date (YYYY-MM-DD).'),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').describe('End date (YYYY-MM-DD, inclusive).'),
      granularity: z
        .enum(['day', 'week', 'month'])
        .optional()
        .default('day')
        .describe(
          'Time bucket size: "day" (default), "week" (Monday-aligned), or "month". ' +
          'Use "month" for long ranges to avoid noisy daily charts.'
        ),
    },
    async (input) => {
      const { metric, from, to, granularity } = input;

      if (new Date(from) > new Date(to)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `'from' (${from}) must be ≤ 'to' (${to}).` }],
        };
      }

      const result = analyticsService.analyzeTrend(metric, { from, to }, granularity);

      if (result.series.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                metric,
                dateRange: { from, to },
                granularity,
                message: 'No data found for the specified date range.',
                series: [],
              }, null, 2),
            },
          ],
        };
      }

      // Extract only the metric column for the series to keep payload lean
      const seriesColumn = result.series.map((p) => {
        const value =
          metric === 'revenue'        ? p.revenue :
          metric === 'orders'         ? p.orders :
          metric === 'platform_fees'  ? p.platformFees :
          /* avg_order_value */          p.avgOrderValue;
        return { date: p.date, value };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                metric,
                dateRange: { from, to },
                granularity,
                trend: result.trend,
                percentChange: result.percentChange,
                volatility: result.volatility,
                peak: { date: result.peakDate, value: result.peakValue },
                trough: { date: result.troughDate, value: result.troughValue },
                seriesLength: seriesColumn.length,
                series: seriesColumn,
                metadata: { dataSource: 'mock', currency: metric !== 'orders' ? 'INR' : 'N/A' },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}

