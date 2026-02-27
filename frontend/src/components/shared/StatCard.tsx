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
    <div className="bg-surface-raised border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="h-0.5" style={{ backgroundColor: accentColor }} />
      <div className="p-4">
        {icon && <div className="mb-2 text-text-muted">{icon}</div>}
        <div className="font-heading text-2xl font-bold text-text-primary">{displayValue}</div>
        <div className="mt-1 text-sm text-text-muted">{label}</div>
      </div>
    </div>
  );
}
