import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { ApiKeyService, ApiKeyError } from '../../services/api-key-service.js';
import { sessionAuthMiddleware } from '../../middleware/session-auth.js';

const keys = new Hono<{ Bindings: Env; Variables: Variables }>();

// All key routes require session authentication
keys.use('/keys', sessionAuthMiddleware);
keys.use('/keys/*', sessionAuthMiddleware);

// List API keys
keys.get('/keys', async (c) => {
  const userId = c.get('userId');
  const apiKeyService = new ApiKeyService(c.env);

  const apiKeys = await apiKeyService.listApiKeys(userId);
  return c.json({ success: true, data: apiKeys });
});

// Create a new API key
keys.post('/keys', async (c) => {
  const userId = c.get('userId');
  const body = (await c.req.json()) as Record<string, unknown>;
  const name = body.name;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name is required and must be a non-empty string',
        },
      },
      400,
    );
  }

  if (name.trim().length > 64) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name must be at most 64 characters',
        },
      },
      400,
    );
  }

  const apiKeyService = new ApiKeyService(c.env);

  try {
    const { key, apiKey } = await apiKeyService.createApiKey(userId, name.trim());
    return c.json({ success: true, data: { ...apiKey, api_key: key } }, 201);
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400);
    }
    throw err;
  }
});

// Delete an API key
keys.delete('/keys/:id', async (c) => {
  const userId = c.get('userId');
  const keyId = c.req.param('id');

  const apiKeyService = new ApiKeyService(c.env);

  try {
    await apiKeyService.deleteApiKey(userId, keyId);
    return c.json({ success: true });
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404);
    }
    throw err;
  }
});

// Toggle an API key (activate/deactivate)
keys.patch('/keys/:id', async (c) => {
  const userId = c.get('userId');
  const keyId = c.req.param('id');
  const body = (await c.req.json()) as Record<string, unknown>;

  if (typeof body.is_active !== 'boolean') {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'is_active must be a boolean',
        },
      },
      400,
    );
  }

  const apiKeyService = new ApiKeyService(c.env);

  try {
    const apiKey = await apiKeyService.toggleApiKey(userId, keyId, body.is_active);
    return c.json({ success: true, data: apiKey });
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404);
    }
    throw err;
  }
});

// Get API key usage
keys.get('/keys/:id/usage', async (c) => {
  const userId = c.get('userId');
  const keyId = c.req.param('id');

  const apiKeyService = new ApiKeyService(c.env);

  try {
    const usage = await apiKeyService.getUsage(userId, keyId);
    return c.json({ success: true, data: { id: keyId, ...usage } });
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404);
    }
    throw err;
  }
});

export { keys };
