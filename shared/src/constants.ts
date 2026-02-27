import type { Chain, RiskLevel, ScamType } from './types.js';

// ──────────────────────────────────────────────
// Chain Definitions
// ──────────────────────────────────────────────

export interface ChainInfo {
  id: Chain;
  name: string;
  symbol: string;
}

export const CHAINS: readonly ChainInfo[] = [
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH' },
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'SOL', name: 'Solana', symbol: 'SOL' },
  { id: 'TRON', name: 'TRON', symbol: 'TRX' },
  { id: 'BSC', name: 'BNB Smart Chain', symbol: 'BNB' },
  { id: 'MATIC', name: 'Polygon', symbol: 'MATIC' },
  { id: 'OTHER', name: 'Other', symbol: '' },
] as const;

// ──────────────────────────────────────────────
// Scam Type Definitions
// ──────────────────────────────────────────────

export interface ScamTypeInfo {
  id: ScamType;
  labelKey: string;
}

export const SCAM_TYPES: readonly ScamTypeInfo[] = [
  { id: 'phishing', labelKey: 'scamType.phishing' },
  { id: 'rug_pull', labelKey: 'scamType.rug_pull' },
  { id: 'fake_exchange', labelKey: 'scamType.fake_exchange' },
  { id: 'hack', labelKey: 'scamType.hack' },
  { id: 'ponzi', labelKey: 'scamType.ponzi' },
  { id: 'impersonation', labelKey: 'scamType.impersonation' },
  { id: 'fake_airdrop', labelKey: 'scamType.fake_airdrop' },
  { id: 'romance', labelKey: 'scamType.romance' },
  { id: 'other', labelKey: 'scamType.other' },
] as const;

// ──────────────────────────────────────────────
// Risk Level Definitions
// ──────────────────────────────────────────────

export interface RiskLevelInfo {
  min: number;
  max: number;
  color: string;
}

export const RISK_LEVELS: Record<RiskLevel, RiskLevelInfo> = {
  low: { min: 0, max: 25, color: '#10b981' },
  medium: { min: 26, max: 50, color: '#f59e0b' },
  high: { min: 51, max: 75, color: '#e63946' },
  critical: { min: 76, max: 100, color: '#e63946' },
} as const;

/**
 * Returns the risk level for a given numeric score (0-100).
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score <= RISK_LEVELS.low.max) return 'low';
  if (score <= RISK_LEVELS.medium.max) return 'medium';
  if (score <= RISK_LEVELS.high.max) return 'high';
  return 'critical';
}

// ──────────────────────────────────────────────
// API Constants
// ──────────────────────────────────────────────

export const API_KEY_PREFIX = 'csr_';

export const MAX_API_KEYS_PER_USER = 5;

// ──────────────────────────────────────────────
// Validation Constants
// ──────────────────────────────────────────────

export const MAX_DESCRIPTION_LENGTH = 2000;

// ──────────────────────────────────────────────
// Pagination Constants
// ──────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 100;
