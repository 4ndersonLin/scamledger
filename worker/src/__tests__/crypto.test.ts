import { describe, it, expect } from 'vitest';
import { sha256, generateApiKey } from '../utils/crypto.js';

describe('sha256', () => {
  it('returns expected hash for a known input', async () => {
    // SHA-256 of "hello" is well-known
    const hash = await sha256('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('returns expected hash for empty string', async () => {
    const hash = await sha256('');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('produces consistent output for the same input', async () => {
    const hash1 = await sha256('test-consistency');
    const hash2 = await sha256('test-consistency');
    expect(hash1).toBe(hash2);
  });

  it('produces different output for different inputs', async () => {
    const hash1 = await sha256('input-a');
    const hash2 = await sha256('input-b');
    expect(hash1).not.toBe(hash2);
  });

  it('returns a 64-character hex string', async () => {
    const hash = await sha256('anything');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('generateApiKey', () => {
  it('starts with csr_ prefix', () => {
    const key = generateApiKey();
    expect(key.startsWith('csr_')).toBe(true);
  });

  it('has total length of 68 (csr_ prefix + 64 hex chars)', () => {
    const key = generateApiKey();
    expect(key).toHaveLength(68);
  });

  it('contains only hex characters after the prefix', () => {
    const key = generateApiKey();
    const hexPart = key.slice(4);
    expect(hexPart).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different keys on successive calls', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1).not.toBe(key2);
  });
});
