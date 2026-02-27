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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-raised border border-border rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
        {/* Green checkmark */}
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-xl font-heading font-bold text-text-primary mb-2">
          {t('report.success')}
        </h2>

        <div className="flex flex-col gap-3 mt-6">
          <Link
            to="/"
            onClick={onClose}
            className="block bg-surface-sunken hover:bg-border/50 border border-border rounded-lg px-4 py-2 text-sm font-heading text-text-secondary transition-colors"
          >
            {t('nav.home')}
          </Link>
          {chain && address && (
            <Link
              to={`/address/${chain}/${address}`}
              onClick={onClose}
              className="block bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg px-4 py-2 text-sm font-heading text-accent transition-colors"
            >
              {t('address.reportThis')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
