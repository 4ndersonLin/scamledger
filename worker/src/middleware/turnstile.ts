import { createMiddleware } from 'hono/factory';
import type { Env, Variables } from '../types';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

export const turnstileMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  // Only validate POST requests
  if (c.req.method !== 'POST') {
    await next();
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
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

  const token = typeof body.turnstile_token === 'string' ? body.turnstile_token : undefined;

  // In development, allow bypass token
  if (c.env.ENVIRONMENT === 'development' && token === 'dev-bypass') {
    c.set('sanitizedBody', body);
    await next();
    return;
  }

  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: 'TURNSTILE_MISSING',
          message: 'Turnstile verification token is required',
        },
      },
      403,
    );
  }

  // Verify with Cloudflare Turnstile API
  const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: c.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });

  const verifyResult = (await verifyResponse.json()) as TurnstileVerifyResponse;

  if (!verifyResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: 'TURNSTILE_FAILED',
          message: 'Turnstile verification failed',
        },
      },
      403,
    );
  }

  // Store parsed body for downstream handlers
  c.set('sanitizedBody', body);
  await next();
});
