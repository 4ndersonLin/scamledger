import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { ReportService, ValidationError } from '../../services/report-service.js';
import { sanitizeMiddleware } from '../../middleware/sanitize.js';
import type { ReportInput } from '@cryptoscam/shared';
import { validateReportInput } from '@cryptoscam/shared';

const MAX_BATCH_SIZE = 50;

const reports = new Hono<{ Bindings: Env; Variables: Variables }>();

// Submit a report via API
reports.post('/reports', sanitizeMiddleware, async (c) => {
  const reportService = new ReportService(c.env);
  const body = c.get('sanitizedBody') as ReportInput;
  const reporterIp = c.req.header('CF-Connecting-IP') ?? '127.0.0.1';
  const reporterUa = c.req.header('User-Agent') ?? '';
  const apiKeyId = c.get('apiKeyId');

  try {
    const report = await reportService.createReport(body, reporterIp, reporterUa, 'api', apiKeyId);

    const rateLimitInfo = c.get('rateLimitInfo');
    return c.json(
      {
        success: true,
        data: report,
        meta: rateLimitInfo
          ? {
              rate_limit: {
                limit: rateLimitInfo.limit,
                remaining: rateLimitInfo.remaining,
                reset: rateLimitInfo.reset,
              },
            }
          : undefined,
      },
      201,
    );
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

// Batch submit reports
reports.post('/reports/batch', sanitizeMiddleware, async (c) => {
  const body = c.get('sanitizedBody');

  if (!Array.isArray(body)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must be an array of report objects',
        },
      },
      400,
    );
  }

  if (body.length > MAX_BATCH_SIZE) {
    return c.json(
      {
        success: false,
        error: {
          code: 'BATCH_TOO_LARGE',
          message: `Batch size must not exceed ${MAX_BATCH_SIZE}`,
        },
      },
      400,
    );
  }

  const reportService = new ReportService(c.env);
  const reporterIp = c.req.header('CF-Connecting-IP') ?? '127.0.0.1';
  const reporterUa = c.req.header('User-Agent') ?? '';
  const apiKeyId = c.get('apiKeyId');

  interface BatchResultItem {
    index: number;
    success: boolean;
    data?: unknown;
    error?: { code: string; message: string; details?: unknown };
  }

  const results: BatchResultItem[] = [];
  let submitted = 0;
  let failed = 0;

  for (let i = 0; i < body.length; i++) {
    const item = body[i] as ReportInput;

    // Pre-validate before attempting creation
    const validation = validateReportInput(item);
    if (!validation.valid) {
      failed++;
      results.push({
        index: i,
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid report input',
          details: validation.errors,
        },
      });
      continue;
    }

    try {
      const report = await reportService.createReport(
        item,
        reporterIp,
        reporterUa,
        'api',
        apiKeyId,
      );
      submitted++;
      results.push({ index: i, success: true, data: { id: report.id } });
    } catch (err) {
      failed++;
      if (err instanceof ValidationError) {
        results.push({
          index: i,
          success: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        });
      } else {
        results.push({
          index: i,
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create report',
          },
        });
      }
    }
  }

  const rateLimitInfo = c.get('rateLimitInfo');
  return c.json({
    success: true,
    data: {
      submitted,
      failed,
      results,
    },
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

export { reports };
