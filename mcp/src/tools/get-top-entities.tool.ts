// @ts-nocheck
/**
 * Tool: get_top_entities
 *
 * Returns the top-performing restaurants or users ranked by revenue or order count.
 * Useful for leaderboard queries like "which restaurants are generating the most revenue?"
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { analyticsService } from '../services/analytics.service';

export function registerGetTopEntitiesTool(server: McpServer): void {
  server.tool(
    'get_top_entities',
    `Returns a ranked list of the top performing restaurants or users for a given period.
For restaurants: includes order volume, revenue, average order value, cuisine, city, and rating.
For users: includes period spend, period orders, user segment, and city.
Use this to answer "what are the top 5 restaurants this month?" or
"who are our highest-value customers in December?".`,
    {
      entityType: z
        .enum(['restaurant', 'user'])
        .describe(
          '• restaurant — rank restaurants by revenue or orders\n' +
          '• user — rank customers by spend or order count'
        ),
      sortBy: z
        .enum(['revenue', 'orders', 'spend'])
        .optional()
        .describe(
          'Ranking metric. For restaurant: "revenue" (default) or "orders". ' +
          'For user: "spend" (default) or "orders".'
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .default(5)
        .describe('Number of top entities to return (1–20, default 5).'),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Start date (YYYY-MM-DD).'),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('End date (YYYY-MM-DD, inclusive).'),
    },
    async (input) => {
      const { entityType, sortBy, limit, from, to } = input;
      const range = from && to ? { from, to } : undefined;

      if (from && to && new Date(from) > new Date(to)) {
        return { isError: true, content: [{ type: 'text', text: `'from' must be ≤ 'to'.` }] };
      }

      if (entityType === 'restaurant') {
        const sort = (sortBy === 'orders' ? 'orders' : 'revenue') as 'revenue' | 'orders';
        const entities = analyticsService.getTopRestaurants(limit, range, sort);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  entityType: 'restaurant',
                  rankedBy: sort,
                  scope: range ?? 'all_time',
                  results: entities,
                  metadata: { dataSource: 'mock', currency: 'INR' },
                },
                null,
                2
              ),
            },
          ],
        };
      } else {
        const sort = (sortBy === 'orders' ? 'orders' : 'spend') as 'spend' | 'orders';
        const users = analyticsService.getTopUsers(limit, range, sort);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  entityType: 'user',
                  rankedBy: sort,
                  scope: range ?? 'all_time',
                  results: users.map((u) => ({
                    id: u.id,
                    name: u.name,
                    city: u.city,
                    segment: u.segment,
                    periodOrders: u.periodOrders,
                    periodSpend: u.periodSpend,
                    totalLifetimeOrders: u.totalOrders,
                    totalLifetimeSpend: u.totalSpend,
                    joinedAt: u.joinedAt,
                  })),
                  metadata: { dataSource: 'mock', currency: 'INR' },
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );
}

