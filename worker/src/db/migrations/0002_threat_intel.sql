-- Threat intelligence from external sources (OFAC SDN, etc.)
CREATE TABLE IF NOT EXISTS threat_intel (
  id TEXT PRIMARY KEY,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  address_id TEXT REFERENCES addresses(id),
  source TEXT NOT NULL,
  external_id TEXT,
  scam_type TEXT,
  category TEXT,
  description TEXT,
  confidence TEXT,
  raw_data TEXT,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source, chain, address, external_id)
);

CREATE INDEX IF NOT EXISTS idx_threat_intel_chain_address ON threat_intel(chain, address);
CREATE INDEX IF NOT EXISTS idx_threat_intel_source ON threat_intel(source);
CREATE INDEX IF NOT EXISTS idx_threat_intel_address_id ON threat_intel(address_id);
CREATE INDEX IF NOT EXISTS idx_threat_intel_fetched_at ON threat_intel(fetched_at DESC);

-- Sync state tracking for each external source
CREATE TABLE IF NOT EXISTS threat_intel_sync_state (
  source TEXT PRIMARY KEY,
  last_sync_at TEXT,
  last_cursor TEXT,
  last_etag TEXT,
  records_imported INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Flag on addresses for quick filtering
ALTER TABLE addresses ADD COLUMN has_threat_intel INTEGER NOT NULL DEFAULT 0;
