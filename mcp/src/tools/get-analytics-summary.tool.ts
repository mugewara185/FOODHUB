// @ts-nocheck
/**
 * Tool: get_analytics_summary
 *
 * Returns a high-level snapshot of platform performance metrics.
 * Optionally scoped to a date range. Useful as the first tool an
 * AI agent calls to understand the overall health of the business.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { analyticsService } from '../services/analytics.service';

export function registerGetAnalyticsSummaryTool(server: McpServer): void {
  server.tool(
    'get_analytics_summary',
    `Returns a high-level summary of FoodHub platform analytics, including total revenue,
order counts, delivery success rate, cancellation rate, platform fees, average order value,
and the top-performing city and cuisine. Can be scoped to a date range using 'from' and 'to'.
Use this as the starting point for any analytics session before drilling into specifics.`,
    {
      from: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
        .optional()
        .describe('Start date (YYYY-MM-DD). Defaults to all available data.'),
      to: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
        .optional()
        .describe('End date (YYYY-MM-DD, inclusive). Defaults to all available data.'),
    },
    async (input) => {
      const { from, to } = input;
      const range = from && to ? { from, to } : undefined;

      if (from && to && new Date(from) > new Date(to)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `'from' date (${from}) must be before or equal to 'to' date (${to}).` }],
        };
      }

      const summary = analyticsService.getSummary(range);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                scope: range ?? 'all_time',
                metrics: {
                  revenue: {
                    total: summary.totalRevenue,
                    platformFees: summary.totalPlatformFees,
                    unit: 'INR',
                  },
                  orders: {
                    total: summary.totalOrders,
                    delivered: summary.deliveredOrders,
                    cancelled: summary.cancelledOrders,
                    deliverySuccessRate: summary.deliverySuccessRate,
                    cancellationRate: summary.cancellationRate,
                  },
                  averageOrderValue: {
                    value: summary.avgOrderValue,
                    unit: 'INR',
                  },
                  users: {
                    total: summary.totalUsers,
                    newInPeriod: summary.newUsersInPeriod,
                  },
                  platform: {
                    activeRestaurants: summary.activeRestaurants,
                    topCuisine: summary.topCuisine,
                    topCity: summary.topCity,
                  },
                },
                metadata: {
                  dataSource: 'mock',
                  currency: 'INR',
                  note: 'All revenue figures are in Indian Rupees. Rates are expressed as decimals (0.05 = 5%).',
                },
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

