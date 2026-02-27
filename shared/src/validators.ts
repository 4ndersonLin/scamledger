import type { Chain } from './types.js';
import { CHAINS, MAX_DESCRIPTION_LENGTH, MAX_PAGE_SIZE, SCAM_TYPES } from './constants.js';

// ──────────────────────────────────────────────
// Address Format Validators
// ──────────────────────────────────────────────

const ADDRESS_PATTERNS: Record<Chain, RegExp | null> = {
  ETH: /^0x[a-fA-F0-9]{40}$/,
  BTC: /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/,
  SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  TRON: /^T[a-zA-HJ-NP-Z0-9]{33}$/,
  BSC: /^0x[a-fA-F0-9]{40}$/,
  MATIC: /^0x[a-fA-F0-9]{40}$/,
  OTHER: null,
};

/**
 * Validates an address string against the expected format for the given chain.
 * Returns true for OTHER chain (no specific format required).
 */
export function validateAddress(chain: Chain, address: string): boolean {
  const pattern = ADDRESS_PATTERNS[chain];
  if (pattern === null) return true;
  return pattern.test(address);
}

/**
 * Attempts to detect the chain from an address format.
 * Returns the best-guess chain or null if no match is found.
 */
export function detectChain(address: string): Chain | null {
  if (!address || typeof address !== 'string') return null;

  // TRON addresses start with 'T' — check before BTC to avoid false positives
  if (ADDRESS_PATTERNS.TRON!.test(address)) return 'TRON';

  // BTC addresses start with 1, 3, or bc1
  if (ADDRESS_PATTERNS.BTC!.test(address)) return 'BTC';

  // SOL addresses are base58, 32-44 chars — check before ETH-like to avoid overlap
  if (ADDRESS_PATTERNS.SOL!.test(address)) return 'SOL';

  // ETH/BSC/MATIC all share the 0x format — default to ETH
  if (ADDRESS_PATTERNS.ETH!.test(address)) return 'ETH';

  return null;
}

// ──────────────────────────────────────────────
// Validation Helpers
// ──────────────────────────────────────────────

const VALID_CHAINS = new Set<string>(CHAINS.map((c) => c.id));
const VALID_SCAM_TYPES = new Set<string>(SCAM_TYPES.map((s) => s.id));
const VALID_SORT_VALUES = new Set<string>(['newest', 'risk', 'reports']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === null || value === undefined || typeof value === 'string';
}

function isOptionalNumber(value: unknown): value is number | null | undefined {
  return value === null || value === undefined || typeof value === 'number';
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// ──────────────────────────────────────────────
// Report Input Validation
// ──────────────────────────────────────────────

/**
 * Validates a ReportInput object from unknown input.
 * Returns validation result with an array of error messages.
 */
export function validateReportInput(input: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['Input must be an object.'] };
  }

  const {
    chain,
    address,
    scam_type,
    description,
    loss_amount,
    loss_currency,
    evidence_url,
    tx_hash,
  } = input as Record<string, unknown>;

  // chain (required)
  if (!isString(chain) || !VALID_CHAINS.has(chain)) {
    errors.push(`Invalid chain. Must be one of: ${[...VALID_CHAINS].join(', ')}.`);
  }

  // address (required)
  if (!isString(address) || address.trim().length === 0) {
    errors.push('Address is required.');
  } else if (isString(chain) && VALID_CHAINS.has(chain)) {
    if (!validateAddress(chain as Chain, address)) {
      errors.push(`Invalid address format for chain ${chain}.`);
    }
  }

  // scam_type (required)
  if (!isString(scam_type) || !VALID_SCAM_TYPES.has(scam_type)) {
    errors.push(`Invalid scam type. Must be one of: ${[...VALID_SCAM_TYPES].join(', ')}.`);
  }

  // description (required)
  if (!isString(description) || description.trim().length === 0) {
    errors.push('Description is required.');
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`);
  }

  // loss_amount (optional)
  if (!isOptionalNumber(loss_amount)) {
    errors.push('Loss amount must be a number or null.');
  } else if (typeof loss_amount === 'number' && loss_amount < 0) {
    errors.push('Loss amount must be non-negative.');
  }

  // loss_currency (optional)
  if (!isOptionalString(loss_currency)) {
    errors.push('Loss currency must be a string or null.');
  }

  // evidence_url (optional)
  if (!isOptionalString(evidence_url)) {
    errors.push('Evidence URL must be a string or null.');
  } else if (isString(evidence_url) && evidence_url.length > 0) {
    try {
      new URL(evidence_url);
    } catch {
      errors.push('Evidence URL must be a valid URL.');
    }
  }

  // tx_hash (optional)
  if (!isOptionalString(tx_hash)) {
    errors.push('Transaction hash must be a string or null.');
  }

  return { valid: errors.length === 0, errors };
}

// ──────────────────────────────────────────────
// Search Params Validation
// ──────────────────────────────────────────────

/**
 * Validates SearchParams from unknown input.
 * Returns validation result with an array of error messages.
 */
export function validateSearchParams(input: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['Input must be an object.'] };
  }

  const { q, chain, scam_type, date_from, date_to, sort, page, limit } = input as Record<
    string,
    unknown
  >;

  // q (optional)
  if (q !== undefined && !isString(q)) {
    errors.push('Query (q) must be a string.');
  }

  // chain (optional)
  if (chain !== undefined && (!isString(chain) || !VALID_CHAINS.has(chain))) {
    errors.push(`Invalid chain. Must be one of: ${[...VALID_CHAINS].join(', ')}.`);
  }

  // scam_type (optional)
  if (scam_type !== undefined && (!isString(scam_type) || !VALID_SCAM_TYPES.has(scam_type))) {
    errors.push(`Invalid scam type. Must be one of: ${[...VALID_SCAM_TYPES].join(', ')}.`);
  }

  // date_from (optional)
  if (date_from !== undefined) {
    if (!isString(date_from) || !ISO_DATE_PATTERN.test(date_from)) {
      errors.push('date_from must be a valid date string (YYYY-MM-DD).');
    }
  }

  // date_to (optional)
  if (date_to !== undefined) {
    if (!isString(date_to) || !ISO_DATE_PATTERN.test(date_to)) {
      errors.push('date_to must be a valid date string (YYYY-MM-DD).');
    }
  }

  // sort (optional)
  if (sort !== undefined && (!isString(sort) || !VALID_SORT_VALUES.has(sort))) {
    errors.push('Sort must be one of: newest, risk, reports.');
  }

  // page (optional)
  if (page !== undefined) {
    if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) {
      errors.push('Page must be a positive integer.');
    }
  }

  // limit (optional)
  if (limit !== undefined) {
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1) {
      errors.push('Limit must be a positive integer.');
    } else if (limit > MAX_PAGE_SIZE) {
      errors.push(`Limit must not exceed ${MAX_PAGE_SIZE}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ──────────────────────────────────────────────
// String Sanitization
// ──────────────────────────────────────────────

/**
 * Sanitizes a string by trimming whitespace, collapsing consecutive
 * whitespace characters into a single space, and limiting length.
 */
export function sanitizeString(str: string, maxLength: number): string {
  return str.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}
