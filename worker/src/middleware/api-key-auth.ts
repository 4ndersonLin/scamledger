import { createMiddleware } from 'hono/factory';
import type { Env, Variables } from '../types';
import { sha256 } from '../utils/crypto.js';

export const apiKeyAuthMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const apiKey = c.req.header('X-API-Key');

  if (!apiKey) {
    return c.json(
      {
        success: false,
        error: {
          code: 'API_KEY_MISSING',
          message: 'X-API-Key header is required',
        },
      },
      401,
    );
  }

  // Validate format: must start with csr_ prefix
  if (!apiKey.startsWith('csr_')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'API_KEY_INVALID',
          message: 'Invalid API key format',
        },
      },
      401,
    );
  }

  // Hash the key and look up in DB
  const keyHash = await sha256(apiKey);
  const keyRecord = await c.env.DB.prepare(
    'SELECT id, user_id, is_active, daily_limit, daily_usage, usage_reset_date FROM api_keys WHERE key_hash = ?',
  )
    .bind(keyHash)
    .first<{
      id: string;
      user_id: string;
      is_active: number;
      daily_limit: number;
      daily_usage: number;
      usage_reset_date: string;
    }>();

  if (!keyRecord) {
    return c.json(
      {
        success: false,
        error: {
          code: 'API_KEY_INVALID',
          message: 'Invalid API key',
        },
      },
      401,
    );
  }

  if (!keyRecord.is_active) {
    return c.json(
      {
        success: false,
        error: {
          code: 'API_KEY_DISABLED',
          message: 'API key has been deactivated',
        },
      },
      403,
    );
  }

  // Check daily usage limit (reset if new day)
  const today = new Date().toISOString().split('T')[0];
  let dailyUsage = keyRecord.daily_usage;

  if (keyRecord.usage_reset_date !== today) {
    // Reset daily usage for new day
    dailyUsage = 0;
    await c.env.DB.prepare('UPDATE api_keys SET daily_usage = 0, usage_reset_date = ? WHERE id = ?')
      .bind(today, keyRecord.id)
      .run();
  }

  if (dailyUsage >= keyRecord.daily_limit) {
    return c.json(
      {
        success: false,
        error: {
          code: 'DAILY_LIMIT_EXCEEDED',
          message: 'API key daily usage limit exceeded',
        },
      },
      429,
    );
  }

  // Increment usage counters
  await c.env.DB.prepare(
    "UPDATE api_keys SET daily_usage = daily_usage + 1, total_requests = total_requests + 1, last_used_at = datetime('now') WHERE id = ?",
  )
    .bind(keyRecord.id)
    .run();

  // Set context variables
  c.set('apiKeyId', keyRecord.id);
  c.set('apiKeyUserId', keyRecord.user_id);

  await next();
});
