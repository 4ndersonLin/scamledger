import { createMiddleware } from 'hono/factory';
import type { Env, Variables } from '../types';
import { SessionService } from '../services/session-service.js';

export const sessionAuthMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const cookie = c.req.header('Cookie');
  if (!cookie) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      401,
    );
  }

  // Parse session token from cookie
  const sessionToken = parseCookie(cookie, 'session');
  if (!sessionToken) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      401,
    );
  }

  // Look up session in KV
  const sessionService = new SessionService(c.env);
  const session = await sessionService.getSession(sessionToken);

  if (!session) {
    return c.json(
      {
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired. Please log in again.',
        },
      },
      401,
    );
  }

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    await sessionService.deleteSession(sessionToken);
    return c.json(
      {
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired. Please log in again.',
        },
      },
      401,
    );
  }

  c.set('userId', session.userId);
  c.set('sessionToken', sessionToken);

  await next();
});

function parseCookie(cookieHeader: string, name: string): string | undefined {
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split('=');
    if (key === name) {
      return valueParts.join('=');
    }
  }
  return undefined;
}
