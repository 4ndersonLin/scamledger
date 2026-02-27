import { describe, it, expect } from 'vitest';
import {
  validateAddress,
  detectChain,
  validateReportInput,
  sanitizeString,
} from '../validators.js';
import { getRiskLevel } from '../constants.js';

// ──────────────────────────────────────────────
// validateAddress
// ──────────────────────────────────────────────

describe('validateAddress', () => {
  describe('ETH', () => {
    it('accepts a valid ETH address (0x + 40 hex chars)', () => {
      expect(validateAddress('ETH', '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD08')).toBe(true);
    });

    it('accepts all-lowercase hex', () => {
      expect(validateAddress('ETH', '0x' + 'a'.repeat(40))).toBe(true);
    });

    it('accepts all-uppercase hex', () => {
      expect(validateAddress('ETH', '0x' + 'A'.repeat(40))).toBe(true);
    });

    it('rejects address that is too short', () => {
      expect(validateAddress('ETH', '0x742d35Cc6634C053')).toBe(false);
    });

    it('rejects address without 0x prefix', () => {
      expect(validateAddress('ETH', '742d35Cc6634C0532925a3b844Bc9e7595f2bD08')).toBe(false);
    });

    it('rejects address with non-hex characters', () => {
      expect(validateAddress('ETH', '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validateAddress('ETH', '')).toBe(false);
    });
  });

  describe('BTC', () => {
    it('accepts a valid legacy address starting with 1', () => {
      expect(validateAddress('BTC', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(true);
    });

    it('accepts a valid P2SH address starting with 3', () => {
      expect(validateAddress('BTC', '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(true);
    });

    it('accepts a valid bech32 address starting with bc1', () => {
      expect(validateAddress('BTC', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe(true);
    });

    it('rejects address with invalid prefix', () => {
      expect(validateAddress('BTC', '2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(false);
    });

    it('rejects address that is too short', () => {
      expect(validateAddress('BTC', '1abc')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validateAddress('BTC', '')).toBe(false);
    });
  });

  describe('SOL', () => {
    it('accepts a valid base58 address (32-44 chars)', () => {
      expect(validateAddress('SOL', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(true);
    });

    it('accepts a 32-char base58 address', () => {
      expect(validateAddress('SOL', '11111111111111111111111111111111')).toBe(true);
    });

    it('rejects address that is too short (less than 32 chars)', () => {
      expect(validateAddress('SOL', 'abc123')).toBe(false);
    });

    it('rejects address with invalid base58 char 0', () => {
      expect(validateAddress('SOL', '0WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(false);
    });

    it('rejects address with invalid base58 char O', () => {
      expect(validateAddress('SOL', 'OWzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(false);
    });

    it('rejects address with invalid base58 char I', () => {
      expect(validateAddress('SOL', 'IWzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(false);
    });

    it('rejects address with invalid base58 char l', () => {
      expect(validateAddress('SOL', 'lWzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(false);
    });
  });

  describe('TRON', () => {
    it('accepts a valid TRON address (T + 33 chars)', () => {
      expect(validateAddress('TRON', 'TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW')).toBe(true);
    });

    it('rejects address with wrong prefix', () => {
      expect(validateAddress('TRON', 'AJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW')).toBe(false);
    });

    it('rejects address with wrong length (too short)', () => {
      expect(validateAddress('TRON', 'TJCnKsPa7y5okkXv')).toBe(false);
    });

    it('rejects address with wrong length (too long)', () => {
      expect(validateAddress('TRON', 'TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMWx')).toBe(false);
    });
  });

  describe('BSC', () => {
    it('accepts a valid BSC address (same as ETH format)', () => {
      expect(validateAddress('BSC', '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD08')).toBe(true);
    });

    it('rejects invalid BSC address', () => {
      expect(validateAddress('BSC', 'invalid')).toBe(false);
    });
  });

  describe('MATIC', () => {
    it('accepts a valid MATIC address (same as ETH format)', () => {
      expect(validateAddress('MATIC', '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD08')).toBe(true);
    });

    it('rejects invalid MATIC address', () => {
      expect(validateAddress('MATIC', 'invalid')).toBe(false);
    });
  });

  describe('OTHER', () => {
    it('accepts any string', () => {
      expect(validateAddress('OTHER', 'literally-anything')).toBe(true);
    });

    it('accepts empty string', () => {
      expect(validateAddress('OTHER', '')).toBe(true);
    });
  });
});

// ──────────────────────────────────────────────
// detectChain
// ──────────────────────────────────────────────

describe('detectChain', () => {
  it('detects ETH from 0x prefix', () => {
    expect(detectChain('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD08')).toBe('ETH');
  });

  it('detects TRON from T prefix', () => {
    expect(detectChain('TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW')).toBe('TRON');
  });

  it('detects BTC from bc1 prefix', () => {
    expect(detectChain('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe('BTC');
  });

  it('detects BTC from 1 prefix (legacy)', () => {
    expect(detectChain('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe('BTC');
  });

  it('detects BTC from 3 prefix (P2SH)', () => {
    expect(detectChain('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe('BTC');
  });

  it('detects SOL for base58 string', () => {
    expect(detectChain('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe('SOL');
  });

  it('returns null for unrecognizable address', () => {
    expect(detectChain('not-a-valid-address')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(detectChain('')).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(detectChain(null as unknown as string)).toBeNull();
    expect(detectChain(undefined as unknown as string)).toBeNull();
  });
});

// ──────────────────────────────────────────────
// validateReportInput
// ──────────────────────────────────────────────

describe('validateReportInput', () => {
  const validInput = {
    chain: 'ETH',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD08',
    scam_type: 'phishing',
    description: 'This is a test scam report.',
  };

  it('returns valid for correct input', () => {
    const result = validateReportInput(validInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid with all optional fields', () => {
    const result = validateReportInput({
      ...validInput,
      loss_amount: 5000,
      loss_currency: 'ETH',
      evidence_url: 'https://example.com/evidence',
      tx_hash: '0xabc123',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid for non-object input', () => {
    const result = validateReportInput('string');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Input must be an object.');
  });

  it('returns invalid for null input', () => {
    const result = validateReportInput(null);
    expect(result.valid).toBe(false);
  });

  it('returns invalid when chain is missing', () => {
    const result = validateReportInput({ ...validInput, chain: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('chain'))).toBe(true);
  });

  it('returns invalid when chain is not a valid chain', () => {
    const result = validateReportInput({ ...validInput, chain: 'INVALID' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('chain'))).toBe(true);
  });

  it('returns invalid when address is missing', () => {
    const result = validateReportInput({ ...validInput, address: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Address'))).toBe(true);
  });

  it('returns invalid when address is empty string', () => {
    const result = validateReportInput({ ...validInput, address: '  ' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Address'))).toBe(true);
  });

  it('returns invalid when address format is wrong for chain', () => {
    const result = validateReportInput({ ...validInput, address: 'invalid-address' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid address format'))).toBe(true);
  });

  it('returns invalid when scam_type is missing', () => {
    const result = validateReportInput({ ...validInput, scam_type: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('scam type'))).toBe(true);
  });

  it('returns invalid when description is missing', () => {
    const result = validateReportInput({ ...validInput, description: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Description'))).toBe(true);
  });

  it('returns invalid when description exceeds 2000 characters', () => {
    const result = validateReportInput({
      ...validInput,
      description: 'a'.repeat(2001),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('2000'))).toBe(true);
  });

  it('returns invalid when evidence_url is not a valid URL', () => {
    const result = validateReportInput({
      ...validInput,
      evidence_url: 'not-a-url',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Evidence URL'))).toBe(true);
  });

  it('accepts null evidence_url', () => {
    const result = validateReportInput({
      ...validInput,
      evidence_url: null,
    });
    expect(result.valid).toBe(true);
  });

  it('returns invalid when loss_amount is negative', () => {
    const result = validateReportInput({
      ...validInput,
      loss_amount: -100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('non-negative'))).toBe(true);
  });

  it('accepts zero loss_amount', () => {
    const result = validateReportInput({
      ...validInput,
      loss_amount: 0,
    });
    expect(result.valid).toBe(true);
  });

  it('accepts null loss_amount', () => {
    const result = validateReportInput({
      ...validInput,
      loss_amount: null,
    });
    expect(result.valid).toBe(true);
  });

  it('collects multiple errors', () => {
    const result = validateReportInput({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

// ──────────────────────────────────────────────
// sanitizeString
// ──────────────────────────────────────────────

describe('sanitizeString', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeString('  hello  ', 100)).toBe('hello');
  });

  it('collapses multiple spaces into a single space', () => {
    expect(sanitizeString('hello    world', 100)).toBe('hello world');
  });

  it('collapses tabs and newlines into a single space', () => {
    expect(sanitizeString('hello\t\n\r  world', 100)).toBe('hello world');
  });

  it('limits string length to maxLength', () => {
    expect(sanitizeString('abcdefghij', 5)).toBe('abcde');
  });

  it('strips HTML tags via whitespace collapsing (tags remain but are truncated by length)', () => {
    const result = sanitizeString('<script>alert("xss")</script>', 10);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('handles empty string', () => {
    expect(sanitizeString('', 100)).toBe('');
  });

  it('handles string that is already within length', () => {
    expect(sanitizeString('hello', 100)).toBe('hello');
  });
});

// ──────────────────────────────────────────────
// getRiskLevel
// ──────────────────────────────────────────────

describe('getRiskLevel', () => {
  it('returns low for score 0', () => {
    expect(getRiskLevel(0)).toBe('low');
  });

  it('returns low for score 25', () => {
    expect(getRiskLevel(25)).toBe('low');
  });

  it('returns medium for score 26', () => {
    expect(getRiskLevel(26)).toBe('medium');
  });

  it('returns medium for score 50', () => {
    expect(getRiskLevel(50)).toBe('medium');
  });

  it('returns high for score 51', () => {
    expect(getRiskLevel(51)).toBe('high');
  });

  it('returns high for score 75', () => {
    expect(getRiskLevel(75)).toBe('high');
  });

  it('returns critical for score 76', () => {
    expect(getRiskLevel(76)).toBe('critical');
  });

  it('returns critical for score 100', () => {
    expect(getRiskLevel(100)).toBe('critical');
  });
});
