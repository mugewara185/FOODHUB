// @ts-nocheck
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { analyticsService } from '../services/analytics.service';

export function registerAnalyzeRestaurantPerformanceTool(server: McpServer): void {
  server.tool(
    'analyze_restaurant_performance',
    'Performs a comprehensive performance analysis for a specific restaurant.',
    {
      restaurantName: z.string().describe('Name of the restaurant'),
    },
    async ({ restaurantName }) => {
      const range = { from: '2024-10-01', to: '2024-12-31' };
      const allRestaurants = analyticsService.getAllRestaurants();
      const restaurant = allRestaurants.find(r => r.name.toLowerCase().includes(restaurantName.toLowerCase()));

      if (!restaurant) {
         return { content: [{ type: 'text', text: JSON.stringify({ error: 'Restaurant not found' }) }] };
      }

      const topRestaurants = analyticsService.getTopRestaurants(1000, range, 'revenue');
      const rankIndex = topRestaurants.findIndex(r => r.id === restaurant.id);
      const rankPosition = rankIndex !== -1 ? rankIndex + 1 : topRestaurants.length;
      const rankPercentile = (1 - (rankPosition / topRestaurants.length)) * 100;
      
      const summary = analyticsService.getSummary(range);
      const restStats = topRestaurants.find(r => r.id === restaurant.id);
      const revenueTotal = restStats?.revenue ?? 0;
      const revenueShare = summary.totalRevenue ? (revenueTotal / summary.totalRevenue) : 0;
      const revenueShareRatio = Math.min((revenueShare / (1 / topRestaurants.length)) * 100, 100);
      
      const platformAvgRating = 4.2;
      const ratingRatio = (restaurant.rating / 5) * 100;
      
      const performanceScore = Math.round((rankPercentile * 0.4) + (revenueShareRatio * 0.3) + (ratingRatio * 0.3));

      const trend = {
        octToNov: { revenueChange: -0.05, ordersChange: -0.1 },
        novToDec: { revenueChange: 0.02, ordersChange: 0.05 }
      };

      const issues = [];
      const strengths = [];
      const recommendations = [];

      if (revenueShare < (1 / topRestaurants.length)) {
        issues.push({ type: 'low_revenue_share', severity: 'high', detail: `Revenue share ${(revenueShare*100).toFixed(1)}% vs platform avg ${((1/topRestaurants.length)*100).toFixed(1)}%` });
        recommendations.push("Consider menu pricing optimization and running promotions");
      } else {
         strengths.push("Strong revenue generation compared to peers");
      }

      if (restaurant.rating < platformAvgRating) {
        issues.push({ type: 'low_rating', severity: 'medium', detail: `Rating ${restaurant.rating} vs platform avg ${platformAvgRating}` });
        recommendations.push("Investigate negative reviews to identify specific issues");
      } else {
         strengths.push("Highly rated by customers");
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            restaurantName: restaurant.name,
            analysisDate: '2024-12-31',
            period: '2024-10-01 to 2024-12-31',
            performanceScore,
            rank: { position: rankPosition, outOf: topRestaurants.length, percentile: Math.round(rankPercentile) },
            revenue: {
              total: revenueTotal,
              revenueShare,
              benchmark: { avgPerRestaurant: summary.totalRevenue / topRestaurants.length }
            },
            orders: {
              total: restStats?.orders ?? 0,
              benchmark: { avgPerRestaurant: summary.totalOrders / topRestaurants.length }
            },
            rating: {
              current: restaurant.rating,
              platformAvg: platformAvgRating,
              assessment: restaurant.rating < platformAvgRating ? "below_average" : "above_average"
            },
            trend,
            issues,
            strengths,
            recommendations,
            metadata: { dataSource: "mock", currency: "INR" }
          }, null, 2)
        }]
      };
    }
  );
}
