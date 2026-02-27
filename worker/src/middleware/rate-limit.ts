import { createMiddleware } from 'hono/factory';
import type { Env, Variables } from '../types';

export function createRateLimit(
  type: string,
  limit: number,
  windowSeconds: number,
): ReturnType<typeof createMiddleware<{ Bindings: Env; Variables: Variables }>> {
  return createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
    const identifier = c.req.header('CF-Connecting-IP') ?? '127.0.0.1';
    const window = Math.floor(Date.now() / (windowSeconds * 1000));
    const key = `ratelimit:${type}:${identifier}:${window}`;

    // Get current count from KV
    const currentValue = await c.env.KV.get(key);
    const currentCount = currentValue ? parseInt(currentValue, 10) : 0;

    // Calculate reset time (end of current window)
    const resetTimestamp = (window + 1) * windowSeconds;

    if (currentCount >= limit) {
      c.header('X-RateLimit-Limit', String(limit));
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(resetTimestamp));
      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded. Try again later.',
          },
        },
        429,
      );
    }

    // Increment counter in KV with TTL
    await c.env.KV.put(key, String(currentCount + 1), {
      expirationTtl: windowSeconds,
    });

    const remaining = Math.max(0, limit - currentCount - 1);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(resetTimestamp));

    // Store rate limit info for downstream use (e.g., v1 meta)
    c.set('rateLimitInfo', {
      limit,
      remaining,
      reset: resetTimestamp,
    });

    await next();
  });
}

// Pre-configured rate limiters
export const apiRateLimit = createRateLimit('api', 60, 60);
export const v1RateLimit = createRateLimit('v1', 120, 60);
export const reportRateLimit = createRateLimit('report', 5, 60);
