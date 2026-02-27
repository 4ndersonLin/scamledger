import { useTranslation } from 'react-i18next';
import type { ScamTypeBreakdown, ChainBreakdown } from '@cryptoscam/shared';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../shared/LoadingSpinner';

interface BreakdownData {
  chains: ChainBreakdown[];
  scam_types: ScamTypeBreakdown[];
}

const PIE_COLORS = [
  '#3b82f6',
  '#e63946',
  '#f59e0b',
  '#10b981',
  '#c9a84c',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

interface PieEntry {
  name: string;
  value: number;
  percent: number;
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

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

const RADIAN = Math.PI / 180;

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: LabelProps): React.ReactElement | null {
  if (percent < 0.05) {
    return null;
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#f0f2f7"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

interface LegendEntry {
  value: string;
  color: string;
  payload?: {
    value?: number;
  };
}

function CustomLegend({ payload }: { payload?: LegendEntry[] }): React.ReactElement | null {
  if (!payload) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5 text-xs text-slate-300">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.value}</span>
          <span className="text-slate-400">({entry.payload?.value ?? 0})</span>
        </li>
      ))}
    </ul>
  );
}

export default function TypePieChart(): React.ReactElement {
  const { t } = useTranslation();
  const { data, loading } = useApi<BreakdownData>('/stats/breakdown');

  const chartData: PieEntry[] =
    data?.scam_types.map((item) => {
      const total = data.scam_types.reduce((sum, s) => sum + s.count, 0);
      return {
        name: t(`scamType.${item.scam_type}`),
        value: item.count,
        percent: total > 0 ? item.count / total : 0,
      };
    }) ?? [];

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg overflow-hidden">
      <div className="h-0.5 bg-threat-red" />
      <div className="p-4 md:p-6">
        <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white mb-6">
          {t('dashboard.typeDistribution')}
        </h3>

        {loading ? (
          <LoadingSpinner />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={renderCustomLabel}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
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
