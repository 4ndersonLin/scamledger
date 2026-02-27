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
      <div className="bg-surface-raised border border-border rounded-2xl shadow-xl overflow-hidden">
        <div className="h-1 bg-accent-developer" />
        <div className="p-8">
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">
            {t('dev.register')}
          </h1>
          <p className="text-text-muted text-sm mb-8">{t('dev.registerDescription')}</p>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-text-secondary mb-2"
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
                className="w-full px-4 py-3 bg-surface-sunken border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-developer focus:ring-1 focus:ring-accent-developer transition-colors"
                disabled={loading}
              />
            </div>

            <Turnstile onVerify={setTurnstileToken} />

            <button
              onClick={() => void handleRegister()}
              disabled={loading || !displayName.trim()}
              className="w-full py-3 px-6 bg-accent-developer text-white font-heading font-bold rounded-lg hover:bg-accent-developer/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('common.loading') : t('dev.registerWithPasskey')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              {t('dev.hasAccount')}{' '}
              <Link
                to="/developers/login"
                className="text-accent-developer hover:text-accent-developer/80 transition-colors"
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
