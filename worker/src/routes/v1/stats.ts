import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { StatsService } from '../../services/stats-service.js';

const stats = new Hono<{ Bindings: Env; Variables: Variables }>();

// Overview stats via API
stats.get('/stats/overview', async (c) => {
  const statsService = new StatsService(c.env);
  const data = await statsService.getOverview();

  const rateLimitInfo = c.get('rateLimitInfo');
  return c.json({
    success: true,
    data,
    meta: rateLimitInfo
      ? {
          rate_limit: {
            limit: rateLimitInfo.limit,
            remaining: rateLimitInfo.remaining,
            reset: rateLimitInfo.reset,
          },
        }
      : undefined,
  });
});

// Trends via API
stats.get('/stats/trends', async (c) => {
  const daysParam = c.req.query('days');
  const days = daysParam ? parseInt(daysParam, 10) : 30;
  const safeDays = Math.min(Math.max(1, days), 365);

  const statsService = new StatsService(c.env);
  const data = await statsService.getTrends(safeDays);

  const rateLimitInfo = c.get('rateLimitInfo');
  return c.json({
    success: true,
    data,
    meta: rateLimitInfo
      ? {
          rate_limit: {
            limit: rateLimitInfo.limit,
            remaining: rateLimitInfo.remaining,
            reset: rateLimitInfo.reset,
          },
        }
      : undefined,
  });
});

// Breakdown via API
stats.get('/stats/breakdown', async (c) => {
  const statsService = new StatsService(c.env);
  const data = await statsService.getBreakdown();

  const rateLimitInfo = c.get('rateLimitInfo');
  return c.json({
    success: true,
    data,
    meta: rateLimitInfo
      ? {
          rate_limit: {
            limit: rateLimitInfo.limit,
            remaining: rateLimitInfo.remaining,
            reset: rateLimitInfo.reset,
          },
        }
      : undefined,
  });
});

export { stats };
