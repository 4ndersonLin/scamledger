import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrendPoint } from '@cryptoscam/shared';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../shared/LoadingSpinner';

const TIME_RANGES = [7, 30, 90] as const;
type TimeRange = (typeof TIME_RANGES)[number];

const AXIS_TICK_STYLE = { fill: '#8892a8', fontSize: 12 };
const GRID_STROKE = '#1a2540';
const AREA_COLOR = '#3b82f6';

function formatDateTick(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>): React.ReactElement | null {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400 mb-1">{String(label)}</p>
      <p className="text-sm font-heading font-bold text-white">
        {Number(payload[0].value).toLocaleString()}
      </p>
    </div>
  );
}

export default function TrendChart(): React.ReactElement {
  const { t } = useTranslation();
  const [days, setDays] = useState<TimeRange>(30);
  const { data, loading } = useApi<TrendPoint[]>(`/stats/trends?days=${days}`);

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg overflow-hidden">
      <div className="h-0.5 bg-blue-accent" />
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white">
            {t('dashboard.trends')}
          </h3>
          <div className="flex gap-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                className={`px-3 py-1 text-xs font-heading uppercase tracking-wider rounded transition-colors ${
                  days === range
                    ? 'bg-blue-accent text-white'
                    : 'bg-navy-900 text-slate-400 hover:text-white'
                }`}
              >
                {t(`dashboard.days${range}`)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={AREA_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={AREA_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateTick}
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
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={AREA_COLOR}
                strokeWidth={2}
                fill="url(#trendGradient)"
              />
            </AreaChart>
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
