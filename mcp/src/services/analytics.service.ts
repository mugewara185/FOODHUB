/**
 * AnalyticsService
 *
 * Core data-access layer for the FoodHub Analytics MCP Server.
 * All analytics computations live here; tools call these methods
 * rather than touching mock data directly. This design mirrors
 * how a real service layer would call a database or API.
 *
 * When connecting to the real API, swap out this implementation
 * while keeping tool code unchanged.
 */

import { MOCK_ORDERS, MockOrder, OrderStatus } from '../data/orders.data';
import { MOCK_RESTAURANTS, MockRestaurant } from '../data/restaurants.data';
import { MOCK_USERS, MockUser } from '../data/users.data';

// ─── Shared Types ────────────────────────────────────────────────────────────

export type Dimension =
  | 'city'
  | 'cuisine'
  | 'restaurant'
  | 'payment_method'
  | 'user_segment'
  | 'order_status';

export type Metric = 'revenue' | 'orders' | 'platform_fees' | 'avg_order_value' | 'cancellation_rate';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export interface SummaryStats {
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalPlatformFees: number;
  avgOrderValue: number;
  cancellationRate: number;          // 0–1
  deliverySuccessRate: number;       // 0–1
  activeRestaurants: number;
  totalUsers: number;
  newUsersInPeriod: number;
  topCuisine: string;
  topCity: string;
}

export interface TimeSeriesPoint {
  date: string;   // YYYY-MM-DD
  revenue: number;
  orders: number;
  platformFees: number;
  avgOrderValue: number;
}

export interface DimensionBreakdownItem {
  label: string;
  revenue: number;
  orders: number;
  platformFees: number;
  avgOrderValue: number;
  share: number;  // 0–1 fraction of total revenue
}

export interface TopEntity {
  rank: number;
  id: string;
  name: string;
  city?: string;
  cuisine?: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  rating?: number;
}

export interface PeriodComparison {
  period: { from: string; to: string; label: string };
  baseline: { from: string; to: string; label: string };
  metrics: {
    revenue: { current: number; previous: number; change: number; changePercent: number };
    orders: { current: number; previous: number; change: number; changePercent: number };
    avgOrderValue: { current: number; previous: number; change: number; changePercent: number };
    cancellationRate: { current: number; previous: number; change: number; changePercent: number };
  };
  interpretation: string;
}

export interface TrendAnalysis {
  metric: Metric;
  dateRange: DateRange;
  granularity: 'day' | 'week' | 'month';
  series: TimeSeriesPoint[];
  trend: 'upward' | 'downward' | 'flat';
  peakDate: string;
  peakValue: number;
  troughDate: string;
  troughValue: number;
  percentChange: number;   // first → last point
  volatility: 'high' | 'medium' | 'low';
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function parseDate(iso: string): Date {
  return new Date(iso);
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function filterOrdersByRange(orders: MockOrder[], range: DateRange): MockOrder[] {
  const from = parseDate(range.from).getTime();
  const to = parseDate(range.to).getTime() + 86400000; // inclusive
  return orders.filter((o) => {
    const t = parseDate(o.placedAt).getTime();
    return t >= from && t < to;
  });
}

function computePercent(a: number, b: number): number {
  if (b === 0) return 0;
  return parseFloat((((a - b) / b) * 100).toFixed(2));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Public Service Methods ───────────────────────────────────────────────────

export class AnalyticsService {
  private orders = MOCK_ORDERS;
  private restaurants = MOCK_RESTAURANTS;
  private users = MOCK_USERS;

  // ── Summary ────────────────────────────────────────────────────────────────

  getSummary(range?: DateRange): SummaryStats {
    const orders = range ? filterOrdersByRange(this.orders, range) : this.orders;
    const delivered = orders.filter((o) => o.status === 'delivered');
    const cancelled = orders.filter((o) => o.status === 'cancelled');

    const totalRevenue = round2(delivered.reduce((s, o) => s + o.totalAmount, 0));
    const totalPlatformFees = round2(delivered.reduce((s, o) => s + o.platformFee, 0));
    const avgOrderValue = delivered.length > 0 ? round2(totalRevenue / delivered.length) : 0;
    const cancellationRate = orders.length > 0 ? round2(cancelled.length / orders.length) : 0;
    const deliverySuccessRate = orders.length > 0 ? round2(delivered.length / orders.length) : 0;

    // Top cuisine by revenue
    const byCuisine: Record<string, number> = {};
    delivered.forEach((o) => { byCuisine[o.cuisine] = (byCuisine[o.cuisine] ?? 0) + o.totalAmount; });
    const topCuisine = Object.entries(byCuisine).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    // Top city by orders
    const byCity: Record<string, number> = {};
    delivered.forEach((o) => { byCity[o.city] = (byCity[o.city] ?? 0) + 1; });
    const topCity = Object.entries(byCity).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    const activeRestaurants = this.restaurants.filter((r) => r.status === 'active' && r.isOpen).length;

    // New users joined in period
    const newUsersInPeriod = range
      ? this.users.filter((u) => {
          const t = parseDate(u.joinedAt).getTime();
          return t >= parseDate(range.from).getTime() && t < parseDate(range.to).getTime() + 86400000;
        }).length
      : this.users.length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      deliveredOrders: delivered.length,
      cancelledOrders: cancelled.length,
      totalPlatformFees,
      avgOrderValue,
      cancellationRate,
      deliverySuccessRate,
      activeRestaurants,
      totalUsers: this.users.length,
      newUsersInPeriod,
      topCuisine,
      topCity,
    };
  }

  // ── Time Series ────────────────────────────────────────────────────────────

  getTimeSeries(range: DateRange, granularity: 'day' | 'week' | 'month' = 'day'): TimeSeriesPoint[] {
    const orders = filterOrdersByRange(this.orders, range);
    const delivered = orders.filter((o) => o.status === 'delivered');

    // Group by bucket key
    const buckets: Record<string, { revenue: number; orders: number; fees: number }> = {};

    delivered.forEach((o) => {
      const d = parseDate(o.placedAt);
      let key: string;
      if (granularity === 'day') {
        key = toDateString(d);
      } else if (granularity === 'week') {
        // ISO week start = Monday
        const day = d.getDay() || 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - (day - 1));
        key = toDateString(monday);
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      }

      if (!buckets[key]) buckets[key] = { revenue: 0, orders: 0, fees: 0 };
      buckets[key].revenue += o.totalAmount;
      buckets[key].orders += 1;
      buckets[key].fees += o.platformFee;
    });

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        revenue: round2(v.revenue),
        orders: v.orders,
        platformFees: round2(v.fees),
        avgOrderValue: round2(v.revenue / v.orders),
      }));
  }

  // ── Breakdown by Dimension ─────────────────────────────────────────────────

  getBreakdown(dimension: Dimension, range?: DateRange): DimensionBreakdownItem[] {
    const orders = range ? filterOrdersByRange(this.orders, range) : this.orders;
    const delivered = orders.filter((o) => o.status === 'delivered');

    const map: Record<string, { revenue: number; orders: number; fees: number }> = {};

    delivered.forEach((o) => {
      let key: string;
      switch (dimension) {
        case 'city':           key = o.city; break;
        case 'cuisine':        key = o.cuisine; break;
        case 'restaurant':     key = o.restaurantName; break;
        case 'payment_method': key = o.paymentMethod; break;
        case 'user_segment': {
          const u = this.users.find((u) => u.id === o.userId);
          key = u?.segment ?? 'unknown';
          break;
        }
        case 'order_status':   key = o.status; break;
        default:               key = 'unknown';
      }
      if (!map[key]) map[key] = { revenue: 0, orders: 0, fees: 0 };
      map[key].revenue += o.totalAmount;
      map[key].orders += 1;
      map[key].fees += o.platformFee;
    });

    // Also count non-delivered for order_status dimension
    if (dimension === 'order_status') {
      const nonDelivered = orders.filter((o) => o.status !== 'delivered');
      nonDelivered.forEach((o) => {
        const key = o.status;
        if (!map[key]) map[key] = { revenue: 0, orders: 0, fees: 0 };
        map[key].orders += 1;
      });
    }

    const totalRevenue = Object.values(map).reduce((s, v) => s + v.revenue, 0);

    return Object.entries(map)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([label, v]) => ({
        label,
        revenue: round2(v.revenue),
        orders: v.orders,
        platformFees: round2(v.fees),
        avgOrderValue: v.orders > 0 ? round2(v.revenue / v.orders) : 0,
        share: totalRevenue > 0 ? round2(v.revenue / totalRevenue) : 0,
      }));
  }

  // ── Top Entities ───────────────────────────────────────────────────────────

  getTopRestaurants(limit: number = 5, range?: DateRange, sortBy: 'revenue' | 'orders' = 'revenue'): TopEntity[] {
    const orders = range ? filterOrdersByRange(this.orders, range) : this.orders;
    const delivered = orders.filter((o) => o.status === 'delivered');

    const map: Record<string, { revenue: number; orders: number; fees: number; id: string; name: string }> = {};
    delivered.forEach((o) => {
      if (!map[o.restaurantId]) {
        map[o.restaurantId] = { id: o.restaurantId, name: o.restaurantName, revenue: 0, orders: 0, fees: 0 };
      }
      map[o.restaurantId].revenue += o.totalAmount;
      map[o.restaurantId].orders += 1;
      map[o.restaurantId].fees += o.platformFee;
    });

    return Object.values(map)
      .sort((a, b) => (sortBy === 'revenue' ? b.revenue - a.revenue : b.orders - a.orders))
      .slice(0, limit)
      .map((v, i) => {
        const meta = this.restaurants.find((r) => r.id === v.id);
        return {
          rank: i + 1,
          id: v.id,
          name: v.name,
          city: meta?.city,
          cuisine: meta?.cuisine,
          orders: v.orders,
          revenue: round2(v.revenue),
          avgOrderValue: round2(v.revenue / v.orders),
          rating: meta?.rating,
        };
      });
  }

  getTopUsers(limit: number = 5, range?: DateRange, sortBy: 'spend' | 'orders' = 'spend'): (MockUser & { periodOrders: number; periodSpend: number })[] {
    const orders = range ? filterOrdersByRange(this.orders, range) : this.orders;
    const delivered = orders.filter((o) => o.status === 'delivered');

    const map: Record<string, { orders: number; spend: number }> = {};
    delivered.forEach((o) => {
      if (!map[o.userId]) map[o.userId] = { orders: 0, spend: 0 };
      map[o.userId].orders += 1;
      map[o.userId].spend += o.totalAmount;
    });

    return Object.entries(map)
      .sort(([, a], [, b]) => (sortBy === 'spend' ? b.spend - a.spend : b.orders - a.orders))
      .slice(0, limit)
      .map(([userId, v]) => {
        const user = this.users.find((u) => u.id === userId)!;
        return { ...user, periodOrders: v.orders, periodSpend: round2(v.spend) };
      })
      .filter(Boolean);
  }

  // ── Period Comparison ──────────────────────────────────────────────────────

  comparePeriods(period: DateRange, baseline: DateRange): PeriodComparison {
    const currentOrders = filterOrdersByRange(this.orders, period);
    const baselineOrders = filterOrdersByRange(this.orders, baseline);

    const calcMetrics = (orders: MockOrder[]) => {
      const delivered = orders.filter((o) => o.status === 'delivered');
      const cancelled = orders.filter((o) => o.status === 'cancelled');
      return {
        revenue: round2(delivered.reduce((s, o) => s + o.totalAmount, 0)),
        orders: orders.length,
        avgOrderValue: delivered.length > 0 ? round2(delivered.reduce((s, o) => s + o.totalAmount, 0) / delivered.length) : 0,
        cancellationRate: orders.length > 0 ? round2(cancelled.length / orders.length) : 0,
      };
    };

    const cur = calcMetrics(currentOrders);
    const prev = calcMetrics(baselineOrders);

    const revenue = { current: cur.revenue, previous: prev.revenue, change: round2(cur.revenue - prev.revenue), changePercent: computePercent(cur.revenue, prev.revenue) };
    const orders = { current: cur.orders, previous: prev.orders, change: cur.orders - prev.orders, changePercent: computePercent(cur.orders, prev.orders) };
    const avgOrderValue = { current: cur.avgOrderValue, previous: prev.avgOrderValue, change: round2(cur.avgOrderValue - prev.avgOrderValue), changePercent: computePercent(cur.avgOrderValue, prev.avgOrderValue) };
    const cancellationRate = { current: cur.cancellationRate, previous: prev.cancellationRate, change: round2(cur.cancellationRate - prev.cancellationRate), changePercent: computePercent(cur.cancellationRate, prev.cancellationRate) };

    // Build interpretation
    const lines: string[] = [];
    if (revenue.changePercent > 0) lines.push(`Revenue grew by ${revenue.changePercent}%.`);
    else if (revenue.changePercent < 0) lines.push(`Revenue declined by ${Math.abs(revenue.changePercent)}%.`);
    else lines.push('Revenue was flat.');

    if (orders.changePercent > 5) lines.push(`Order volume increased significantly (+${orders.changePercent}%).`);
    else if (orders.changePercent < -5) lines.push(`Order volume fell notably (${orders.changePercent}%).`);

    if (cancellationRate.change > 0.02) lines.push('Cancellation rate worsened; investigate root cause.');
    else if (cancellationRate.change < -0.02) lines.push('Cancellation rate improved.');

    return {
      period: { ...period, label: `${period.from} → ${period.to}` },
      baseline: { ...baseline, label: `${baseline.from} → ${baseline.to}` },
      metrics: { revenue, orders, avgOrderValue, cancellationRate },
      interpretation: lines.join(' '),
    };
  }

  // ── Trend Analysis ─────────────────────────────────────────────────────────

  analyzeTrend(metric: Metric, range: DateRange, granularity: 'day' | 'week' | 'month' = 'day'): TrendAnalysis {
    const series = this.getTimeSeries(range, granularity);

    if (series.length === 0) {
      return {
        metric,
        dateRange: range,
        granularity,
        series: [],
        trend: 'flat',
        peakDate: '',
        peakValue: 0,
        troughDate: '',
        troughValue: 0,
        percentChange: 0,
        volatility: 'low',
      };
    }

    const getValue = (p: TimeSeriesPoint): number => {
      switch (metric) {
        case 'revenue':        return p.revenue;
        case 'orders':         return p.orders;
        case 'platform_fees':  return p.platformFees;
        case 'avg_order_value': return p.avgOrderValue;
        case 'cancellation_rate': return 0; // N/A per bucket
        default:               return p.revenue;
      }
    };

    const values = series.map(getValue);
    const peak = values.reduce((m, v, i) => v > values[m] ? i : m, 0);
    const trough = values.reduce((m, v, i) => v < values[m] ? i : m, 0);

    const first = values[0];
    const last = values[values.length - 1];
    const percentChange = computePercent(last, first);

    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0; // coefficient of variation

    const volatility: 'high' | 'medium' | 'low' = cv > 0.4 ? 'high' : cv > 0.2 ? 'medium' : 'low';
    const trend: 'upward' | 'downward' | 'flat' = percentChange > 5 ? 'upward' : percentChange < -5 ? 'downward' : 'flat';

    return {
      metric,
      dateRange: range,
      granularity,
      series,
      trend,
      peakDate: series[peak].date,
      peakValue: values[peak],
      troughDate: series[trough].date,
      troughValue: values[trough],
      percentChange,
      volatility,
    };
  }

  // ── Metrics Snapshot ───────────────────────────────────────────────────────

  getMetrics(metricNames: Metric[], range?: DateRange): Record<Metric, number> {
    const orders = range ? filterOrdersByRange(this.orders, range) : this.orders;
    const delivered = orders.filter((o) => o.status === 'delivered');
    const cancelled = orders.filter((o) => o.status === 'cancelled');

    const totalRevenue = round2(delivered.reduce((s, o) => s + o.totalAmount, 0));
    const totalFees = round2(delivered.reduce((s, o) => s + o.platformFee, 0));
    const totalOrders = orders.length;
    const avgOV = delivered.length > 0 ? round2(totalRevenue / delivered.length) : 0;
    const cancelRate = totalOrders > 0 ? round2(cancelled.length / totalOrders) : 0;

    const all: Record<Metric, number> = {
      revenue: totalRevenue,
      orders: totalOrders,
      platform_fees: totalFees,
      avg_order_value: avgOV,
      cancellation_rate: cancelRate,
    };

    const result = {} as Record<Metric, number>;
    for (const m of metricNames) result[m] = all[m];
    return result;
  }

  // ── Restaurant Lookup ──────────────────────────────────────────────────────

  getRestaurant(id: string): MockRestaurant | undefined {
    return this.restaurants.find((r) => r.id === id);
  }

  getAllRestaurants(): MockRestaurant[] {
    return this.restaurants;
  }

  getAllUsers(): MockUser[] {
    return this.users;
  }
}

// Singleton instance — tools share one service instance
export const analyticsService = new AnalyticsService();
