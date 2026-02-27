-- Users (developer accounts)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- WebAuthn credentials
CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_credential_id ON credentials(credential_id);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  daily_limit INTEGER NOT NULL DEFAULT 1000,
  daily_usage INTEGER NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,
  usage_reset_date TEXT NOT NULL DEFAULT (date('now')),
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Addresses (aggregated stats)
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 0,
  total_lost_usd REAL NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 0,
  first_reported_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_reported_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(chain, address)
);
CREATE INDEX IF NOT EXISTS idx_addresses_chain_address ON addresses(chain, address);
CREATE INDEX IF NOT EXISTS idx_addresses_risk ON addresses(risk_score DESC);

-- Reports (individual incidents)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  address_id TEXT NOT NULL REFERENCES addresses(id),
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  scam_type TEXT NOT NULL,
  description TEXT NOT NULL,
  loss_amount REAL,
  loss_currency TEXT,
  evidence_url TEXT,
  tx_hash TEXT,
  reporter_ip TEXT NOT NULL,
  reporter_ip_hash TEXT NOT NULL,
  reporter_ua TEXT,
  source TEXT NOT NULL DEFAULT 'web',
  api_key_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_address ON reports(address_id);
CREATE INDEX IF NOT EXISTS idx_reports_chain_address ON reports(chain, address);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_scam_type ON reports(scam_type);

-- Daily statistics
CREATE TABLE IF NOT EXISTS daily_stats (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  total_reports INTEGER NOT NULL DEFAULT 0,
  new_addresses INTEGER NOT NULL DEFAULT 0,
  total_loss_usd REAL NOT NULL DEFAULT 0,
  chain_breakdown TEXT NOT NULL DEFAULT '{}',
  scam_type_breakdown TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);
