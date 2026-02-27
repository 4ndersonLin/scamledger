import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Address } from '@cryptoscam/shared';
import RiskBadge from '../shared/RiskBadge';

interface ResultCardProps {
  address: Address;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
}

export default function ResultCard({ address }: ResultCardProps): React.ReactElement {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = (): void => {
    void navigate(`/address/${address.chain}/${address.address}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="bg-surface-raised border border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Risk badge */}
      <div className="shrink-0">
        <RiskBadge score={address.risk_score} showLabel={false} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-text-primary truncate">
            {truncateAddress(address.address)}
          </span>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-heading bg-surface-sunken text-accent border border-border">
            {address.chain}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0 text-right">
        <div className="text-sm text-text-primary font-heading">
          {address.report_count} {t('address.reportCount').toLowerCase()}
        </div>
        <div className="text-xs text-text-muted">{formatUsd(address.total_lost_usd)}</div>
      </div>
    </div>
  );
}
