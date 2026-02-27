import type { Chain } from '@cryptoscam/shared';
import type { Env } from '../../types/index.js';
import type { FetchResult, NormalizedThreatIntel, SyncState, ThreatIntelFetcher } from './types.js';

const BASE_URL =
  'https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists';

interface OfacEntry {
  address: string;
  id_prefix: string;
  programs: string[];
}

/** Maps OFAC currency file names to our Chain type */
const CURRENCY_MAP: Record<string, Chain> = {
  XBT: 'BTC',
  ETH: 'ETH',
  USDT: 'ETH',
  USDC: 'ETH',
  SOL: 'SOL',
  TRX: 'TRON',
  BSC: 'BSC',
  MATIC: 'MATIC',
};

const CURRENCY_FILES = Object.keys(CURRENCY_MAP);

export class OfacFetcher implements ThreatIntelFetcher {
  readonly source = 'ofac_sdn' as const;

  async fetch(syncState: SyncState | null, _env: Env): Promise<FetchResult> {
    const records: NormalizedThreatIntel[] = [];
    let latestEtag: string | undefined;

    for (const currency of CURRENCY_FILES) {
      const url = `${BASE_URL}/${currency}.json`;
      const headers: Record<string, string> = {};

      if (syncState?.last_etag) {
        headers['If-None-Match'] = syncState.last_etag;
      }

      const response = await fetch(url, { headers });

      if (response.status === 304) {
        continue;
      }

      if (!response.ok) {
        if (response.status === 404) {
          continue;
        }
        console.warn(`OFAC fetch failed for ${currency}: ${response.status}`);
        continue;
      }

      const etag = response.headers.get('ETag');
      if (etag) {
        latestEtag = etag;
      }

      const entries = (await response.json()) as OfacEntry[];
      const chain = CURRENCY_MAP[currency];

      for (const entry of entries) {
        records.push({
          chain,
          address: entry.address,
          source: 'ofac_sdn',
          external_id: entry.id_prefix || null,
          scam_type: null,
          category: 'OFAC_SDN',
          description:
            entry.programs.length > 0 ? `OFAC Programs: ${entry.programs.join(', ')}` : null,
          confidence: 'confirmed',
          raw_data: JSON.stringify(entry),
        });
      }
    }

    return {
      records,
      newEtag: latestEtag,
      hasMore: false,
    };
  }
}
