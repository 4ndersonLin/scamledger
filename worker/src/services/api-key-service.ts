import { nanoid } from 'nanoid';
import type { Env } from '../types/index.js';
import type { ApiKey } from '@cryptoscam/shared';
import { MAX_API_KEYS_PER_USER } from '@cryptoscam/shared';
import { generateApiKey, sha256 } from '../utils/crypto.js';

interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  is_active: number;
  daily_limit: number;
  daily_usage: number;
  total_requests: number;
  usage_reset_date: string;
  last_used_at: string | null;
  created_at: string;
}

function rowToApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    key_prefix: row.key_prefix,
    key_hash: '',
    is_active: row.is_active === 1,
    daily_limit: row.daily_limit,
    daily_usage: row.daily_usage,
    total_requests: row.total_requests,
    usage_reset_date: row.usage_reset_date,
    last_used_at: row.last_used_at,
    created_at: row.created_at,
  };
}

export class ApiKeyService {
  constructor(private readonly env: Env) {}

  async createApiKey(userId: string, name: string): Promise<{ key: string; apiKey: ApiKey }> {
    const countResult = await this.env.DB.prepare(
      'SELECT COUNT(*) as count FROM api_keys WHERE user_id = ?',
    )
      .bind(userId)
      .first<{ count: number }>();

    const currentCount = countResult?.count ?? 0;
    if (currentCount >= MAX_API_KEYS_PER_USER) {
      throw new ApiKeyError(
        'MAX_KEYS_EXCEEDED',
        `Maximum of ${MAX_API_KEYS_PER_USER} API keys per user`,
      );
    }

    const key = generateApiKey();
    const keyHash = await sha256(key);
    const keyPrefix = key.slice(0, 12);
    const id = nanoid();

    await this.env.DB.prepare(
      "INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    )
      .bind(id, userId, name, keyPrefix, keyHash)
      .run();

    const row = await this.env.DB.prepare('SELECT * FROM api_keys WHERE id = ?')
      .bind(id)
      .first<ApiKeyRow>();

    if (!row) {
      throw new ApiKeyError('CREATE_FAILED', 'Failed to create API key');
    }

    return { key, apiKey: rowToApiKey(row) };
  }

  async listApiKeys(userId: string): Promise<ApiKey[]> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
    )
      .bind(userId)
      .all<ApiKeyRow>();

    return result.results.map(rowToApiKey);
  }

  async deleteApiKey(userId: string, keyId: string): Promise<void> {
    const result = await this.env.DB.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?')
      .bind(keyId, userId)
      .run();

    if (result.meta.changes === 0) {
      throw new ApiKeyError('KEY_NOT_FOUND', 'API key not found');
    }
  }

  async toggleApiKey(userId: string, keyId: string, isActive: boolean): Promise<ApiKey> {
    const activeValue = isActive ? 1 : 0;

    const result = await this.env.DB.prepare(
      'UPDATE api_keys SET is_active = ? WHERE id = ? AND user_id = ?',
    )
      .bind(activeValue, keyId, userId)
      .run();

    if (result.meta.changes === 0) {
      throw new ApiKeyError('KEY_NOT_FOUND', 'API key not found');
    }

    const row = await this.env.DB.prepare('SELECT * FROM api_keys WHERE id = ?')
      .bind(keyId)
      .first<ApiKeyRow>();

    if (!row) {
      throw new ApiKeyError('KEY_NOT_FOUND', 'API key not found');
    }

    return rowToApiKey(row);
  }

  async getUsage(
    userId: string,
    keyId: string,
  ): Promise<{
    daily_usage: number;
    daily_limit: number;
    total_requests: number;
    last_used_at: string | null;
  }> {
    const row = await this.env.DB.prepare(
      'SELECT daily_usage, daily_limit, total_requests, last_used_at FROM api_keys WHERE id = ? AND user_id = ?',
    )
      .bind(keyId, userId)
      .first<{
        daily_usage: number;
        daily_limit: number;
        total_requests: number;
        last_used_at: string | null;
      }>();

    if (!row) {
      throw new ApiKeyError('KEY_NOT_FOUND', 'API key not found');
    }

    return {
      daily_usage: row.daily_usage,
      daily_limit: row.daily_limit,
      total_requests: row.total_requests,
      last_used_at: row.last_used_at,
    };
  }
}

export class ApiKeyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiKeyError';
  }
}
