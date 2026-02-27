import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { validateReportInput, MAX_DESCRIPTION_LENGTH } from '@cryptoscam/shared';
import type { Chain, ScamType, ReportInput } from '@cryptoscam/shared';
import ChainSelector from './ChainSelector';
import ScamTypeSelect from './ScamTypeSelect';
import AddressInput from '../shared/AddressInput';
import Turnstile from '../shared/Turnstile';

interface ReportFormProps {
  initialChain?: Chain;
  initialAddress?: string;
  onSubmit: (data: ReportInput) => Promise<void>;
}

const STEPS = [1, 2, 3] as const;

const inputClasses =
  'w-full bg-surface-sunken border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all';

export default function ReportForm({
  initialChain,
  initialAddress,
  onSubmit,
}: ReportFormProps): React.ReactElement {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Step 1 fields
  const [chain, setChain] = useState<Chain | ''>(initialChain ?? '');
  const [address, setAddress] = useState(initialAddress ?? '');
  const [scamType, setScamType] = useState<ScamType | ''>('');

  // Step 2 fields
  const [description, setDescription] = useState('');
  const [lossAmount, setLossAmount] = useState('');
  const [lossCurrency, setLossCurrency] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [txHash, setTxHash] = useState('');

  // Step 3 fields
  const [turnstileToken, setTurnstileToken] = useState('');

  const canGoNext = (): boolean => {
    if (step === 1) {
      return chain !== '' && address.trim() !== '' && scamType !== '';
    }
    if (step === 2) {
      return description.trim() !== '';
    }
    return true;
  };

  const handleNext = (): void => {
    if (step < 3 && canGoNext()) {
      setStep(step + 1);
      setErrors([]);
    }
  };

  const handlePrev = (): void => {
    if (step > 1) {
      setStep(step - 1);
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const reportData: ReportInput = {
      chain: chain as Chain,
      address: address.trim(),
      scam_type: scamType as ScamType,
      description: description.trim(),
      loss_amount: lossAmount ? Number(lossAmount) : null,
      loss_currency: lossCurrency || null,
      evidence_url: evidenceUrl || null,
      tx_hash: txHash || null,
      turnstile_token: turnstileToken || undefined,
    };

    const validation = validateReportInput(reportData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    try {
      await onSubmit(reportData);
    } catch {
      setErrors([t('common.error')]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-heading font-bold ${
                s === step
                  ? 'bg-accent text-white'
                  : s < step
                    ? 'bg-success/20 text-success border border-success'
                    : 'bg-surface-sunken text-text-muted border border-border-subtle'
              }`}
            >
              {s < step ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div
                className={`w-12 md:w-20 h-0.5 mx-1 ${
                  s < step ? 'bg-success' : 'bg-border-subtle'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex items-center justify-center gap-6 mb-8">
        {STEPS.map((s) => (
          <span
            key={s}
            className={`text-xs font-heading ${s === step ? 'text-accent' : 'text-text-muted'}`}
          >
            {t(`report.step${s}`)}
          </span>
        ))}
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mb-6 bg-danger/10 border border-danger/30 rounded-lg p-4">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-danger">
              {err}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <ChainSelector value={chain} onChange={(c) => setChain(c)} />
            <div>
              <label className="block text-sm font-heading text-text-secondary mb-1">
                {t('report.address')}
              </label>
              <AddressInput value={address} onChange={setAddress} chain={chain || undefined} />
            </div>
            <ScamTypeSelect value={scamType} onChange={(s) => setScamType(s)} />
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-heading text-text-secondary mb-1">
                {t('report.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={MAX_DESCRIPTION_LENGTH}
                rows={6}
                className={`${inputClasses} resize-none`}
                placeholder={t('report.description')}
              />
              <div className="text-right text-xs text-text-muted mt-1">
                {description.length} / {MAX_DESCRIPTION_LENGTH}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-heading text-text-secondary mb-1">
                  {t('report.lossAmount')}
                </label>
                <input
                  type="number"
                  value={lossAmount}
                  onChange={(e) => setLossAmount(e.target.value)}
                  min="0"
                  step="any"
                  className={inputClasses}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-heading text-text-secondary mb-1">
                  {t('report.lossCurrency')}
                </label>
                <input
                  type="text"
                  value={lossCurrency}
                  onChange={(e) => setLossCurrency(e.target.value)}
                  className={inputClasses}
                  placeholder="USD, ETH, BTC..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-heading text-text-secondary mb-1">
                {t('report.evidenceUrl')}
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className={`${inputClasses} font-mono`}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-heading text-text-secondary mb-1">
                {t('report.txHash')}
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className={`${inputClasses} font-mono`}
                placeholder="0x..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Verify & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <Turnstile onVerify={(token) => setTurnstileToken(token)} />

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
              <svg
                className="shrink-0 mt-0.5 text-warning"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-sm text-warning">{t('report.ipDisclosure')}</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-heading text-sm font-bold rounded-lg py-3 transition-colors"
            >
              {submitting ? t('common.loading') : t('report.submit')}
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 3 && (
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1}
              className="px-6 py-2 text-sm font-heading text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t('report.prev')}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="px-6 py-2 bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-heading text-sm font-bold rounded-lg transition-colors"
            >
              {t('report.next')}
            </button>
          </div>
        )}
        {step === 3 && step > 1 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handlePrev}
              className="px-6 py-2 text-sm font-heading text-text-muted hover:text-text-primary transition-colors"
            >
              {t('report.prev')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
