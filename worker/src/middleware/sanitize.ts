import { createMiddleware } from 'hono/factory';
import type { Env, Variables } from '../types';

/**
 * Recursively sanitize all string values in an object:
 * - Trim whitespace
 * - Remove HTML tags
 * - Collapse whitespace
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .trim()
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (typeof value === 'object' && value !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  return value;
}

export const sanitizeMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  // Only sanitize POST and PATCH requests with JSON bodies
  if (c.req.method !== 'POST' && c.req.method !== 'PATCH') {
    await next();
    return;
  }

  const contentType = c.req.header('Content-Type');
  if (!contentType || !contentType.includes('application/json')) {
    await next();
    return;
  }

  // Check if body was already parsed (e.g., by turnstile middleware)
  const existing = c.get('sanitizedBody');
  if (existing) {
    const sanitized = sanitizeValue(existing);
    c.set('sanitizedBody', sanitized);
    await next();
    return;
  }

  try {
    const body = await c.req.json();
    const sanitized = sanitizeValue(body);
    c.set('sanitizedBody', sanitized);
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_BODY',
          message: 'Request body must be valid JSON',
        },
      },
      400,
    );
  }

  await next();
});
