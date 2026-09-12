// @ts-nocheck
/**
 * Tool: get_metrics
 *
 * Retrieves one or more specific platform metrics for a given date range.
 * Prefer this tool over get_analytics_summary when you only need a specific
 * subset of metrics rather than the full summary.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { analyticsService, Metric } from '../services/analytics.service';

const VALID_METRICS: [Metric, ...Metric[]] = [
  'revenue',
  'orders',
  'platform_fees',
  'avg_order_value',
  'cancellation_rate',
];

export function registerGetMetricsTool(server: McpServer): void {
  server.tool(
    'get_metrics',
    `Retrieves specific platform metrics (revenue, orders, platform_fees, avg_order_value, cancellation_rate)
optionally scoped to a date range. Use this when you need precise values for a known set of metrics rather
than the full summary. Returns metric values alongside units and context.`,
    {
      metrics: z
        .array(z.enum(VALID_METRICS))
        .min(1)
        .describe(
          `One or more metrics to retrieve. Valid values: ${VALID_METRICS.join(', ')}. ` +
            '• revenue — gross revenue from delivered orders (INR) ' +
            '• orders — total order count ' +
            '• platform_fees — FoodHub commission collected ' +
            '• avg_order_value — mean order size (INR) ' +
            '• cancellation_rate — fraction of orders cancelled (0–1)'
        ),
      from: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Start date (YYYY-MM-DD).'),
      to: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('End date (YYYY-MM-DD, inclusive).'),
    },
    async (input) => {
      const { metrics, from, to } = input;
      const range = from && to ? { from, to } : undefined;

      if (from && to && new Date(from) > new Date(to)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `'from' (${from}) must be ≤ 'to' (${to}).` }],
        };
      }

      const values = analyticsService.getMetrics(metrics, range);

      const UNITS: Record<Metric, string> = {
        revenue: 'INR',
        orders: 'count',
        platform_fees: 'INR',
        avg_order_value: 'INR',
        cancellation_rate: 'decimal (0–1)',
      };

      const formatted = metrics.reduce<Record<string, { value: number; unit: string }>>((acc, m) => {
        acc[m] = { value: values[m], unit: UNITS[m] };
        return acc;
      }, {});

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                scope: range ?? 'all_time',
                results: formatted,
                metadata: { dataSource: 'mock', currency: 'INR' },
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

