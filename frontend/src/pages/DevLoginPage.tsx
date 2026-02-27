import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { startAuthentication } from '../lib/webauthn';
import { useAuth } from '../contexts/AuthContext';
import type { PublicKeyCredentialRequestOptionsJSON } from '../lib/webauthn';
import type { User } from '@cryptoscam/shared';

interface BeginLoginData {
  options: PublicKeyCredentialRequestOptionsJSON;
  challengeKey: string;
}

export default function DevLoginPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Begin login
      const beginResult = await api.post<BeginLoginData>('/auth/login/begin', {});

      if (!beginResult.success) {
        setError(beginResult.error.message);
        setLoading(false);
        return;
      }

      const { options, challengeKey } = beginResult.data;

      // Step 2: Authenticate with browser
      const credential = await startAuthentication(options);

      // Step 3: Finish login
      const finishResult = await api.post<{ user: User }>('/auth/login/finish', {
        credential,
        challengeKey,
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
            {t('dev.login')}
          </h1>
          <p className="text-text-muted text-sm mb-8">{t('dev.loginDescription')}</p>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={() => void handleLogin()}
            disabled={loading}
            className="w-full py-3 px-6 bg-accent-developer text-white font-heading font-bold rounded-lg hover:bg-accent-developer/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('common.loading') : t('dev.loginWithPasskey')}
          </button>

          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              {t('dev.noAccount')}{' '}
              <Link
                to="/developers/register"
                className="text-accent-developer hover:text-accent-developer/80 transition-colors"
              >
                {t('dev.registerLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
