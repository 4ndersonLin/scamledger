import { useTranslation } from 'react-i18next';
import { getRiskLevel, RISK_LEVELS } from '@cryptoscam/shared';
import type { RiskLevel } from '@cryptoscam/shared';

interface RiskBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

const RISK_BG_CLASSES: Record<RiskLevel, string> = {
  low: 'bg-success/20 text-success',
  medium: 'bg-warning/20 text-warning',
  high: 'bg-danger/20 text-danger',
  critical: 'bg-danger/30 text-danger',
};

const RISK_GLOW_CLASSES: Record<RiskLevel, string> = {
  low: 'shadow-[0_0_8px_rgba(34,197,94,0.2)]',
  medium: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
  high: 'shadow-[0_0_8px_rgba(239,68,68,0.2)]',
  critical: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
};

export default function RiskBadge({
  score,
  size = 'md',
  showLabel = true,
}: RiskBadgeProps): React.ReactElement {
  const { t } = useTranslation();
  const level = getRiskLevel(score);
  const levelInfo = RISK_LEVELS[level];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${SIZE_CLASSES[size]} ${RISK_BG_CLASSES[level]} ${RISK_GLOW_CLASSES[level]} flex items-center justify-center rounded font-heading font-bold`}
        style={{ borderColor: levelInfo.color, borderWidth: '1px' }}
      >
        {score}
      </div>
      {showLabel && (
        <span className="font-heading text-xs font-medium" style={{ color: levelInfo.color }}>
          {t(`risk.${level}`)}
        </span>
      )}
    </div>
  );
}
