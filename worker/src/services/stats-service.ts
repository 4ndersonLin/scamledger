import type { Env } from '../types/index.js';
import type {
  StatsOverview,
  TrendPoint,
  ChainBreakdown,
  ScamTypeBreakdown,
  Chain,
  ScamType,
} from '@cryptoscam/shared';
import { CacheService } from './cache-service.js';

const OVERVIEW_CACHE_TTL = 300; // 5 minutes
const TRENDS_CACHE_TTL = 900; // 15 minutes
const BREAKDOWN_CACHE_TTL = 900; // 15 minutes

export class StatsService {
  private readonly cache: CacheService;

  constructor(private readonly env: Env) {
    this.cache = new CacheService(env);
  }

  async getOverview(): Promise<StatsOverview> {
    // Check cache first
    const cached = await this.cache.get<StatsOverview>('stats:overview');
    if (cached) {
      return cached;
    }

    const [totalReports, highRiskAddresses, totalLoss, monthlyReports] = await Promise.all([
      this.env.DB.prepare('SELECT COUNT(*) as count FROM reports').first<{ count: number }>(),
      this.env.DB.prepare('SELECT COUNT(*) as count FROM addresses WHERE risk_score >= 76').first<{
        count: number;
      }>(),
      this.env.DB.prepare('SELECT COALESCE(SUM(total_lost_usd), 0) as total FROM addresses').first<{
        total: number;
      }>(),
      this.env.DB.prepare(
        "SELECT COUNT(*) as count FROM reports WHERE created_at >= datetime('now', '-30 days')",
      ).first<{ count: number }>(),
    ]);

    const overview: StatsOverview = {
      total_reports: totalReports?.count ?? 0,
      high_risk_addresses: highRiskAddresses?.count ?? 0,
      total_loss_usd: totalLoss?.total ?? 0,
      monthly_reports: monthlyReports?.count ?? 0,
    };

    await this.cache.set('stats:overview', overview, OVERVIEW_CACHE_TTL);
    return overview;
  }

  async getTrends(days: number = 30): Promise<TrendPoint[]> {
    const cacheKey = `stats:trends:${days}`;
    const cached = await this.cache.get<TrendPoint[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.env.DB.prepare(
      `SELECT date(created_at) as date, COUNT(*) as count
       FROM reports
       WHERE created_at >= date('now', '-' || ? || ' days')
       GROUP BY date(created_at)
       ORDER BY date ASC`,
    )
      .bind(days)
      .all<{ date: string; count: number }>();

    // Build a map of date -> count from DB results
    const countMap = new Map<string, number>();
    for (const row of result.results) {
      countMap.set(row.date, row.count);
    }

    // Fill in missing dates with count: 0
    const trends: TrendPoint[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trends.push({
        date: dateStr,
        count: countMap.get(dateStr) ?? 0,
      });
    }

    await this.cache.set(cacheKey, trends, TRENDS_CACHE_TTL);
    return trends;
  }

  async getBreakdown(): Promise<{
    chains: ChainBreakdown[];
    scam_types: ScamTypeBreakdown[];
  }> {
    const cached = await this.cache.get<{
      chains: ChainBreakdown[];
      scam_types: ScamTypeBreakdown[];
    }>('stats:breakdown');
    if (cached) {
      return cached;
    }

    const [chainsResult, scamTypesResult] = await Promise.all([
      this.env.DB.prepare(
        'SELECT chain, COUNT(*) as count FROM reports GROUP BY chain ORDER BY count DESC',
      ).all<{ chain: Chain; count: number }>(),
      this.env.DB.prepare(
        'SELECT scam_type, COUNT(*) as count FROM reports GROUP BY scam_type ORDER BY count DESC',
      ).all<{ scam_type: ScamType; count: number }>(),
    ]);

    const breakdown = {
      chains: chainsResult.results.map((row) => ({
        chain: row.chain,
        count: row.count,
      })),
      scam_types: scamTypesResult.results.map((row) => ({
        scam_type: row.scam_type,
        count: row.count,
      })),
    };

    await this.cache.set('stats:breakdown', breakdown, BREAKDOWN_CACHE_TTL);
    return breakdown;
  }
}
