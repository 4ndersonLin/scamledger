import { useTranslation } from 'react-i18next';
import StatCards from '../components/dashboard/StatCards';
import TrendChart from '../components/dashboard/TrendChart';
import TypePieChart from '../components/dashboard/TypePieChart';
import ChainBarChart from '../components/dashboard/ChainBarChart';

export default function DashboardPage(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
        {t('dashboard.title')}
      </h1>

      {/* Stat Cards */}
      <section>
        <StatCards />
      </section>

      {/* Trend Chart — Full Width */}
      <section>
        <TrendChart />
      </section>

      {/* Bottom Row: Pie + Bar */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TypePieChart />
        <ChainBarChart />
      </section>
    </div>
  );
}
