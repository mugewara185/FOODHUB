import { Order } from '../orders/order.model';
import { Restaurant } from '../restaurants/restaurant.model';
import { User } from '../auth/auth.model';

export interface AnalyticsDashboardResponse {
  period: string;
  metrics: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    activeRestaurants: number;
    totalUsers: number;
    deliverySuccessRate: number;
  };
  breakdowns: {
    revenueByDay: Array<{
      name: string;
      revenue: number;
      orders: number;
    }>;
    categoryDistribution: Array<{
      name: string;
      value: number;
    }>;
    recentOrders: Array<{
      id: string;
      customer: string;
      restaurant: string;
      amount: number;
      status: string;
      time: string;
    }>;
    topRestaurants: Array<{
      name: string;
      orders: number;
      revenue: number;
      rating: number;
    }>;
  };
}

export class AnalyticsService {
  async getDashboardMetrics(period: string = 'week'): Promise<AnalyticsDashboardResponse> {
    const now = new Date();
    let startDate = new Date();
    if (period === 'day') {
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setDate(now.getDate() - 7);
    }

    // 1. Basic Metrics
    const activeRestaurants = await Restaurant.countDocuments({ isOpen: true });
    const totalUsers = await User.countDocuments();
    
    const ordersStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
        }
      }
    ]);
    
    const stats = ordersStats[0] || { totalRevenue: 0, totalOrders: 0, deliveredOrders: 0 };
    const averageOrderValue = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;
    const deliverySuccessRate = stats.totalOrders > 0 ? Number(((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(1)) : 0;

    // 2. Revenue By Day
    const revenueByDayRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const revenueByDay = revenueByDayRaw.map(r => ({
      name: new Date(r._id).toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: r.revenue,
      orders: r.orders
    }));

    // 3. Category Distribution (approximate based on top restaurant cuisines in orders)
    // For simplicity, we just aggregate cuisine distribution of all restaurants
    const categoryDistRaw = await Restaurant.aggregate([
      { $unwind: "$cuisine" },
      {
        $group: {
          _id: "$cuisine",
          value: { $sum: 1 }
        }
      },
      { $sort: { value: -1 } },
      { $limit: 5 }
    ]);
    const totalCuisines = categoryDistRaw.reduce((acc, curr) => acc + curr.value, 0);
    const categoryDistribution = categoryDistRaw.map(c => ({
      name: c._id,
      value: totalCuisines > 0 ? Math.round((c.value / totalCuisines) * 100) : 0
    }));

    // 4. Recent Orders
    const recentOrdersRaw = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name')
      .lean();
    
    const recentOrders = recentOrdersRaw.map((o: any) => ({
      id: o._id.toString().slice(-6).toUpperCase(),
      customer: o.userId?.name || 'Guest',
      restaurant: o.restaurantName || 'Unknown',
      amount: o.totalAmount,
      status: o.status,
      time: o.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // 5. Top Restaurants (mocked logic or simple aggregation)
    const topRestaurantsRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$restaurantId",
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
          restaurantName: { $first: "$restaurantName" }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // Fetch ratings for top restaurants
    const topRestaurants = await Promise.all(topRestaurantsRaw.map(async (tr) => {
      const rest = await Restaurant.findById(tr._id).select('rating').lean();
      return {
        name: tr.restaurantName,
        orders: tr.orders,
        revenue: tr.revenue,
        rating: rest?.rating || 0
      };
    }));

    return {
      period,
      metrics: {
        revenue: stats.totalRevenue,
        orders: stats.totalOrders,
        averageOrderValue,
        activeRestaurants,
        totalUsers,
        deliverySuccessRate,
      },
      breakdowns: {
        revenueByDay: revenueByDay.length ? revenueByDay : [{ name: 'Today', revenue: 0, orders: 0 }],
        categoryDistribution: categoryDistribution.length ? categoryDistribution : [{ name: 'None', value: 100 }],
        recentOrders,
        topRestaurants: topRestaurants.length ? topRestaurants : []
      }
    };
  }
}

export const analyticsService = new AnalyticsService();
