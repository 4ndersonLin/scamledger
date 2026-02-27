import type { Chain, ScamType, ThreatIntelConfidence, ThreatIntelSource } from '@cryptoscam/shared';
import type { Env } from '../../types/index.js';

export interface SyncState {
  source: string;
  last_sync_at: string | null;
  last_cursor: string | null;
  last_etag: string | null;
  records_imported: number;
  last_error: string | null;
  updated_at: string;
}

export interface NormalizedThreatIntel {
  chain: Chain;
  address: string;
  source: ThreatIntelSource;
  external_id: string | null;
  scam_type: ScamType | null;
  category: string | null;
  description: string | null;
  confidence: ThreatIntelConfidence | null;
  raw_data: string | null;
}

export interface FetchResult {
  records: NormalizedThreatIntel[];
  newEtag?: string;
  hasMore: boolean;
}

export interface ThreatIntelFetcher {
  readonly source: ThreatIntelSource;
  fetch(syncState: SyncState | null, env: Env): Promise<FetchResult>;
}
