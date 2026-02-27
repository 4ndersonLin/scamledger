import { useTranslation } from 'react-i18next';
import type { StatsOverview } from '@cryptoscam/shared';
import { useApi } from '../../hooks/useApi';
import StatCard from '../shared/StatCard';

function StatCardSkeleton(): React.ReactElement {
  return (
    <div className="bg-surface-raised border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="h-0.5 bg-border" />
      <div className="p-4">
        <div className="h-8 w-24 bg-surface-sunken rounded mb-2" />
        <div className="h-4 w-32 bg-surface-sunken rounded" />
      </div>
    </div>
  );
}

export default function StatCards(): React.ReactElement {
  const { t } = useTranslation();
  const { data, loading } = useApi<StatsOverview>('/stats/overview');

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (!data) {
    return <></>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label={t('home.totalReports')} value={data.total_reports} accentColor="#3b82f6" />
      <StatCard
        label={t('home.highRiskAddresses')}
        value={data.high_risk_addresses}
        accentColor="#ef4444"
      />
      <StatCard
        label={t('home.totalLoss')}
        value={data.total_loss_usd}
        accentColor="#f59e0b"
        prefix="$"
      />
      <StatCard
        label={t('home.monthlyReports')}
        value={data.monthly_reports}
        accentColor="#22c55e"
      />
    </div>
  );
}
