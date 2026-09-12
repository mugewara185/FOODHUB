// @ts-nocheck
/**
 * MCP Prompts for FoodHub Analytics Server
 *
 * Prompts are reusable, parameterized conversation starters that guide an AI model
 * through a specific analytics workflow. They are distinct from Tools (which execute
 * code) and Resources (which expose data). A prompt pre-populates context so the
 * agent can immediately begin a structured analysis without needing the user to write
 * detailed instructions.
 *
 * Registered prompts:
 * 1. weekly_business_review — structured Q4 weekly performance review
 * 2. restaurant_performance_audit — deep-dive on a specific restaurant
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer): void {
  // ── 1. Weekly Business Review ─────────────────────────────────────────────
  server.prompt(
    'weekly_business_review',
    'Generates a structured weekly business review prompt for the FoodHub platform. ' +
      'The agent will use analytics tools to produce a complete performance report ' +
      'covering revenue, orders, top restaurants, and trend analysis for the specified week.',
    {
      week_start: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe('Monday of the target week (YYYY-MM-DD). Must be within Q4 2024 (2024-10-01 to 2024-12-31).'),
      week_end: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe('Sunday of the target week (YYYY-MM-DD).'),
    },
    ({ week_start, week_end }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are the FoodHub analytics assistant. Conduct a complete weekly business review for the week of ${week_start} to ${week_end}.

Please provide a structured report covering:

1. **Executive Summary** — Call \`get_analytics_summary\` with from="${week_start}" and to="${week_end}".

2. **Revenue & Order Trends** — Call \`analyze_trend\` for "revenue" over the same week with granularity="day".

3. **City Performance** — Call \`get_breakdown\` with dimension="city" for this week.

4. **Cuisine Performance** — Call \`get_breakdown\` with dimension="cuisine" for this week.

5. **Top Restaurants** — Call \`get_top_entities\` with entityType="restaurant", limit=5 for this week.

6. **Week-over-Week Comparison** — Compare this week against the prior week using \`compare_periods\`.
   Compute the prior week dates by subtracting 7 days from ${week_start} and ${week_end}.

After gathering all data, write a concise executive report with:
- Key headline numbers (revenue, orders, AOV, cancellation rate)
- Winners (top city, top cuisine, top restaurant)
- Notable trends or anomalies
- One or two actionable recommendations

Format the final report clearly with section headers. Be specific and cite the numbers from the tool outputs.`,
          },
        },
      ],
    })
  );

  // ── 2. Restaurant Performance Audit ──────────────────────────────────────
  server.prompt(
    'restaurant_performance_audit',
    'Guides the agent through a deep-dive performance audit for a specific restaurant. ' +
      'Uses multiple analytics tools to assess revenue contribution, trend, and relative ranking.',
    {
      restaurant_name: z
        .string()
        .describe(
          'Name of the restaurant to audit. Valid names include: Spice Garden, Pizza Paradise, Burger House, ' +
            'Sushi Master, Taco Fiesta, Dragon Palace, The Biryani Co., Coastal Cravings, The Cake Studio, etc.'
        ),
    },
    ({ restaurant_name }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are the FoodHub analytics assistant. Perform a performance audit for the restaurant "${restaurant_name}" over the full Q4 2024 period (2024-10-01 to 2024-12-31).

Steps:
1. Call \`get_top_entities\` with entityType="restaurant", limit=20, from="2024-10-01", to="2024-12-31" — find "${restaurant_name}" in the results and note its rank, revenue, and orders.

2. Call \`get_breakdown\` with dimension="restaurant", from="2024-10-01", to="2024-12-31" — find "${restaurant_name}"'s revenue share of the platform.

3. Call \`analyze_trend\` with metric="revenue", from="2024-10-01", to="2024-12-31", granularity="month" — identify whether this restaurant's cuisine/city overall is growing or declining. (Note: trend is platform-wide, but infer the restaurant's trajectory from the top entities data.)

4. Call \`compare_periods\` to compare Nov (2024-11-01 to 2024-11-30) vs Oct (2024-10-01 to 2024-10-31) and Dec (2024-12-01 to 2024-12-31) vs Nov — to see if volume grew into year-end.

Then write a restaurant performance report including:
- Revenue and orders for the quarter
- Platform revenue share rank (e.g. "#3 of active restaurants")
- Month-over-month trajectory
- Strengths and concerns
- One actionable recommendation for the admin team`,
          },
        },
      ],
    })
  );
}

