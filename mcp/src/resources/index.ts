// @ts-nocheck
/**
 * MCP Resources for FoodHub Analytics Server
 *
 * Resources expose read-only, static or slowly-changing information that an
 * AI agent can READ to understand the context before calling tools.
 *
 * These are distinct from Tools:
 * - Tools = actions/functions the agent INVOKES to get computed results
 * - Resources = documents/datasets the agent READS for background context
 *
 * Registered resources:
 * 1. foodhub://analytics/metric-definitions  — what each metric means
 * 2. foodhub://analytics/dimensions          — available breakdown dimensions
 * 3. foodhub://analytics/data-coverage       — time range and data caveats
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server: McpServer): void {
  // ── 1. Metric Definitions ─────────────────────────────────────────────────
  server.resource(
    'metric-definitions',
    'foodhub://analytics/metric-definitions',
    {
      description:
        'Definitions, units, and calculation notes for every metric exposed by the FoodHub Analytics MCP Server. ' +
        'Read this resource before calling get_metrics or analyze_trend to understand what each metric represents.',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'foodhub://analytics/metric-definitions',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              platform: 'FoodHub',
              currency: 'INR (Indian Rupee)',
              metrics: {
                revenue: {
                  label: 'Gross Revenue',
                  description:
                    'Total value of all successfully delivered orders. Excludes cancelled orders. Does not deduct platform fees.',
                  unit: 'INR',
                  calculation: 'SUM(order.totalAmount) WHERE status = delivered',
                },
                orders: {
                  label: 'Total Orders',
                  description:
                    'Count of all orders placed, regardless of status (includes pending, delivered, and cancelled).',
                  unit: 'count',
                  calculation: 'COUNT(orders)',
                },
                platform_fees: {
                  label: 'Platform Fees (Commission)',
                  description:
                    'Revenue earned by FoodHub as a commission percentage on delivered orders. Rates vary by restaurant (12%–22%).',
                  unit: 'INR',
                  calculation: 'SUM(order.platformFee) WHERE status = delivered',
                },
                avg_order_value: {
                  label: 'Average Order Value (AOV)',
                  description:
                    'Mean basket size computed only over delivered orders. A KPI for customer purchasing power and upsell effectiveness.',
                  unit: 'INR',
                  calculation: 'revenue / COUNT(delivered orders)',
                },
                cancellation_rate: {
                  label: 'Cancellation Rate',
                  description:
                    'Fraction of total orders that were cancelled. High values indicate operational or UX issues. Expressed as a decimal (0.05 = 5%).',
                  unit: 'decimal 0–1',
                  calculation: 'COUNT(cancelled) / COUNT(all orders)',
                },
              },
            },
            null,
            2
          ),
        },
      ],
    })
  );

  // ── 2. Breakdown Dimensions ───────────────────────────────────────────────
  server.resource(
    'dimensions',
    'foodhub://analytics/dimensions',
    {
      description:
        'Lists all valid breakdown dimensions for the get_breakdown tool, with descriptions and available values.',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'foodhub://analytics/dimensions',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              dimensions: {
                city: {
                  description: 'Delivery city of the customer. Useful for geographic performance analysis.',
                  availableValues: ['Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'],
                },
                cuisine: {
                  description: 'Type of food served by the restaurant.',
                  availableValues: [
                    'Indian', 'Italian', 'Japanese', 'American', 'Chinese',
                    'Mexican', 'Korean', 'Seafood', 'Healthy', 'Desserts',
                    'Street Food', 'Cafe', 'Mughlai', 'Tibetan', 'Continental',
                  ],
                },
                restaurant: {
                  description: 'Individual restaurant name. Use for restaurant-level performance breakdown.',
                  note: 'Returns up to 20 restaurants sorted by revenue.',
                },
                payment_method: {
                  description: 'Method used to pay for the order.',
                  availableValues: ['card', 'upi', 'cash'],
                },
                user_segment: {
                  description:
                    'Customer tier based on order frequency and lifetime value.',
                  availableValues: {
                    new: 'Placed fewer than 6 orders',
                    casual: 'Placed 6–15 orders',
                    regular: 'Placed 16–30 orders',
                    power: 'Placed 30+ orders',
                  },
                },
                order_status: {
                  description:
                    'Current lifecycle status of orders. Revenue is only attributed to "delivered" orders.',
                  availableValues: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
                },
              },
            },
            null,
            2
          ),
        },
      ],
    })
  );

  // ── 3. Data Coverage ──────────────────────────────────────────────────────
  server.resource(
    'data-coverage',
    'foodhub://analytics/data-coverage',
    {
      description:
        'Describes the time range, scale, and caveats of the mock data underlying this MCP server. ' +
        'Read this before performing time-bounded queries to understand what date ranges are valid.',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'foodhub://analytics/data-coverage',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              dataSource: 'mock',
              description:
                'This MCP server uses deterministic mock data representing a fictional food delivery platform. ' +
                'All figures are illustrative and do not reflect real business data.',
              coverage: {
                orders: {
                  count: 60,
                  dateRange: { from: '2024-10-01', to: '2024-12-31' },
                  note: 'Data spans Q4 2024 (October, November, December). Queries outside this range return empty results.',
                },
                restaurants: {
                  count: 20,
                  cities: ['Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'],
                  cuisineTypes: 15,
                },
                users: {
                  count: 20,
                  segments: ['new', 'casual', 'regular', 'power'],
                },
              },
              futureIntegration: {
                note:
                  'To connect to real data, replace the AnalyticsService implementation in src/services/analytics.service.ts ' +
                  'with calls to the FoodHub REST API or MongoDB. Tool code remains unchanged.',
                apiBaseUrl: 'http://localhost:5000 (FoodHub API)',
              },
            },
            null,
            2
          ),
        },
      ],
    })
  );
}

