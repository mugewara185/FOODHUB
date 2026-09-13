// @ts-nocheck
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { analyticsService } from '../services/analytics.service';

export function registerGetCancellationMetricsTool(server: McpServer): void {
  server.tool(
    'get_cancellation_metrics',
    'Gets detailed cancellation metrics for the platform or a specific restaurant for a date range.',
    {
      restaurantName: z.string().optional().describe('Optional. Filters for this restaurant'),
      from: z.string().optional().describe('Start date YYYY-MM-DD, default 2024-10-01'),
      to: z.string().optional().describe('End date YYYY-MM-DD, default 2024-12-31'),
    },
    async ({ restaurantName, from = '2024-10-01', to = '2024-12-31' }) => {
      const range = { from, to };
      const summary = analyticsService.getSummary(range);
      const breakdown = analyticsService.getBreakdown('order_status', range);

      let totalOrders = summary.totalOrders;
      let cancelledOrders = summary.cancelledOrders;
      let deliveredOrders = summary.deliveredOrders;
      
      let scope: any = 'platform';

      if (restaurantName) {
        scope = { restaurantName };
        const allRestaurants = analyticsService.getAllRestaurants();
        const restaurant = allRestaurants.find(r => r.name.toLowerCase().includes(restaurantName.toLowerCase()));
        if (restaurant) {
          const topRestaurants = analyticsService.getTopRestaurants(1000, range, 'orders');
          const restStats = topRestaurants.find(r => r.id === restaurant.id);
          if (restStats) {
            totalOrders = restStats.orders;
            const mockCancelRate = summary.cancellationRate * (5 / restaurant.rating);
            cancelledOrders = Math.round(totalOrders * mockCancelRate);
            deliveredOrders = totalOrders - cancelledOrders;
          }
        }
      }

      const cancellationRate = totalOrders ? cancelledOrders / totalOrders : 0;
      const deliverySuccessRate = totalOrders ? deliveredOrders / totalOrders : 0;
      
      const assessment = cancellationRate > summary.cancellationRate ? 'below_benchmark' : (cancellationRate < summary.cancellationRate ? 'above_benchmark' : 'at_benchmark');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            scope,
            period: range,
            metrics: {
              totalOrders,
              cancelledOrders,
              cancellationRate,
              deliveredOrders,
              deliverySuccessRate,
              platformBenchmarkCancellationRate: summary.cancellationRate
            },
            orderStatusDistribution: breakdown.map(b => ({ status: b.name, count: b.value })),
            assessment,
            metadata: { dataSource: "mock" }
          }, null, 2)
        }]
      };
    }
  );
}
