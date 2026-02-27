import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { startRegistration } from '../lib/webauthn';
import { useAuth } from '../contexts/AuthContext';
import type { PublicKeyCredentialCreationOptionsJSON } from '../lib/webauthn';
import type { User } from '@cryptoscam/shared';
import Turnstile from '../components/shared/Turnstile';

interface BeginRegistrationData {
  options: PublicKeyCredentialCreationOptionsJSON;
  userId: string;
}

export default function DevRegisterPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (): Promise<void> => {
    if (!displayName.trim()) {
      setError(t('dev.displayNameRequired'));
      return;
    }

    if (!turnstileToken) {
      setError(t('dev.turnstileRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Begin registration
      const beginResult = await api.post<BeginRegistrationData>('/auth/register/begin', {
        displayName: displayName.trim(),
        turnstile_token: turnstileToken,
      });

      if (!beginResult.success) {
        setError(beginResult.error.message);
        setLoading(false);
        return;
      }

      const { options, userId } = beginResult.data;

      // Step 2: Create credential with browser
      const credential = await startRegistration(options);

      // Step 3: Finish registration
      const finishResult = await api.post<{ user: User }>('/auth/register/finish', {
        userId,
        credential,
      });

      if (!finishResult.success) {
        setError(finishResult.error.message);
        setLoading(false);
        return;
      }

      // Step 4: Refresh auth state and redirect
      await checkAuth();
      void navigate('/developers');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <div className="bg-navy-800 border border-navy-700 rounded-lg overflow-hidden">
        <div className="h-1 bg-gold" />
        <div className="p-8">
          <h1 className="text-2xl font-heading font-bold uppercase tracking-wider text-white mb-2">
            {t('dev.register')}
          </h1>
          <p className="text-slate-400 text-sm mb-8">{t('dev.registerDescription')}</p>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                {t('dev.displayName')}
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('dev.displayNamePlaceholder')}
                maxLength={64}
                className="w-full px-4 py-3 bg-navy-900 border border-navy-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                disabled={loading}
              />
            </div>

            <Turnstile onVerify={setTurnstileToken} />

            <button
              onClick={() => void handleRegister()}
              disabled={loading || !displayName.trim()}
              className="w-full py-3 px-6 bg-gold text-navy-950 font-heading font-bold uppercase tracking-wider rounded hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('common.loading') : t('dev.registerWithPasskey')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {t('dev.hasAccount')}{' '}
              <Link
                to="/developers/login"
                className="text-gold hover:text-gold/80 transition-colors"
              >
                {t('dev.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
