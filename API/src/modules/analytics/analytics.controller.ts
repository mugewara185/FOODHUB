import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';

export class AnalyticsController {
  async getDashboard(req: Request, res: Response) {
    try {
      const period = req.query.period as string || 'week';
      
      // In a real scenario, we would validate admin token and RBAC here
      // const adminId = req.user.id;
      
      console.log(`[Analytics] Fetching dashboard metrics for period: ${period}`);
      const data = await analyticsService.getDashboardMetrics(period);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('[Analytics] Error fetching dashboard metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics data'
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
