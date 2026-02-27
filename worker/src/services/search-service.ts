import type { Env } from '../types/index.js';
import type { Address, ApiMeta, SearchParams } from '@cryptoscam/shared';
import { DEFAULT_PAGE_SIZE } from '@cryptoscam/shared';

export class SearchService {
  constructor(private readonly env: Env) {}

  async searchAddresses(params: SearchParams): Promise<{ data: Address[]; meta: ApiMeta }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clauses
    const conditions: string[] = ['1=1'];
    const bindings: (string | number)[] = [];

    if (params.q) {
      conditions.push('a.address LIKE ?');
      bindings.push(`${params.q}%`);
    }

    if (params.chain) {
      conditions.push('a.chain = ?');
      bindings.push(params.chain);
    }

    if (params.scam_type) {
      conditions.push('a.id IN (SELECT DISTINCT address_id FROM reports WHERE scam_type = ?)');
      bindings.push(params.scam_type);
    }

    if (params.date_from) {
      conditions.push('a.last_reported_at >= ?');
      bindings.push(params.date_from);
    }

    if (params.date_to) {
      conditions.push('a.last_reported_at <= ?');
      bindings.push(`${params.date_to}T23:59:59`);
    }

    const whereClause = conditions.join(' AND ');

    // Determine ORDER BY
    let orderBy: string;
    switch (params.sort) {
      case 'risk':
        orderBy = 'a.risk_score DESC';
        break;
      case 'reports':
        orderBy = 'a.report_count DESC';
        break;
      case 'newest':
      default:
        orderBy = 'a.last_reported_at DESC';
        break;
    }

    // Count query
    const countResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total FROM addresses a WHERE ${whereClause}`,
    )
      .bind(...bindings)
      .first<{ total: number }>();

    const total = countResult?.total ?? 0;

    // Data query
    const dataResult = await this.env.DB.prepare(
      `SELECT a.id, a.chain, a.address, a.report_count, a.total_lost_usd,
              a.risk_score, a.has_threat_intel, a.first_reported_at, a.last_reported_at, a.updated_at
       FROM addresses a
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
    )
      .bind(...bindings, limit, offset)
      .all<Address>();

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.results,
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }
}
