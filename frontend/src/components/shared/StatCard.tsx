interface StatCardProps {
  label: string;
  value: number;
  accentColor: string;
  prefix?: string;
  icon?: React.ReactNode;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function StatCard({
  label,
  value,
  accentColor,
  prefix,
  icon,
}: StatCardProps): React.ReactElement {
  const displayValue = prefix === '$' ? formatUsd(value) : formatNumber(value);

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg overflow-hidden">
      <div className="h-0.5" style={{ backgroundColor: accentColor }} />
      <div className="p-4">
        {icon && <div className="mb-2 text-slate-400">{icon}</div>}
        <div className="font-heading text-2xl font-bold uppercase tracking-wider text-white">
          {displayValue}
        </div>
        <div className="mt-1 text-sm text-slate-400">{label}</div>
      </div>
    </div>
  );
}
