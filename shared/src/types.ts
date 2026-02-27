// ──────────────────────────────────────────────
// Enums / Union Types
// ──────────────────────────────────────────────

export type Chain = 'ETH' | 'BTC' | 'SOL' | 'TRON' | 'BSC' | 'MATIC' | 'OTHER';

export type ScamType =
  | 'phishing'
  | 'rug_pull'
  | 'fake_exchange'
  | 'hack'
  | 'ponzi'
  | 'impersonation'
  | 'fake_airdrop'
  | 'romance'
  | 'other';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ReportSource = 'web' | 'api';

// ──────────────────────────────────────────────
// Database Models
// ──────────────────────────────────────────────

export interface Report {
  id: string;
  chain: Chain;
  address: string;
  scam_type: ScamType;
  description: string;
  loss_amount: number | null;
  loss_currency: string | null;
  evidence_url: string | null;
  tx_hash: string | null;
  reporter_ip: string;
  reporter_ip_hash: string;
  reporter_ua: string;
  source: ReportSource;
  api_key_id: string | null;
  created_at: string;
}

/** Report with PII fields stripped — safe for public API responses */
export type PublicReport = Omit<
  Report,
  'reporter_ip' | 'reporter_ip_hash' | 'reporter_ua' | 'api_key_id'
>;

export interface Address {
  id: string;
  chain: Chain;
  address: string;
  report_count: number;
  total_lost_usd: number;
  risk_score: number;
  first_reported_at: string;
  last_reported_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface Credential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  is_active: boolean;
  daily_limit: number;
  daily_usage: number;
  total_requests: number;
  usage_reset_date: string;
  last_used_at: string | null;
  created_at: string;
}

export interface DailyStats {
  id: string;
  date: string;
  total_reports: number;
  new_addresses: number;
  total_loss_usd: number;
  chain_breakdown: string;
  scam_type_breakdown: string;
}

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  rate_limit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type ApiResponse<T> =
  | { success: true; data: T; meta?: ApiMeta }
  | { success: false; error: ApiError };

// ──────────────────────────────────────────────
// Dashboard / Stats Types
// ──────────────────────────────────────────────

export interface StatsOverview {
  total_reports: number;
  high_risk_addresses: number;
  total_loss_usd: number;
  monthly_reports: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface ChainBreakdown {
  chain: Chain;
  count: number;
}

export interface ScamTypeBreakdown {
  scam_type: ScamType;
  count: number;
}

// ──────────────────────────────────────────────
// Input / Params Types
// ──────────────────────────────────────────────

export interface ReportInput {
  chain: Chain;
  address: string;
  scam_type: ScamType;
  description: string;
  loss_amount?: number | null;
  loss_currency?: string | null;
  evidence_url?: string | null;
  tx_hash?: string | null;
  turnstile_token?: string;
}

export interface SearchParams {
  q?: string;
  chain?: Chain;
  scam_type?: ScamType;
  date_from?: string;
  date_to?: string;
  sort?: 'newest' | 'risk' | 'reports';
  page?: number;
  limit?: number;
}

// ──────────────────────────────────────────────
// Composite Types
// ──────────────────────────────────────────────

export type AddressDetail = Address & {
  reports: PublicReport[];
};
