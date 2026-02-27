import type { Env } from '../types/index.js';
import { OfacFetcher } from '../services/fetchers/ofac-fetcher.js';
import { ThreatIntelService } from '../services/threat-intel-service.js';

export class ScheduledHandler {
  private readonly env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async run(): Promise<void> {
    if (this.env.THREAT_INTEL_ENABLED !== 'true') {
      return;
    }

    const service = new ThreatIntelService(this.env);
    const fetcher = new OfacFetcher();

    try {
      const syncState = await service.getSyncState(fetcher.source);
      const result = await fetcher.fetch(syncState, this.env);

      if (result.records.length === 0) {
        await service.updateSyncState(fetcher.source, {
          lastEtag: result.newEtag,
          recordsImported: 0,
          lastError: null,
        });
        return;
      }

      const imported = await service.importRecords(result.records);

      await service.updateSyncState(fetcher.source, {
        lastEtag: result.newEtag,
        recordsImported: imported,
        lastError: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Threat intel sync failed for ${fetcher.source}:`, message);

      await service.updateSyncState(fetcher.source, {
        recordsImported: 0,
        lastError: message,
      });
    }
  }
}
