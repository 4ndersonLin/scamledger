import { useTranslation } from 'react-i18next';
import type { ChainBreakdown, ScamTypeBreakdown } from '@cryptoscam/shared';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../shared/LoadingSpinner';

interface BreakdownData {
  chains: ChainBreakdown[];
  scam_types: ScamTypeBreakdown[];
}

const CHAIN_COLORS: Record<string, string> = {
  ETH: '#3b82f6',
  BTC: '#f59e0b',
  SOL: '#22c55e',
  TRON: '#ef4444',
  BSC: '#2563eb',
  MATIC: '#8b5cf6',
  OTHER: '#94a3b8',
};

const AXIS_TICK_STYLE = { fill: '#64748b', fontSize: 12 };
const GRID_STROKE = '#e2e8f0';

interface BarEntry {
  name: string;
  value: number;
  chain: string;
}

function CustomTooltip({
  active,
  payload,
}: TooltipProps<ValueType, NameType>): React.ReactElement | null {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const entry = payload[0];
  return (
    <div className="bg-surface-raised border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-text-muted mb-1">{String(entry.name)}</p>
      <p className="text-sm font-heading font-bold text-text-primary">
        {Number(entry.value).toLocaleString()}
      </p>
    </div>
  );
}

export default function ChainBarChart(): React.ReactElement {
  const { t } = useTranslation();
  const { data, loading } = useApi<BreakdownData>('/stats/breakdown');

  const chartData: BarEntry[] =
    data?.chains.map((item) => ({
      name: t(`chain.${item.chain}`),
      value: item.count,
      chain: item.chain,
    })) ?? [];

  return (
    <div className="bg-surface-raised border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="h-0.5 bg-warning" />
      <div className="p-4 md:p-6">
        <h3 className="font-heading text-lg font-bold text-text-primary mb-6">
          {t('dashboard.chainDistribution')}
        </h3>

        {loading ? (
          <LoadingSpinner />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK_STYLE}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <YAxis
                tick={AXIS_TICK_STYLE}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((entry) => (
                  <Cell key={`bar-${entry.chain}`} fill={CHAIN_COLORS[entry.chain] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-text-muted text-sm">
            {t('search.noResults')}
          </div>
        )}
      </div>
    </div>
  );
}
