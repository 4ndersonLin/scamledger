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
  SOL: '#10b981',
  TRON: '#e63946',
  BSC: '#c9a84c',
  MATIC: '#8b5cf6',
  OTHER: '#8892a8',
};

const AXIS_TICK_STYLE = { fill: '#8892a8', fontSize: 12 };
const GRID_STROKE = '#1a2540';

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
    <div className="bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400 mb-1">{String(entry.name)}</p>
      <p className="text-sm font-heading font-bold text-white">
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
    <div className="bg-navy-800 border border-navy-700 rounded-lg overflow-hidden">
      <div className="h-0.5 bg-threat-amber" />
      <div className="p-4 md:p-6">
        <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white mb-6">
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
                  <Cell key={`bar-${entry.chain}`} fill={CHAIN_COLORS[entry.chain] ?? '#8892a8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
            {t('search.noResults')}
          </div>
        )}
      </div>
    </div>
  );
}
