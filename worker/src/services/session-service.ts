import { nanoid } from 'nanoid';
import type { Env, SessionData } from '../types/index.js';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export class SessionService {
  constructor(private readonly env: Env) {}

  async createSession(userId: string, ip: string, ua: string): Promise<string> {
    const token = nanoid(64);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

    const sessionData: SessionData = {
      userId,
      ip,
      ua,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.env.KV.put(`session:${token}`, JSON.stringify(sessionData), {
      expirationTtl: SESSION_TTL_SECONDS,
    });

    return token;
  }

  async getSession(token: string): Promise<SessionData | null> {
    const value = await this.env.KV.get(`session:${token}`);
    if (value === null) {
      return null;
    }
    return JSON.parse(value) as SessionData;
  }

  async deleteSession(token: string): Promise<void> {
    await this.env.KV.delete(`session:${token}`);
  }
}
