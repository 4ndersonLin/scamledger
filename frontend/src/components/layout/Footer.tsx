import { useTranslation } from 'react-i18next';

export default function Footer(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <footer className="bg-navy-900 border-t border-navy-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between text-sm">
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-slate-400">
          <span
            className="inline-flex rounded-full h-2 w-2 bg-threat-green animate-pulse-glow"
            aria-hidden="true"
          />
          <span className="font-heading uppercase tracking-wider text-xs">
            {t('footer.status')}
          </span>
        </div>

        {/* Version / Copyright */}
        <div className="text-slate-400 font-mono text-xs">ScamLedger v1.0.0</div>
      </div>
    </footer>
  );
}
