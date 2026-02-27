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
      <div className="bg-navy-800 border border-navy-700 rounded-lg overflow-hidden">
        <div className="h-1 bg-gold" />
        <div className="p-8">
          <h1 className="text-2xl font-heading font-bold uppercase tracking-wider text-white mb-2">
            {t('dev.login')}
          </h1>
          <p className="text-slate-400 text-sm mb-8">{t('dev.loginDescription')}</p>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={() => void handleLogin()}
            disabled={loading}
            className="w-full py-3 px-6 bg-gold text-navy-950 font-heading font-bold uppercase tracking-wider rounded hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('common.loading') : t('dev.loginWithPasskey')}
          </button>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {t('dev.noAccount')}{' '}
              <Link
                to="/developers/register"
                className="text-gold hover:text-gold/80 transition-colors"
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
