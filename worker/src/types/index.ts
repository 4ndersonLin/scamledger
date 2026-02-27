export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ENVIRONMENT: string;
  FRONTEND_URL: string;
  TURNSTILE_SECRET_KEY: string;
  RP_ID: string;
  RP_NAME: string;
  RP_ORIGIN: string;
  THREAT_INTEL_ENABLED: string;
}

export interface SessionData {
  userId: string;
  ip: string;
  ua: string;
  createdAt: string;
  expiresAt: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// Hono context variables
export interface Variables {
  userId: string;
  sessionToken: string;
  apiKeyId: string;
  apiKeyUserId: string;
  sanitizedBody: unknown;
  rateLimitInfo: RateLimitInfo;
}
