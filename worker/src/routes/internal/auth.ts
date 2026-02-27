import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env, Variables } from '../../types';
import { AuthService, AuthError } from '../../services/auth-service.js';
import { SessionService } from '../../services/session-service.js';
import { sessionAuthMiddleware } from '../../middleware/session-auth.js';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '../../services/auth-service.js';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

function setSessionCookie(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  token: string,
): void {
  const isProduction = c.env.ENVIRONMENT === 'production';
  c.header(
    'Set-Cookie',
    `session=${token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Path=/api; Max-Age=604800`,
  );
}

function clearSessionCookie(c: Context<{ Bindings: Env; Variables: Variables }>): void {
  const isProduction = c.env.ENVIRONMENT === 'production';
  c.header(
    'Set-Cookie',
    `session=; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Path=/api; Max-Age=0`,
  );
}

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

// Begin Passkey registration
auth.post('/auth/register/begin', async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  const displayName = body.displayName;

  if (typeof displayName !== 'string' || displayName.trim().length === 0) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'displayName is required and must be a non-empty string',
        },
      },
      400,
    );
  }

  if (displayName.trim().length > 64) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'displayName must be at most 64 characters',
        },
      },
      400,
    );
  }

  const authService = new AuthService(c.env);

  try {
    const { options, userId } = await authService.beginRegistration(displayName.trim());
    return c.json({ success: true, data: { options, userId } });
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400);
    }
    throw err;
  }
});

// Finish Passkey registration
auth.post('/auth/register/finish', async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  const userId = body.userId;
  const credential = body.credential;

  if (typeof userId !== 'string' || !credential) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'userId and credential are required',
        },
      },
      400,
    );
  }

  const authService = new AuthService(c.env);
  const sessionService = new SessionService(c.env);

  try {
    const { user } = await authService.finishRegistration(
      userId,
      credential as RegistrationResponseJSON,
    );

    const ip = c.req.header('CF-Connecting-IP') ?? '127.0.0.1';
    const ua = c.req.header('User-Agent') ?? '';
    const token = await sessionService.createSession(user.id, ip, ua);

    setSessionCookie(c, token);

    return c.json({ success: true, data: { user } });
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400);
    }
    throw err;
  }
});

// Begin Passkey login
auth.post('/auth/login/begin', async (c) => {
  const authService = new AuthService(c.env);

  try {
    const { options, challengeKey } = await authService.beginLogin();
    return c.json({ success: true, data: { options, challengeKey } });
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400);
    }
    throw err;
  }
});

// Finish Passkey login
auth.post('/auth/login/finish', async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  const credential = body.credential;
  const challengeKey = body.challengeKey;

  if (!credential || typeof challengeKey !== 'string') {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'credential and challengeKey are required',
        },
      },
      400,
    );
  }

  const authService = new AuthService(c.env);
  const sessionService = new SessionService(c.env);

  try {
    const { user } = await authService.finishLogin(
      credential as AuthenticationResponseJSON,
      challengeKey,
    );

    const ip = c.req.header('CF-Connecting-IP') ?? '127.0.0.1';
    const ua = c.req.header('User-Agent') ?? '';
    const token = await sessionService.createSession(user.id, ip, ua);

    setSessionCookie(c, token);

    return c.json({ success: true, data: { user } });
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400);
    }
    throw err;
  }
});

// Logout
auth.post('/auth/logout', async (c) => {
  const cookie = c.req.header('Cookie');
  if (cookie) {
    const sessionToken = parseCookie(cookie, 'session');
    if (sessionToken) {
      const sessionService = new SessionService(c.env);
      await sessionService.deleteSession(sessionToken);
    }
  }

  clearSessionCookie(c);

  return c.json({ success: true });
});

// Get current user
auth.get('/auth/me', sessionAuthMiddleware, async (c) => {
  const userId = c.get('userId');
  const authService = new AuthService(c.env);
  const user = await authService.getUserById(userId);

  if (!user) {
    return c.json(
      {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      },
      404,
    );
  }

  return c.json({ success: true, data: user });
});

export { auth };
