import type { Env } from '../types';

export class CacheService {
  private readonly env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.env.KV.get(key);
    if (value === null) {
      return null;
    }
    return JSON.parse(value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const options: KVNamespacePutOptions = {};
    if (ttlSeconds !== undefined) {
      options.expirationTtl = ttlSeconds;
    }
    await this.env.KV.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
    await this.env.KV.delete(key);
  }
}
