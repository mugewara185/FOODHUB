// @ts-nocheck
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { analyticsService } from '../services/analytics.service';

export function registerGetRestaurantPerformanceTool(server: McpServer): void {
  server.tool(
    'get_restaurant_performance',
    'Gets comprehensive performance data for a specific restaurant by name.',
    {
      restaurantName: z.string().describe('Name of the restaurant'),
      from: z.string().optional().describe('Start date YYYY-MM-DD, default 2024-10-01'),
      to: z.string().optional().describe('End date YYYY-MM-DD, default 2024-12-31'),
    },
    async ({ restaurantName, from = '2024-10-01', to = '2024-12-31' }) => {
      const range = { from, to };
      const allRestaurants = analyticsService.getAllRestaurants();
      const restaurant = allRestaurants.find(r => r.name.toLowerCase().includes(restaurantName.toLowerCase()));

      if (!restaurant) {
        return { content: [{ type: 'text', text: JSON.stringify({ found: false, restaurantName, message: 'Restaurant not found' }) }] };
      }

      const topRestaurants = analyticsService.getTopRestaurants(1000, range, 'revenue');
      const rankIndex = topRestaurants.findIndex(r => r.id === restaurant.id);
      const rank = rankIndex !== -1 ? rankIndex + 1 : -1;
      const restaurantStats = topRestaurants.find(r => r.id === restaurant.id);
      
      const summary = analyticsService.getSummary(range);
      
      const revenue = restaurantStats?.revenue ?? 0;
      const revenueShare = summary.totalRevenue ? (revenue / summary.totalRevenue) : 0;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            restaurantName: restaurant.name,
            restaurantId: restaurant.id,
            found: true,
            period: range,
            performance: {
              rank: rank,
              totalRestaurants: topRestaurants.length,
              revenue: revenue,
              orders: restaurantStats?.orders ?? 0,
              avgOrderValue: restaurantStats?.orders ? revenue / restaurantStats.orders : 0,
              revenueShare,
              rating: restaurant.rating,
              city: restaurant.city,
              cuisine: restaurant.cuisine,
              status: restaurant.status,
              isOpen: restaurant.isOpen
            },
            platformBenchmarks: {
              avgRevenuePerRestaurant: summary.totalRevenue / Math.max(topRestaurants.length, 1),
              avgOrdersPerRestaurant: summary.totalOrders / Math.max(topRestaurants.length, 1),
              avgRating: 4.1,
              avgCancellationRate: summary.cancellationRate
            },
            metadata: { dataSource: "mock", currency: "INR" }
          }, null, 2)
        }]
      };
    }
  );
}
