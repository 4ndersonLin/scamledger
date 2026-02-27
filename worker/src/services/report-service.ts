import { nanoid } from 'nanoid';
import type { Env } from '../types/index.js';
import type { PublicReport, ReportInput, ReportSource } from '@cryptoscam/shared';
import { validateReportInput } from '@cryptoscam/shared';
import { generateDailySalt, hashIpWithSalt } from '../utils/crypto.js';
import { calculateRiskScore } from '../utils/risk-score.js';
import { CacheService } from './cache-service.js';

export class ReportService {
  private readonly cache: CacheService;

  constructor(private readonly env: Env) {
    this.cache = new CacheService(env);
  }

  async createReport(
    input: ReportInput,
    reporterIp: string,
    reporterUa: string,
    source: ReportSource,
    apiKeyId?: string,
  ): Promise<PublicReport> {
    // 1. Validate input
    const validation = validateReportInput(input);
    if (!validation.valid) {
      throw new ValidationError('VALIDATION_ERROR', 'Invalid report input', validation.errors);
    }

    // 2. Generate daily salt and hash IP
    const salt = await generateDailySalt();
    const ipHash = await hashIpWithSalt(reporterIp, salt);

    // 3. Check for duplicate (same IP hash + same address within 24h)
    const duplicateCheck = await this.env.DB.prepare(
      `SELECT id FROM reports
       WHERE reporter_ip_hash = ? AND chain = ? AND address = ?
       AND created_at >= datetime('now', '-24 hours')
       LIMIT 1`,
    )
      .bind(ipHash, input.chain, input.address)
      .first<{ id: string }>();

    if (duplicateCheck) {
      throw new ValidationError(
        'DUPLICATE_REPORT',
        'You have already submitted a report for this address in the last 24 hours',
      );
    }

    // 4. Find or create address record
    let addressRecord = await this.env.DB.prepare(
      'SELECT id, report_count, total_lost_usd FROM addresses WHERE chain = ? AND address = ?',
    )
      .bind(input.chain, input.address)
      .first<{ id: string; report_count: number; total_lost_usd: number }>();

    const now = new Date().toISOString();
    let addressId: string;

    if (!addressRecord) {
      addressId = nanoid();
      await this.env.DB.prepare(
        `INSERT INTO addresses (id, chain, address, report_count, total_lost_usd, risk_score, first_reported_at, last_reported_at, updated_at)
         VALUES (?, ?, ?, 0, 0, 0, ?, ?, ?)`,
      )
        .bind(addressId, input.chain, input.address, now, now, now)
        .run();
      addressRecord = { id: addressId, report_count: 0, total_lost_usd: 0 };
    } else {
      addressId = addressRecord.id;
    }

    // 5. INSERT report
    const reportId = nanoid();
    await this.env.DB.prepare(
      `INSERT INTO reports (id, address_id, chain, address, scam_type, description, loss_amount, loss_currency, evidence_url, tx_hash, reporter_ip, reporter_ip_hash, reporter_ua, source, api_key_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        reportId,
        addressId,
        input.chain,
        input.address,
        input.scam_type,
        input.description,
        input.loss_amount ?? null,
        input.loss_currency ?? null,
        input.evidence_url ?? null,
        input.tx_hash ?? null,
        reporterIp,
        ipHash,
        reporterUa,
        source,
        apiKeyId ?? null,
        now,
      )
      .run();

    // 6. UPDATE address: increment report_count, add loss_amount, update last_reported_at
    const lossAmount = input.loss_amount ?? 0;
    const newReportCount = addressRecord.report_count + 1;
    const newTotalLost = addressRecord.total_lost_usd + lossAmount;

    await this.env.DB.prepare(
      `UPDATE addresses SET
         report_count = ?,
         total_lost_usd = ?,
         last_reported_at = ?,
         updated_at = ?
       WHERE id = ?`,
    )
      .bind(newReportCount, newTotalLost, now, now, addressId)
      .run();

    // 7. Recalculate risk score (including threat intelligence)
    const recentCountResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as count FROM reports
       WHERE address_id = ? AND created_at >= datetime('now', '-7 days')`,
    )
      .bind(addressId)
      .first<{ count: number }>();

    const recentReportsCount = recentCountResult?.count ?? 0;

    const threatIntelResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN source = 'ofac_sdn' THEN 1 ELSE 0 END) as ofac_count
       FROM threat_intel WHERE address_id = ?`,
    )
      .bind(addressId)
      .first<{ total: number; ofac_count: number }>();

    const riskScore = calculateRiskScore({
      reportCount: newReportCount,
      recentReportsCount,
      totalLostUsd: newTotalLost,
      lastReportedAt: now,
      threatIntelCount: threatIntelResult?.total ?? 0,
      hasOfacSanction: (threatIntelResult?.ofac_count ?? 0) > 0,
    });

    await this.env.DB.prepare('UPDATE addresses SET risk_score = ? WHERE id = ?')
      .bind(riskScore, addressId)
      .run();

    // 8. Invalidate cache keys
    await this.cache.delete('stats:overview');
    await this.cache.delete('stats:trends:30');
    await this.cache.delete('stats:breakdown');

    // 9. Return the created report (PII stripped)
    return {
      id: reportId,
      chain: input.chain,
      address: input.address,
      scam_type: input.scam_type,
      description: input.description,
      loss_amount: input.loss_amount ?? null,
      loss_currency: input.loss_currency ?? null,
      evidence_url: input.evidence_url ?? null,
      tx_hash: input.tx_hash ?? null,
      source,
      created_at: now,
    };
  }

  async getRecentReports(limit: number = 10): Promise<PublicReport[]> {
    const result = await this.env.DB.prepare(
      `SELECT id, chain, address, scam_type, description, loss_amount, loss_currency,
              evidence_url, tx_hash, source, created_at
       FROM reports ORDER BY created_at DESC LIMIT ?`,
    )
      .bind(limit)
      .all<PublicReport>();

    return result.results;
  }
}

export class ValidationError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.details = details;
  }
}
