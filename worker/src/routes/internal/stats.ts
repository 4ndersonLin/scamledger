import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { StatsService } from '../../services/stats-service.js';

const stats = new Hono<{ Bindings: Env; Variables: Variables }>();

// Overview stats
stats.get('/stats/overview', async (c) => {
  const statsService = new StatsService(c.env);
  const data = await statsService.getOverview();
  return c.json({ success: true, data });
});

// Trends over time
stats.get('/stats/trends', async (c) => {
  const daysParam = c.req.query('days');
  const days = daysParam ? parseInt(daysParam, 10) : 30;
  const safeDays = Math.min(Math.max(1, days), 365);

  const statsService = new StatsService(c.env);
  const data = await statsService.getTrends(safeDays);
  return c.json({ success: true, data });
});

// Breakdown by type/chain
stats.get('/stats/breakdown', async (c) => {
  const statsService = new StatsService(c.env);
  const data = await statsService.getBreakdown();
  return c.json({ success: true, data });
});

export { stats };
