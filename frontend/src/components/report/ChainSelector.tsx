import { useTranslation } from 'react-i18next';
import { CHAINS } from '@cryptoscam/shared';
import type { Chain } from '@cryptoscam/shared';

interface ChainSelectorProps {
  value: Chain | '';
  onChange: (chain: Chain) => void;
}

export default function ChainSelector({ value, onChange }: ChainSelectorProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div>
      <label className="block text-sm font-heading text-text-secondary mb-1">
        {t('report.chain')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Chain)}
        className="w-full bg-surface-sunken border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
      >
        <option value="" disabled>
          -- {t('report.chain')} --
        </option>
        {CHAINS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.symbol || c.id})
          </option>
        ))}
      </select>
    </div>
  );
}
