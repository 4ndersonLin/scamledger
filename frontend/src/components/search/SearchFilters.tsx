import { useTranslation } from 'react-i18next';
import { CHAINS, SCAM_TYPES } from '@cryptoscam/shared';
import type { Chain, ScamType } from '@cryptoscam/shared';

interface SearchFiltersProps {
  chain: Chain | undefined;
  scamType: ScamType | undefined;
  sort: 'newest' | 'risk' | 'reports';
  onChainChange: (chain: Chain | undefined) => void;
  onScamTypeChange: (scamType: ScamType | undefined) => void;
  onSortChange: (sort: 'newest' | 'risk' | 'reports') => void;
}

const selectClasses =
  'bg-navy-800 border border-navy-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-accent focus:ring-1 focus:ring-blue-accent/30 transition-all';

export default function SearchFilters({
  chain,
  scamType,
  sort,
  onChainChange,
  onScamTypeChange,
  onSortChange,
}: SearchFiltersProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-heading uppercase tracking-wider text-slate-400">
        {t('search.filters')}
      </span>

      {/* Chain filter */}
      <select
        value={chain ?? ''}
        onChange={(e) => onChainChange((e.target.value || undefined) as Chain | undefined)}
        className={selectClasses}
      >
        <option value="">
          {t('common.all')} — {t('search.chain')}
        </option>
        {CHAINS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Scam type filter */}
      <select
        value={scamType ?? ''}
        onChange={(e) => onScamTypeChange((e.target.value || undefined) as ScamType | undefined)}
        className={selectClasses}
      >
        <option value="">
          {t('common.all')} — {t('search.scamType')}
        </option>
        {SCAM_TYPES.map((s) => (
          <option key={s.id} value={s.id}>
            {t(s.labelKey)}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as 'newest' | 'risk' | 'reports')}
        className={selectClasses}
      >
        <option value="newest">{t('search.sortNewest')}</option>
        <option value="risk">{t('search.sortRisk')}</option>
        <option value="reports">{t('search.sortReports')}</option>
      </select>
    </div>
  );
}
