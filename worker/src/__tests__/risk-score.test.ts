import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateRiskScore } from '../utils/risk-score.js';

describe('calculateRiskScore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns base = 15 for 1 report', () => {
    const score = calculateRiskScore({
      reportCount: 1,
      recentReportsCount: 0,
      totalLostUsd: 0,
      lastReportedAt: null,
    });
    expect(score).toBe(15);
  });

  it('returns base = 60 for 4 reports (4 * 15 = 60)', () => {
    const score = calculateRiskScore({
      reportCount: 4,
      recentReportsCount: 0,
      totalLostUsd: 0,
      lastReportedAt: null,
    });
    expect(score).toBe(60);
  });

  it('caps base at 60 for 5 reports (5 * 15 = 75 -> capped at 60)', () => {
    const score = calculateRiskScore({
      reportCount: 5,
      recentReportsCount: 0,
      totalLostUsd: 0,
      lastReportedAt: null,
    });
    expect(score).toBe(60);
  });

  it('adds +20 frequency bonus when 3+ recent reports in 7 days', () => {
    const score = calculateRiskScore({
      reportCount: 1,
      recentReportsCount: 3,
      totalLostUsd: 0,
      lastReportedAt: null,
    });
    // base 15 + frequency 20 = 35
    expect(score).toBe(35);
  });

  it('does not add frequency bonus when fewer than 3 recent reports', () => {
    const score = calculateRiskScore({
      reportCount: 1,
      recentReportsCount: 2,
      totalLostUsd: 0,
      lastReportedAt: null,
    });
    expect(score).toBe(15);
  });

  it('adds +10 for loss > $10K', () => {
    const score = calculateRiskScore({
      reportCount: 1,
      recentReportsCount: 0,
      totalLostUsd: 10001,
      lastReportedAt: null,
    });
    // base 15 + amount 10 = 25
    expect(score).toBe(25);
  });

  it('adds +20 for loss > $100K (overrides the $10K bonus)', () => {
    const score = calculateRiskScore({
      reportCount: 1,
      recentReportsCount: 0,
      totalLostUsd: 100001,
      lastReportedAt: null,
    });
    // base 15 + amount 20 = 35
    expect(score).toBe(35);
  });

  it('adds +10 recency when last reported within 24 hours', () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
    const score = calculateRiskScore({
      reportCount: 1,
      recentReportsCount: 0,
      totalLostUsd: 0,
      lastReportedAt: recentDate,
    });
    // base 15 + recency 10 = 25
    expect(score).toBe(25);
  });

  it('does not add recency when last reported more than 24 hours ago', () => {
    const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(); // 25 hours ago
    const score = calculateRiskScore({
      reportCount: 1,
      recentReportsCount: 0,
      totalLostUsd: 0,
      lastReportedAt: oldDate,
    });
    expect(score).toBe(15);
  });

  it('does not add recency when lastReportedAt is null', () => {
    const score = calculateRiskScore({
      reportCount: 1,
      recentReportsCount: 0,
      totalLostUsd: 0,
      lastReportedAt: null,
    });
    expect(score).toBe(15);
  });

  it('caps maximum score at 100', () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 30).toISOString(); // 30 min ago
    const score = calculateRiskScore({
      reportCount: 10,
      recentReportsCount: 5,
      totalLostUsd: 500000,
      lastReportedAt: recentDate,
    });
    // base 60 (capped) + frequency 20 + amount 20 + recency 10 = 110 -> capped at 100
    expect(score).toBe(100);
  });

  it('returns 0 for zero reports', () => {
    const score = calculateRiskScore({
      reportCount: 0,
      recentReportsCount: 0,
      totalLostUsd: 0,
      lastReportedAt: null,
    });
    expect(score).toBe(0);
  });

  it('combines all bonuses correctly', () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(); // 12 hours ago
    const score = calculateRiskScore({
      reportCount: 2,
      recentReportsCount: 3,
      totalLostUsd: 50000,
      lastReportedAt: recentDate,
    });
    // base 30 + frequency 20 + amount 10 + recency 10 = 70
    expect(score).toBe(70);
  });

  it('does not add amount bonus when loss is exactly $10K', () => {
    const score = calculateRiskScore({
      reportCount: 1,
      recentReportsCount: 0,
      totalLostUsd: 10000,
      lastReportedAt: null,
    });
    // base 15, amount not triggered (> 10000 required)
    expect(score).toBe(15);
  });

  it('does not add amount bonus when loss is exactly $100K', () => {
    const score = calculateRiskScore({
      reportCount: 1,
      recentReportsCount: 0,
      totalLostUsd: 100000,
      lastReportedAt: null,
    });
    // base 15 + amount 10 (> 10000 but not > 100000)
    expect(score).toBe(25);
  });
});
