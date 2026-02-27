import type { Env } from '../types/index.js';
import type { Address, AddressDetail, PublicReport } from '@cryptoscam/shared';

export class AddressService {
  constructor(private readonly env: Env) {}

  async getAddressDetail(chain: string, address: string): Promise<AddressDetail | null> {
    const addressRecord = await this.env.DB.prepare(
      `SELECT id, chain, address, report_count, total_lost_usd,
              risk_score, first_reported_at, last_reported_at, updated_at
       FROM addresses WHERE chain = ? AND address = ?`,
    )
      .bind(chain, address)
      .first<Address>();

    if (!addressRecord) {
      return null;
    }

    const reportsResult = await this.env.DB.prepare(
      `SELECT id, chain, address, scam_type, description, loss_amount, loss_currency,
              evidence_url, tx_hash, source, created_at
       FROM reports WHERE address_id = ? ORDER BY created_at DESC`,
    )
      .bind(addressRecord.id)
      .all<PublicReport>();

    return {
      ...addressRecord,
      reports: reportsResult.results,
    };
  }

  async getHighRiskAddresses(limit: number = 10): Promise<Address[]> {
    const result = await this.env.DB.prepare(
      `SELECT id, chain, address, report_count, total_lost_usd,
              risk_score, first_reported_at, last_reported_at, updated_at
       FROM addresses
       WHERE risk_score > 0
       ORDER BY risk_score DESC, report_count DESC
       LIMIT ?`,
    )
      .bind(limit)
      .all<Address>();

    return result.results;
  }
}
