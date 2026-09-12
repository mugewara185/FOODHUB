// @ts-nocheck
/**
 * Tool: compare_periods
 *
 * Compares key business metrics between two date ranges (e.g. this month vs last month,
 * Q4 vs Q3). Returns absolute and percentage changes plus an AI-friendly interpretation.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { analyticsService } from '../services/analytics.service';

export function registerComparePeriodsTool(server: McpServer): void {
  server.tool(
    'compare_periods',
    `Compares business performance between two date ranges. Returns revenue, order volume,
average order value, and cancellation rate for both periods along with absolute and percentage
changes. Also returns a plain-language interpretation you can use directly in a response.
Use this to answer questions like "how did December compare to November?" or
"is the platform growing month-over-month?". All arguments must be in YYYY-MM-DD format.`,
    {
      period_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('The start date of the current/focal period (YYYY-MM-DD)'),
      period_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('The end date of the current/focal period (YYYY-MM-DD)'),
      baseline_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('The start date of the reference/comparison period (YYYY-MM-DD)'),
      baseline_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('The end date of the reference/comparison period (YYYY-MM-DD)'),
    },
    async (input) => {
      const { period_from, period_to, baseline_from, baseline_to } = input;
      const period = { from: period_from, to: period_to };
      const baseline = { from: baseline_from, to: baseline_to };

      if (new Date(period.from) > new Date(period.to)) {
        return { isError: true, content: [{ type: 'text', text: `period_from must be ≤ period_to.` }] };
      }
      if (new Date(baseline.from) > new Date(baseline.to)) {
        return { isError: true, content: [{ type: 'text', text: `baseline_from must be ≤ baseline_to.` }] };
      }

      const result = analyticsService.comparePeriods(period, baseline);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}

