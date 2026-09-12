// @ts-nocheck
/**
 * Tool: get_breakdown
 *
 * Breaks down platform revenue and orders by a chosen dimension
 * (city, cuisine, restaurant, payment method, user segment, or order status).
 * Returns sorted items with revenue share percentages.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { analyticsService, Dimension } from '../services/analytics.service';

const VALID_DIMENSIONS: [Dimension, ...Dimension[]] = [
  'city',
  'cuisine',
  'restaurant',
  'payment_method',
  'user_segment',
  'order_status',
];

export function registerGetBreakdownTool(server: McpServer): void {
  server.tool(
    'get_breakdown',
    `Breaks down FoodHub revenue and orders by a specified dimension such as city, cuisine,
restaurant, payment method, user segment, or order status. Returns each group's revenue,
order count, platform fees, average order value, and percentage share of total revenue.
Results are sorted by revenue descending. Use this to answer "which city is driving the
most revenue?" or "how does payment method distribution look?".`,
    {
      dimension: z.enum(VALID_DIMENSIONS).describe(
        `The axis to break the data down by. Options:
• city — by delivery city (Mumbai, Bengaluru, Delhi, etc.)
• cuisine — by food category (Indian, Italian, Japanese, etc.)
• restaurant — by individual restaurant
• payment_method — by cash, card, or UPI
• user_segment — by customer tier (new, casual, regular, power)
• order_status — by delivery/cancellation status`
      ),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Start date (YYYY-MM-DD).'),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('End date (YYYY-MM-DD, inclusive).'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .default(10)
        .describe('Maximum number of breakdown items to return (1–20, default 10).'),
    },
    async (input) => {
      const { dimension, from, to, limit } = input;
      const range = from && to ? { from, to } : undefined;

      const items = analyticsService.getBreakdown(dimension, range).slice(0, limit);
      const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);
      const totalOrders = items.reduce((s, i) => s + i.orders, 0);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                dimension,
                scope: range ?? 'all_time',
                totals: { revenue: totalRevenue, orders: totalOrders, unit: 'INR' },
                breakdown: items.map((item) => ({
                  ...item,
                  sharePercent: `${(item.share * 100).toFixed(1)}%`,
                })),
                metadata: { dataSource: 'mock', currency: 'INR', note: 'share is a decimal (0–1). sharePercent is formatted for readability.' },
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

