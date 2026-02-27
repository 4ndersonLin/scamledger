import { useTranslation } from 'react-i18next';
import type { StatsOverview } from '@cryptoscam/shared';
import { useApi } from '../../hooks/useApi';
import StatCard from '../shared/StatCard';

function StatCardSkeleton(): React.ReactElement {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg overflow-hidden animate-pulse">
      <div className="h-0.5 bg-navy-600" />
      <div className="p-4">
        <div className="h-8 w-24 bg-navy-700 rounded mb-2" />
        <div className="h-4 w-32 bg-navy-700 rounded" />
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
        accentColor="#e63946"
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
        accentColor="#10b981"
      />
    </div>
  );
}
