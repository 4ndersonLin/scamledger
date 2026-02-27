import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { StatsOverview, Address } from '@cryptoscam/shared';
import { useApi } from '../hooks/useApi';
import { usePageMeta } from '../hooks/usePageMeta';
import SearchBar from '../components/search/SearchBar';
import StatCard from '../components/shared/StatCard';
import ResultCard from '../components/search/ResultCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { WebsiteJsonLd, OrganizationJsonLd } from '../components/shared/JsonLd';

interface SearchResult {
  addresses: Address[];
}

export default function HomePage(): React.ReactElement {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Crypto Threat Intelligence Center',
    description:
      'Free, anonymous cryptocurrency scam & hack incident reporting platform. Search known scam addresses or report new threats.',
  });
  const stats = useApi<StatsOverview>('/stats/overview');
  const latest = useApi<SearchResult>('/search?sort=newest&limit=5');
  const highRisk = useApi<SearchResult>('/search?sort=risk&limit=5');

  return (
    <div className="space-y-12">
      <WebsiteJsonLd />
      <OrganizationJsonLd />
      {/* Hero Section */}
      <section className="text-center py-8 md:py-12">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary">
          {t('home.title')}
        </h1>
        <p className="mt-3 text-text-muted text-lg max-w-2xl mx-auto">{t('home.subtitle')}</p>
        <div className="mt-8 max-w-2xl mx-auto">
          <SearchBar />
        </div>
      </section>

      {/* Stats Cards Row */}
      <section>
        {stats.loading ? (
          <LoadingSpinner />
        ) : stats.data ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label={t('home.totalReports')}
              value={stats.data.total_reports}
              accentColor="#3b82f6"
            />
            <StatCard
              label={t('home.highRiskAddresses')}
              value={stats.data.high_risk_addresses}
              accentColor="#ef4444"
            />
            <StatCard
              label={t('home.totalLoss')}
              value={stats.data.total_loss_usd}
              accentColor="#f59e0b"
              prefix="$"
            />
            <StatCard
              label={t('home.monthlyReports')}
              value={stats.data.monthly_reports}
              accentColor="#22c55e"
            />
          </div>
        ) : null}
      </section>

      {/* Dual CTA Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/report"
          className="block bg-surface-raised border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
        >
          <div className="h-0.5 bg-danger" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h2 className="font-heading text-xl font-bold text-text-primary group-hover:text-danger transition-colors">
                {t('home.reportCta')}
              </h2>
            </div>
            <p className="text-sm text-text-muted">{t('report.step1')}</p>
          </div>
        </Link>

        <Link
          to="/developers"
          className="block bg-surface-raised border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
        >
          <div className="h-0.5 bg-accent-developer" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <h2 className="font-heading text-xl font-bold text-text-primary group-hover:text-accent-developer transition-colors">
                {t('home.apiCta')}
              </h2>
            </div>
            <p className="text-sm text-text-muted">{t('nav.apiDocs')}</p>
          </div>
        </Link>
      </section>

      {/* Latest Reports Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            {t('home.latestReports')}
          </h2>
          <Link
            to="/search"
            className="text-sm font-heading text-accent hover:text-text-primary transition-colors"
          >
            {t('common.viewAll')}
          </Link>
        </div>
        {latest.loading ? (
          <LoadingSpinner />
        ) : latest.data?.addresses && latest.data.addresses.length > 0 ? (
          <div className="space-y-3">
            {latest.data.addresses.map((addr) => (
              <ResultCard key={`${addr.chain}-${addr.address}`} address={addr} />
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">{t('search.noResults')}</p>
        )}
      </section>

      {/* High Risk Addresses Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            {t('home.highestRisk')}
          </h2>
          <Link
            to="/search?sort=risk"
            className="text-sm font-heading text-accent hover:text-text-primary transition-colors"
          >
            {t('common.viewAll')}
          </Link>
        </div>
        {highRisk.loading ? (
          <LoadingSpinner />
        ) : highRisk.data?.addresses && highRisk.data.addresses.length > 0 ? (
          <div className="space-y-3">
            {highRisk.data.addresses.map((addr) => (
              <ResultCard key={`${addr.chain}-${addr.address}`} address={addr} />
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">{t('search.noResults')}</p>
        )}
      </section>
    </div>
  );
}
