import { nanoid } from 'nanoid';
import type { ThreatIntel } from '@cryptoscam/shared';
import type { Env } from '../types/index.js';
import type { NormalizedThreatIntel, SyncState } from './fetchers/types.js';
import { calculateRiskScore } from '../utils/risk-score.js';

const BATCH_SIZE = 50;

export class ThreatIntelService {
  constructor(private readonly env: Env) {}

  async importRecords(records: NormalizedThreatIntel[]): Promise<number> {
    let imported = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const statements: D1PreparedStatement[] = [];

      for (const record of batch) {
        const id = nanoid();

        // Insert threat intel record (ignore duplicates)
        statements.push(
          this.env.DB.prepare(
            `INSERT OR IGNORE INTO threat_intel (id, chain, address, source, external_id, scam_type, category, description, confidence, raw_data, fetched_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          ).bind(
            id,
            record.chain,
            record.address,
            record.source,
            record.external_id,
            record.scam_type,
            record.category,
            record.description,
            record.confidence,
            record.raw_data,
          ),
        );
      }

      const results = await this.env.DB.batch(statements);
      for (const result of results) {
        if (result.meta.changes > 0) {
          imported++;
        }
      }
    }

    // Link address_id and update has_threat_intel for all unlinked records
    await this.linkAddresses();

    // Recalculate risk scores for addresses with threat intel
    await this.recalculateAffectedRiskScores();

    return imported;
  }

  private async linkAddresses(): Promise<void> {
    // Link threat_intel records to existing addresses
    await this.env.DB.prepare(
      `UPDATE threat_intel
       SET address_id = (
         SELECT a.id FROM addresses a
         WHERE a.chain = threat_intel.chain AND a.address = threat_intel.address
       )
       WHERE address_id IS NULL`,
    ).run();

    // Set has_threat_intel flag on linked addresses
    await this.env.DB.prepare(
      `UPDATE addresses SET has_threat_intel = 1
       WHERE id IN (SELECT DISTINCT address_id FROM threat_intel WHERE address_id IS NOT NULL)
       AND has_threat_intel = 0`,
    ).run();
  }

  private async recalculateAffectedRiskScores(): Promise<void> {
    // Get addresses that have threat intel and may need risk score updates
    const affected = await this.env.DB.prepare(
      `SELECT a.id, a.report_count, a.total_lost_usd, a.last_reported_at,
              (SELECT COUNT(*) FROM reports r WHERE r.address_id = a.id AND r.created_at >= datetime('now', '-7 days')) as recent_reports,
              (SELECT COUNT(*) FROM threat_intel t WHERE t.address_id = a.id) as threat_count,
              (SELECT COUNT(*) FROM threat_intel t WHERE t.address_id = a.id AND t.source = 'ofac_sdn') as ofac_count
       FROM addresses a
       WHERE a.has_threat_intel = 1`,
    ).all<{
      id: string;
      report_count: number;
      total_lost_usd: number;
      last_reported_at: string | null;
      recent_reports: number;
      threat_count: number;
      ofac_count: number;
    }>();

    const statements: D1PreparedStatement[] = [];
    for (const addr of affected.results) {
      const riskScore = calculateRiskScore({
        reportCount: addr.report_count,
        recentReportsCount: addr.recent_reports,
        totalLostUsd: addr.total_lost_usd,
        lastReportedAt: addr.last_reported_at,
        threatIntelCount: addr.threat_count,
        hasOfacSanction: addr.ofac_count > 0,
      });
      statements.push(
        this.env.DB.prepare('UPDATE addresses SET risk_score = ? WHERE id = ?').bind(
          riskScore,
          addr.id,
        ),
      );
    }

    // Batch update in chunks
    for (let i = 0; i < statements.length; i += BATCH_SIZE) {
      await this.env.DB.batch(statements.slice(i, i + BATCH_SIZE));
    }
  }

  async getByAddress(chain: string, address: string): Promise<ThreatIntel[]> {
    const result = await this.env.DB.prepare(
      `SELECT id, chain, address, source, external_id, scam_type, category, description, confidence, fetched_at
       FROM threat_intel WHERE chain = ? AND address = ?
       ORDER BY fetched_at DESC`,
    )
      .bind(chain, address)
      .all<ThreatIntel>();

    return result.results;
  }

  async getSyncState(source: string): Promise<SyncState | null> {
    return this.env.DB.prepare('SELECT * FROM threat_intel_sync_state WHERE source = ?')
      .bind(source)
      .first<SyncState>();
  }

  async updateSyncState(
    source: string,
    updates: {
      lastEtag?: string;
      recordsImported: number;
      lastError?: string | null;
    },
  ): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO threat_intel_sync_state (source, last_sync_at, last_etag, records_imported, last_error, updated_at)
       VALUES (?, datetime('now'), ?, ?, ?, datetime('now'))
       ON CONFLICT(source) DO UPDATE SET
         last_sync_at = datetime('now'),
         last_etag = COALESCE(?, last_etag),
         records_imported = records_imported + ?,
         last_error = ?,
         updated_at = datetime('now')`,
    )
      .bind(
        source,
        updates.lastEtag ?? null,
        updates.recordsImported,
        updates.lastError ?? null,
        updates.lastEtag ?? null,
        updates.recordsImported,
        updates.lastError ?? null,
      )
      .run();
  }
}
