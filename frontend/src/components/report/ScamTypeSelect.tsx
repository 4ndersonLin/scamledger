import { useTranslation } from 'react-i18next';
import { SCAM_TYPES } from '@cryptoscam/shared';
import type { ScamType } from '@cryptoscam/shared';

interface ScamTypeSelectProps {
  value: ScamType | '';
  onChange: (scamType: ScamType) => void;
}

export default function ScamTypeSelect({
  value,
  onChange,
}: ScamTypeSelectProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div>
      <label className="block text-sm font-heading text-text-secondary mb-1">
        {t('report.scamType')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ScamType)}
        className="w-full bg-surface-sunken border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
      >
        <option value="" disabled>
          -- {t('report.scamType')} --
        </option>
        {SCAM_TYPES.map((s) => (
          <option key={s.id} value={s.id}>
            {t(s.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
