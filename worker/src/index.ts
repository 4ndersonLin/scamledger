import { Hono } from 'hono';
import type { Env, Variables } from './types';
import { corsMiddleware } from './middleware/cors';
import { internalRoutes } from './routes/internal';
import { v1Routes } from './routes/v1';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global CORS middleware
app.use('*', corsMiddleware);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Internal routes (website frontend)
app.route('/api', internalRoutes);

// Developer API routes
app.route('/v1', v1Routes);

// 404 fallback
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    },
    404,
  );
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    500,
  );
});

export default app;
