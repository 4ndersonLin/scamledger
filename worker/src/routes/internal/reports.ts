import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { ReportService, ValidationError } from '../../services/report-service.js';
import { turnstileMiddleware } from '../../middleware/turnstile.js';
import { sanitizeMiddleware } from '../../middleware/sanitize.js';
import { reportRateLimit } from '../../middleware/rate-limit.js';
import type { ReportInput } from '@cryptoscam/shared';

const reports = new Hono<{ Bindings: Env; Variables: Variables }>();

// Submit a new report
reports.post('/reports', turnstileMiddleware, sanitizeMiddleware, reportRateLimit, async (c) => {
  const reportService = new ReportService(c.env);
  const body = c.get('sanitizedBody') as ReportInput;
  const reporterIp = c.req.header('CF-Connecting-IP') ?? '127.0.0.1';
  const reporterUa = c.req.header('User-Agent') ?? '';

  try {
    const report = await reportService.createReport(body, reporterIp, reporterUa, 'web');
    return c.json({ success: true, data: report }, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        },
        400,
      );
    }
    throw err;
  }
});

// Get recent reports
reports.get('/reports/recent', async (c) => {
  const limitParam = c.req.query('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 10;
  const safeLimit = Math.min(Math.max(1, limit), 50);

  const reportService = new ReportService(c.env);
  const data = await reportService.getRecentReports(safeLimit);

  return c.json({ success: true, data });
});

export { reports };
