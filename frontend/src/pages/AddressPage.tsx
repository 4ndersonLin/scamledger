import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AddressDetail } from '@cryptoscam/shared';
import { useApi } from '../hooks/useApi';
import { usePageMeta } from '../hooks/usePageMeta';
import RiskBadge from '../components/shared/RiskBadge';
import LoadingSpinner from '../components/shared/LoadingSpinner';

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AddressPage(): React.ReactElement {
  const { chain, address } = useParams<{ chain: string; address: string }>();
  const { t } = useTranslation();
  usePageMeta({
    title: `${chain} Address ${address?.slice(0, 10)}... — Risk Analysis`,
    description: `View risk score, report history, and threat intelligence for ${chain} address ${address ?? ''}`,
  });
  const [copied, setCopied] = useState(false);

  const apiPath = chain && address ? `/address/${chain}/${address}` : null;
  const { data, loading, error } = useApi<AddressDetail>(apiPath);

  const handleCopy = (): void => {
    if (!address) return;
    void navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 text-slate-400">404</div>
        <p className="text-slate-400">{t('search.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Address header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-heading uppercase tracking-wider bg-navy-700 text-blue-accent">
            {data.chain}
          </span>
          <h1 className="font-mono text-lg md:text-xl text-white break-all">{data.address}</h1>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-1 text-xs font-heading uppercase tracking-wider border border-navy-600 rounded text-slate-400 hover:text-white hover:border-navy-500 transition-colors"
          >
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
      </div>

      {/* Risk score + Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Large risk badge */}
        <div className="bg-navy-800 border border-navy-700 rounded-lg p-6 flex items-center gap-6">
          <RiskBadge score={data.risk_score} size="lg" />
          <div>
            <div className="font-heading text-sm uppercase tracking-wider text-slate-400">
              {t('address.riskScore')}
            </div>
            <div className="font-heading text-3xl font-bold text-white">{data.risk_score}/100</div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-navy-800 border border-navy-700 rounded-lg p-6 grid grid-cols-2 gap-4">
          <div>
            <div className="font-heading text-xs uppercase tracking-wider text-slate-400 mb-1">
              {t('address.reportCount')}
            </div>
            <div className="font-heading text-2xl font-bold text-white">
              {new Intl.NumberFormat('en-US').format(data.report_count)}
            </div>
          </div>
          <div>
            <div className="font-heading text-xs uppercase tracking-wider text-slate-400 mb-1">
              {t('address.totalLoss')}
            </div>
            <div className="font-heading text-2xl font-bold text-white">
              {formatUsd(data.total_lost_usd)}
            </div>
          </div>
          <div>
            <div className="font-heading text-xs uppercase tracking-wider text-slate-400 mb-1">
              {t('address.firstReported')}
            </div>
            <div className="font-mono text-sm text-slate-200">
              {formatDate(data.first_reported_at)}
            </div>
          </div>
          <div>
            <div className="font-heading text-xs uppercase tracking-wider text-slate-400 mb-1">
              {t('address.lastReported')}
            </div>
            <div className="font-mono text-sm text-slate-200">
              {formatDate(data.last_reported_at)}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div>
        <Link
          to={`/report?chain=${data.chain}&address=${encodeURIComponent(data.address)}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-threat-red/20 hover:bg-threat-red/30 border border-threat-red/40 rounded text-sm font-heading uppercase tracking-wider text-threat-red transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {t('address.reportThis')}
        </Link>
      </div>

      {/* Report history */}
      <section>
        <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-white mb-4">
          {t('address.reportHistory')}
        </h2>

        {data.reports.length > 0 ? (
          <div className="space-y-4">
            {data.reports.map((report) => (
              <div key={report.id} className="bg-navy-800 border border-navy-700 rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-heading uppercase tracking-wider bg-navy-700 text-slate-300">
                      {t(`scamType.${report.scam_type}`)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatDate(report.created_at)}
                    </span>
                  </div>
                  {report.loss_amount !== null && report.loss_amount > 0 && (
                    <span className="text-sm font-heading text-threat-amber">
                      -{report.loss_amount} {report.loss_currency ?? 'USD'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{report.description}</p>
                {report.tx_hash && (
                  <div className="mt-2">
                    <span className="text-xs text-slate-400 font-heading uppercase tracking-wider">
                      TX:
                    </span>{' '}
                    <span className="text-xs font-mono text-slate-300 break-all">
                      {report.tx_hash}
                    </span>
                  </div>
                )}
                {report.evidence_url && (
                  <div className="mt-1">
                    <span className="text-xs text-slate-400 font-heading uppercase tracking-wider">
                      Evidence:
                    </span>{' '}
                    <a
                      href={report.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-accent hover:underline break-all"
                    >
                      {report.evidence_url}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">{t('search.noResults')}</p>
        )}
      </section>
    </div>
  );
}
