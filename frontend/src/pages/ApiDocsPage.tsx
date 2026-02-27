import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

interface MethodBadgeProps {
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH';
}

function MethodBadge({ method }: MethodBadgeProps): React.ReactElement {
  const colorMap: Record<string, string> = {
    GET: 'bg-success/20 text-success border-success/30',
    POST: 'bg-accent/20 text-accent border-accent/30',
    DELETE: 'bg-danger/20 text-danger border-danger/30',
    PATCH: 'bg-warning/20 text-warning border-warning/30',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-mono font-semibold rounded border ${colorMap[method]}`}
    >
      {method}
    </span>
  );
}

function CodeBlock({ children }: { children: string }): React.ReactElement {
  return (
    <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

interface EndpointProps {
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  children?: React.ReactNode;
}

function Endpoint({ method, path, description, children }: EndpointProps): React.ReactElement {
  return (
    <div className="bg-surface-raised border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 flex flex-wrap items-center gap-3 border-b border-border">
        <MethodBadge method={method} />
        <code className="font-mono text-sm text-text-primary">{path}</code>
        <span className="text-sm text-text-muted ml-auto">{description}</span>
      </div>
      {children && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────
// Sidebar sections definition
// ──────────────────────────────────────────────

const SIDEBAR_SECTIONS = [
  'quick-start',
  'endpoints',
  'authentication',
  'rate-limits',
  'error-codes',
  'supported-chains',
  'scam-types',
] as const;

type SidebarSection = (typeof SIDEBAR_SECTIONS)[number];

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────

export default function ApiDocsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SidebarSection>('quick-start');

  usePageMeta({
    title: 'API Documentation',
    description:
      'Developer API documentation for ScamLedger. Search scam addresses, submit reports, and access threat intelligence data.',
  });

  const sidebarLabels: Record<SidebarSection, string> = {
    'quick-start': t('apiDocs.quickStart'),
    endpoints: t('apiDocs.endpoints'),
    authentication: t('apiDocs.authentication'),
    'rate-limits': t('apiDocs.rateLimits'),
    'error-codes': t('apiDocs.errorCodes'),
    'supported-chains': t('apiDocs.supportedChains'),
    'scam-types': t('apiDocs.supportedScamTypes'),
  };

  const handleSidebarClick = useCallback((section: SidebarSection): void => {
    setActiveSection(section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="flex gap-8">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:block w-56 shrink-0">
        <nav className="sticky top-6 space-y-1" aria-label="API documentation sections">
          {SIDEBAR_SECTIONS.map((section) => (
            <button
              key={section}
              onClick={() => handleSidebarClick(section)}
              className={`block w-full text-left px-3 py-2 rounded text-sm font-heading transition-colors ${
                activeSection === section
                  ? 'bg-surface-sunken text-accent border-l-2 border-accent'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-sunken'
              }`}
            >
              {sidebarLabels[section]}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-12 pb-16">
        {/* Page header */}
        <header className="animate-fade-in">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
            {t('apiDocs.title')}
          </h1>
          <p className="mt-3 text-text-muted text-lg max-w-2xl">{t('apiDocs.description')}</p>
        </header>

        {/* ─── Quick Start ─── */}
        <section id="quick-start" className="space-y-6 animate-fade-in stagger-1">
          <h2 className="font-heading text-2xl font-bold text-text-primary border-b border-border pb-3">
            {t('apiDocs.quickStart')}
          </h2>
          <p className="text-text-secondary">{t('apiDocs.quickStartDesc')}</p>

          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-text-primary">
              {t('apiDocs.step1Title')}
            </h3>
            <p className="text-text-muted text-sm">
              {t('apiDocs.step1Desc')}{' '}
              <Link to="/developers/register" className="text-accent hover:underline">
                /developers/register
              </Link>
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-text-primary">
              {t('apiDocs.step2Title')}
            </h3>
            <p className="text-text-muted text-sm">{t('apiDocs.step2Desc')}</p>
            <CodeBlock>{'https://api.scamledger.com/v1'}</CodeBlock>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-text-primary">
              {t('apiDocs.step3Title')}
            </h3>
            <p className="text-text-muted text-sm">{t('apiDocs.step3Desc')}</p>
            <CodeBlock>{'X-API-Key: csr_your_key_here'}</CodeBlock>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-text-primary">
              {t('apiDocs.step4Title')}
            </h3>
            <p className="text-text-muted text-sm">{t('apiDocs.step4Desc')}</p>
            <CodeBlock>{`curl -X GET "https://api.scamledger.com/v1/search?q=0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18" \\
  -H "X-API-Key: csr_your_key_here"`}</CodeBlock>
          </div>
        </section>

        {/* ─── Endpoints ─── */}
        <section id="endpoints" className="space-y-8 animate-fade-in stagger-2">
          <h2 className="font-heading text-2xl font-bold text-text-primary border-b border-border pb-3">
            {t('apiDocs.endpoints')}
          </h2>

          {/* Report Endpoints */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-semibold text-text-primary">
              {t('apiDocs.reportEndpoints')}
            </h3>

            <Endpoint method="POST" path="/v1/reports" description={t('apiDocs.submitReport')}>
              <div className="space-y-3">
                <h4 className="text-sm font-heading text-text-secondary">
                  {t('apiDocs.requestBody')}
                </h4>
                <CodeBlock>{`{
  "chain": "ETH",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "scam_type": "phishing",
  "description": "Phishing site mimicking Uniswap...",
  "loss_amount": 1500,
  "loss_currency": "USDT",
  "evidence_url": "https://example.com/evidence",
  "tx_hash": "0xabc123..."
}`}</CodeBlock>
                <h4 className="text-sm font-heading text-text-secondary">
                  {t('apiDocs.response')}
                </h4>
                <CodeBlock>{`{
  "success": true,
  "data": {
    "id": "rpt_abc123",
    "chain": "ETH",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    "scam_type": "phishing",
    "description": "Phishing site mimicking Uniswap...",
    "loss_amount": 1500,
    "loss_currency": "USDT",
    "evidence_url": "https://example.com/evidence",
    "tx_hash": "0xabc123...",
    "created_at": "2026-02-27T12:00:00Z"
  }
}`}</CodeBlock>
              </div>
            </Endpoint>

            <Endpoint
              method="POST"
              path="/v1/reports/batch"
              description={t('apiDocs.submitReportBatch')}
            >
              <div className="space-y-3">
                <h4 className="text-sm font-heading text-text-secondary">
                  {t('apiDocs.requestBody')}
                </h4>
                <CodeBlock>{`{
  "reports": [
    {
      "chain": "ETH",
      "address": "0x742d35Cc...",
      "scam_type": "phishing",
      "description": "Phishing site..."
    },
    {
      "chain": "BTC",
      "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "scam_type": "ponzi",
      "description": "Ponzi scheme..."
    }
  ]
}`}</CodeBlock>
              </div>
            </Endpoint>
          </div>

          {/* Search Endpoints */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-semibold text-text-primary">
              {t('apiDocs.searchEndpoints')}
            </h3>

            <Endpoint method="GET" path="/v1/search" description={t('apiDocs.searchReports')}>
              <div className="space-y-3">
                <h4 className="text-sm font-heading text-text-secondary">
                  {t('apiDocs.queryParams')}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-2 pr-4 font-heading text-text-muted text-xs">
                          {t('apiDocs.param')}
                        </th>
                        <th className="py-2 pr-4 font-heading text-text-muted text-xs">
                          {t('apiDocs.type')}
                        </th>
                        <th className="py-2 pr-4 font-heading text-text-muted text-xs">
                          {t('apiDocs.required')}
                        </th>
                        <th className="py-2 font-heading text-text-muted text-xs">
                          {t('apiDocs.paramDesc')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-text-secondary">
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-text-primary">q</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2 pr-4">{t('apiDocs.no')}</td>
                        <td className="py-2">Address or keyword</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-text-primary">chain</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2 pr-4">{t('apiDocs.no')}</td>
                        <td className="py-2">ETH, BTC, SOL, TRON, BSC, MATIC, OTHER</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-text-primary">scam_type</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2 pr-4">{t('apiDocs.no')}</td>
                        <td className="py-2">Filter by scam type</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-text-primary">sort</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2 pr-4">{t('apiDocs.no')}</td>
                        <td className="py-2">newest, risk, reports</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-text-primary">page</td>
                        <td className="py-2 pr-4">number</td>
                        <td className="py-2 pr-4">{t('apiDocs.no')}</td>
                        <td className="py-2">{t('apiDocs.default')}: 1</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-text-primary">limit</td>
                        <td className="py-2 pr-4">number</td>
                        <td className="py-2 pr-4">{t('apiDocs.no')}</td>
                        <td className="py-2">{t('apiDocs.default')}: 20 (max 100)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <h4 className="text-sm font-heading text-text-secondary pt-2">
                  {t('apiDocs.response')}
                </h4>
                <CodeBlock>{`{
  "success": true,
  "data": [
    {
      "chain": "ETH",
      "address": "0x742d35Cc...",
      "report_count": 12,
      "risk_score": 85,
      "total_lost_usd": 150000,
      "last_reported_at": "2026-02-27T12:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1,
    "rate_limit": {
      "limit": 120,
      "remaining": 119,
      "reset": 1740700800
    }
  }
}`}</CodeBlock>
              </div>
            </Endpoint>
          </div>

          {/* Address Endpoints */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-semibold text-text-primary">
              {t('apiDocs.addressEndpoints')}
            </h3>

            <Endpoint
              method="GET"
              path="/v1/address/:chain/:address"
              description={t('apiDocs.getAddress')}
            >
              <div className="space-y-3">
                <h4 className="text-sm font-heading text-text-secondary">
                  {t('apiDocs.pathParams')}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-2 pr-4 font-heading text-text-muted text-xs">
                          {t('apiDocs.param')}
                        </th>
                        <th className="py-2 pr-4 font-heading text-text-muted text-xs">
                          {t('apiDocs.type')}
                        </th>
                        <th className="py-2 font-heading text-text-muted text-xs">
                          {t('apiDocs.paramDesc')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-text-secondary">
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-text-primary">chain</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2">ETH, BTC, SOL, TRON, BSC, MATIC, OTHER</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-text-primary">address</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2">Wallet address</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <h4 className="text-sm font-heading text-text-secondary pt-2">
                  {t('apiDocs.response')}
                </h4>
                <CodeBlock>{`{
  "success": true,
  "data": {
    "chain": "ETH",
    "address": "0x742d35Cc...",
    "report_count": 12,
    "risk_score": 85,
    "total_lost_usd": 150000,
    "first_reported_at": "2025-06-15T08:30:00Z",
    "last_reported_at": "2026-02-27T12:00:00Z",
    "reports": [
      {
        "id": "rpt_abc123",
        "scam_type": "phishing",
        "description": "Phishing site...",
        "loss_amount": 1500,
        "created_at": "2026-02-27T12:00:00Z"
      }
    ]
  }
}`}</CodeBlock>
              </div>
            </Endpoint>

            <Endpoint
              method="POST"
              path="/v1/address/batch"
              description={t('apiDocs.batchAddress')}
            >
              <div className="space-y-3">
                <h4 className="text-sm font-heading text-text-secondary">
                  {t('apiDocs.requestBody')}
                </h4>
                <CodeBlock>{`{
  "addresses": [
    { "chain": "ETH", "address": "0x742d35Cc..." },
    { "chain": "BTC", "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" }
  ]
}`}</CodeBlock>
              </div>
            </Endpoint>
          </div>

          {/* Stats Endpoints */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-semibold text-text-primary">
              {t('apiDocs.statsEndpoints')}
            </h3>

            <Endpoint
              method="GET"
              path="/v1/stats/overview"
              description={t('apiDocs.statsOverview')}
            >
              <div className="space-y-3">
                <h4 className="text-sm font-heading text-text-secondary">
                  {t('apiDocs.response')}
                </h4>
                <CodeBlock>{`{
  "success": true,
  "data": {
    "total_reports": 15230,
    "high_risk_addresses": 892,
    "total_loss_usd": 45600000,
    "monthly_reports": 1240
  }
}`}</CodeBlock>
              </div>
            </Endpoint>

            <Endpoint
              method="GET"
              path="/v1/stats/trends?days=30"
              description={t('apiDocs.statsTrends')}
            >
              <div className="space-y-3">
                <h4 className="text-sm font-heading text-text-secondary">
                  {t('apiDocs.response')}
                </h4>
                <CodeBlock>{`{
  "success": true,
  "data": [
    { "date": "2026-02-27", "count": 42 },
    { "date": "2026-02-26", "count": 38 }
  ]
}`}</CodeBlock>
              </div>
            </Endpoint>

            <Endpoint
              method="GET"
              path="/v1/stats/breakdown"
              description={t('apiDocs.statsBreakdown')}
            >
              <div className="space-y-3">
                <h4 className="text-sm font-heading text-text-secondary">
                  {t('apiDocs.response')}
                </h4>
                <CodeBlock>{`{
  "success": true,
  "data": {
    "by_chain": [
      { "chain": "ETH", "count": 5200 },
      { "chain": "BSC", "count": 3100 }
    ],
    "by_scam_type": [
      { "scam_type": "phishing", "count": 4800 },
      { "scam_type": "rug_pull", "count": 3200 }
    ]
  }
}`}</CodeBlock>
              </div>
            </Endpoint>
          </div>
        </section>

        {/* ─── Authentication ─── */}
        <section id="authentication" className="space-y-6 animate-fade-in stagger-3">
          <h2 className="font-heading text-2xl font-bold text-text-primary border-b border-border pb-3">
            {t('apiDocs.authentication')}
          </h2>
          <p className="text-text-secondary">{t('apiDocs.authDesc')}</p>

          <div className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-text-primary">
              {t('apiDocs.authKeyFormat')}
            </h3>
            <p className="text-text-muted text-sm">{t('apiDocs.authKeyFormatDesc')}</p>
            <CodeBlock>{'csr_a1b2c3d4e5f6...  (68 characters total)'}</CodeBlock>
          </div>

          <div className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-text-primary">
              {t('apiDocs.authHowToGet')}
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-text-muted">
              <li>{t('apiDocs.authStep1')}</li>
              <li>{t('apiDocs.authStep2')}</li>
              <li>{t('apiDocs.authStep3')}</li>
              <li>{t('apiDocs.authStep4')}</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="text-text-muted text-sm">{t('apiDocs.authHeaderDesc')}</p>
            <CodeBlock>{`curl -X GET "https://api.scamledger.com/v1/stats/overview" \\
  -H "X-API-Key: csr_your_key_here"`}</CodeBlock>
          </div>
        </section>

        {/* ─── Rate Limits ─── */}
        <section id="rate-limits" className="space-y-6 animate-fade-in stagger-4">
          <h2 className="font-heading text-2xl font-bold text-text-primary border-b border-border pb-3">
            {t('apiDocs.rateLimits')}
          </h2>
          <p className="text-text-secondary">{t('apiDocs.rateLimitsDesc')}</p>

          <div className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-text-primary">
              {t('apiDocs.rateLimitHeaders')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-heading text-text-muted text-xs">
                      {t('apiDocs.header')}
                    </th>
                    <th className="py-2 font-heading text-text-muted text-xs">
                      {t('apiDocs.paramDesc')}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-text-primary">X-RateLimit-Limit</td>
                    <td className="py-2">{t('apiDocs.rateLimitHeaderLimit')}</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-text-primary">X-RateLimit-Remaining</td>
                    <td className="py-2">{t('apiDocs.rateLimitHeaderRemaining')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-text-primary">X-RateLimit-Reset</td>
                    <td className="py-2">{t('apiDocs.rateLimitHeaderReset')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-sm text-warning">
            <p>{t('apiDocs.rateLimitExceeded')}</p>
          </div>

          <CodeBlock>{`HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1740700860

{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again later."
  }
}`}</CodeBlock>
        </section>

        {/* ─── Error Codes ─── */}
        <section id="error-codes" className="space-y-6">
          <h2 className="font-heading text-2xl font-bold text-text-primary border-b border-border pb-3">
            {t('apiDocs.errorCodes')}
          </h2>
          <p className="text-text-secondary">{t('apiDocs.errorCodesDesc')}</p>

          <CodeBlock>{`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "field": "address", "issue": "Invalid ETH address format" }
  }
}`}</CodeBlock>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-heading text-text-muted text-xs">
                    {t('apiDocs.errorCode')}
                  </th>
                  <th className="py-2 font-heading text-text-muted text-xs">
                    {t('apiDocs.errorMessage')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-danger">VALIDATION_ERROR</td>
                  <td className="py-2">{t('apiDocs.errorValidation')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-danger">DUPLICATE_REPORT</td>
                  <td className="py-2">{t('apiDocs.errorDuplicate')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-danger">UNAUTHORIZED</td>
                  <td className="py-2">{t('apiDocs.errorUnauthorized')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-warning">RATE_LIMITED</td>
                  <td className="py-2">{t('apiDocs.errorRateLimited')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-muted">NOT_FOUND</td>
                  <td className="py-2">{t('apiDocs.errorNotFound')}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-warning">MAX_KEYS_EXCEEDED</td>
                  <td className="py-2">{t('apiDocs.errorMaxKeys')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Supported Chains ─── */}
        <section id="supported-chains" className="space-y-6">
          <h2 className="font-heading text-2xl font-bold text-text-primary border-b border-border pb-3">
            {t('apiDocs.supportedChains')}
          </h2>
          <p className="text-text-secondary">{t('apiDocs.supportedChainsDesc')}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-heading text-text-muted text-xs">
                    {t('apiDocs.chainId')}
                  </th>
                  <th className="py-2 pr-4 font-heading text-text-muted text-xs">
                    {t('apiDocs.chainName')}
                  </th>
                  <th className="py-2 font-heading text-text-muted text-xs">
                    {t('apiDocs.addressFormat')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">ETH</td>
                  <td className="py-2 pr-4">{t('chain.ETH')}</td>
                  <td className="py-2 font-mono text-xs">0x + 40 hex chars</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">BTC</td>
                  <td className="py-2 pr-4">{t('chain.BTC')}</td>
                  <td className="py-2 font-mono text-xs">1/3/bc1 prefix</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">SOL</td>
                  <td className="py-2 pr-4">{t('chain.SOL')}</td>
                  <td className="py-2 font-mono text-xs">Base58, 32-44 chars</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">TRON</td>
                  <td className="py-2 pr-4">{t('chain.TRON')}</td>
                  <td className="py-2 font-mono text-xs">T prefix + 33 chars</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">BSC</td>
                  <td className="py-2 pr-4">{t('chain.BSC')}</td>
                  <td className="py-2 font-mono text-xs">0x + 40 hex chars</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">MATIC</td>
                  <td className="py-2 pr-4">{t('chain.MATIC')}</td>
                  <td className="py-2 font-mono text-xs">0x + 40 hex chars</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-text-primary">OTHER</td>
                  <td className="py-2 pr-4">{t('chain.OTHER')}</td>
                  <td className="py-2 font-mono text-xs">--</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Scam Types ─── */}
        <section id="scam-types" className="space-y-6">
          <h2 className="font-heading text-2xl font-bold text-text-primary border-b border-border pb-3">
            {t('apiDocs.supportedScamTypes')}
          </h2>
          <p className="text-text-secondary">{t('apiDocs.supportedScamTypesDesc')}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-heading text-text-muted text-xs">
                    {t('apiDocs.scamTypeId')}
                  </th>
                  <th className="py-2 font-heading text-text-muted text-xs">
                    {t('apiDocs.scamTypeName')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">phishing</td>
                  <td className="py-2">{t('scamType.phishing')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">rug_pull</td>
                  <td className="py-2">{t('scamType.rug_pull')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">fake_exchange</td>
                  <td className="py-2">{t('scamType.fake_exchange')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">hack</td>
                  <td className="py-2">{t('scamType.hack')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">ponzi</td>
                  <td className="py-2">{t('scamType.ponzi')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">impersonation</td>
                  <td className="py-2">{t('scamType.impersonation')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">fake_airdrop</td>
                  <td className="py-2">{t('scamType.fake_airdrop')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">romance</td>
                  <td className="py-2">{t('scamType.romance')}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-text-primary">other</td>
                  <td className="py-2">{t('scamType.other')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
