import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Chain } from '@cryptoscam/shared';

interface SuccessModalProps {
  chain?: Chain;
  address?: string;
  onClose: () => void;
}

export default function SuccessModal({
  chain,
  address,
  onClose,
}: SuccessModalProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-navy-800 border border-navy-600 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        {/* Green checkmark */}
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-threat-green/20 flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-xl font-heading font-bold uppercase tracking-wider text-white mb-2">
          {t('report.success')}
        </h2>

        <div className="flex flex-col gap-3 mt-6">
          <Link
            to="/"
            onClick={onClose}
            className="block bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded px-4 py-2 text-sm font-heading uppercase tracking-wider text-slate-200 transition-colors"
          >
            {t('nav.home')}
          </Link>
          {chain && address && (
            <Link
              to={`/address/${chain}/${address}`}
              onClick={onClose}
              className="block bg-blue-accent/20 hover:bg-blue-accent/30 border border-blue-accent/40 rounded px-4 py-2 text-sm font-heading uppercase tracking-wider text-blue-accent transition-colors"
            >
              {t('address.reportThis')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
