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

      {/* Report CTA */}
      <section>
        <Link
          to="/report"
          className="block bg-surface-raised border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
        >
          <div className="h-1 bg-danger" />
          <div className="p-6 md:p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <circle cx="12" cy="16" r="0.5" fill="#ef4444" />
              </svg>
              <h2 className="font-heading text-2xl font-bold text-text-primary group-hover:text-danger transition-colors">
                {t('home.reportCtaTitle')}
              </h2>
            </div>
            <p className="text-text-muted max-w-xl mx-auto mb-4">{t('home.reportCtaDesc')}</p>
            <span className="inline-block bg-danger text-white font-heading font-bold px-6 py-3 rounded-lg text-lg group-hover:bg-red-600 transition-colors">
              {t('home.reportCtaButton')}
            </span>
          </div>
        </Link>
      </section>

      {/* How Your Report Helps */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-text-primary text-center mb-6">
          {t('home.howHelpsTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protect Others */}
          <div className="bg-surface-raised border border-border rounded-xl p-6 text-center">
            <div className="flex justify-center mb-3">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
              {t('home.helpProtect')}
            </h3>
            <p className="text-sm text-text-muted">{t('home.helpProtectDesc')}</p>
          </div>

          {/* Build the Database */}
          <div className="bg-surface-raised border border-border rounded-xl p-6 text-center">
            <div className="flex justify-center mb-3">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
              {t('home.helpDatabase')}
            </h3>
            <p className="text-sm text-text-muted">{t('home.helpDatabaseDesc')}</p>
          </div>

          {/* Identify Patterns */}
          <div className="bg-surface-raised border border-border rounded-xl p-6 text-center">
            <div className="flex justify-center mb-3">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
                <path d="M11 8v6" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
              {t('home.helpTrack')}
            </h3>
            <p className="text-sm text-text-muted">{t('home.helpTrackDesc')}</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-text-primary text-center mb-6">
          {t('home.howItWorksTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { num: '1', title: t('home.step1Title'), desc: t('home.step1Desc') },
            { num: '2', title: t('home.step2Title'), desc: t('home.step2Desc') },
            { num: '3', title: t('home.step3Title'), desc: t('home.step3Desc') },
          ].map((step) => (
            <div
              key={step.num}
              className="bg-surface-raised border border-border rounded-xl p-6 text-center"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-full bg-accent text-white font-heading font-bold text-lg flex items-center justify-center">
                  {step.num}
                </div>
              </div>
              <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Community Stats */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-text-primary text-center mb-6">
          {t('home.communityStats')}
        </h2>
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
