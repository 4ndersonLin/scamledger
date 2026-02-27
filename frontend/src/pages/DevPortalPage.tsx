import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type { ApiKey } from '@cryptoscam/shared';
import LoadingSpinner from '../components/shared/LoadingSpinner';

interface ApiKeyWithRawKey extends ApiKey {
  api_key?: string;
}

interface UsageData {
  id: string;
  daily_usage: number;
  daily_limit: number;
  total_requests: number;
  last_used_at: string | null;
}

export default function DevPortalPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoggedIn, loading: authLoading, logout } = useAuth();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create key modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Delete confirmation state
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Copy feedback state
  const [copied, setCopied] = useState(false);

  // Usage data
  const [usageMap, setUsageMap] = useState<Record<string, UsageData>>({});

  const fetchApiKeys = useCallback(async (): Promise<void> => {
    try {
      const result = await api.get<ApiKey[]>('/keys');
      if (result.success) {
        setApiKeys(result.data);
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setKeysLoading(false);
    }
  }, [t]);

  const fetchUsageForKey = useCallback(async (keyId: string): Promise<void> => {
    try {
      const result = await api.get<UsageData>(`/keys/${keyId}/usage`);
      if (result.success) {
        setUsageMap((prev) => ({ ...prev, [keyId]: result.data }));
      }
    } catch {
      // Usage fetch is non-critical
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      void navigate('/developers/login');
      return;
    }
    if (isLoggedIn) {
      void fetchApiKeys();
    }
  }, [authLoading, isLoggedIn, navigate, fetchApiKeys]);

  useEffect(() => {
    for (const key of apiKeys) {
      void fetchUsageForKey(key.id);
    }
  }, [apiKeys, fetchUsageForKey]);

  const handleCreateKey = async (): Promise<void> => {
    if (!newKeyName.trim()) return;

    setCreateLoading(true);
    setError(null);

    try {
      const result = await api.post<ApiKeyWithRawKey>('/keys', {
        name: newKeyName.trim(),
      });

      if (result.success) {
        setCreatedKey(result.data.api_key ?? null);
        setNewKeyName('');
        void fetchApiKeys();
      } else {
        setError(result.error.message);
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteKey = async (keyId: string): Promise<void> => {
    setDeleteLoading(true);
    setError(null);

    try {
      const result = await api.delete<void>(`/keys/${keyId}`);
      if (result.success) {
        setDeleteKeyId(null);
        void fetchApiKeys();
      } else {
        setError(result.error.message);
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleKey = async (keyId: string, isActive: boolean): Promise<void> => {
    setError(null);

    try {
      const result = await api.patch<ApiKey>(`/keys/${keyId}`, {
        is_active: isActive,
      });
      if (result.success) {
        setApiKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, is_active: isActive } : k)));
      } else {
        setError(result.error.message);
      }
    } catch {
      setError(t('common.error'));
    }
  };

  const handleCopyKey = async (key: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
    void navigate('/developers/login');
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!isLoggedIn) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-wider text-white">
            {t('dev.title')}
          </h1>
          {user && <p className="text-slate-400 text-sm mt-1">{user.display_name}</p>}
        </div>
        <button
          onClick={() => void handleLogout()}
          className="px-4 py-2 border border-navy-600 text-slate-300 rounded font-heading uppercase tracking-wider text-sm hover:border-red-500/50 hover:text-red-400 transition-colors"
        >
          {t('dev.logout')}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* API Keys Section */}
      <div className="bg-navy-800 border border-navy-700 rounded-lg overflow-hidden">
        <div className="h-0.5 bg-gold" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-semibold uppercase tracking-wider text-white">
              {t('dev.apiKeys')}
            </h2>
            <button
              onClick={() => {
                setShowCreateModal(true);
                setCreatedKey(null);
                setNewKeyName('');
              }}
              className="px-4 py-2 bg-gold text-navy-950 font-heading font-bold uppercase tracking-wider text-sm rounded hover:bg-gold/90 transition-colors"
            >
              {t('dev.createKey')}
            </button>
          </div>

          {keysLoading ? (
            <LoadingSpinner />
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg mb-2">{t('dev.noKeys')}</p>
              <p className="text-sm">{t('dev.noKeysDescription')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => {
                const usage = usageMap[key.id];
                const usagePercent = usage
                  ? Math.min(100, (usage.daily_usage / usage.daily_limit) * 100)
                  : 0;

                return (
                  <div key={key.id} className="p-4 bg-navy-900 border border-navy-700 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">{key.name}</h3>
                        <p className="text-slate-500 font-mono text-sm mt-1">
                          {key.key_prefix}
                          {'...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Toggle active/inactive */}
                        <button
                          onClick={() => void handleToggleKey(key.id, !key.is_active)}
                          className={`px-3 py-1 rounded text-xs font-heading uppercase tracking-wider transition-colors ${
                            key.is_active
                              ? 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/30 hover:bg-slate-500/20'
                          }`}
                        >
                          {key.is_active ? t('dev.active') : t('dev.inactive')}
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => setDeleteKeyId(key.id)}
                          className="px-3 py-1 rounded text-xs font-heading uppercase tracking-wider text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                        >
                          {t('dev.delete')}
                        </button>
                      </div>
                    </div>

                    {/* Usage info */}
                    {usage && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {t('dev.usage')}: {usage.daily_usage} / {usage.daily_limit}
                          </span>
                          <span>
                            {t('dev.totalRequests')}: {usage.total_requests.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-navy-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              usagePercent > 80
                                ? 'bg-red-500'
                                : usagePercent > 50
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                        {usage.last_used_at && (
                          <p className="text-xs text-slate-500">
                            {t('dev.lastUsed')}: {new Date(usage.last_used_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="mt-8 bg-navy-800 border border-navy-700 rounded-lg overflow-hidden">
        <div className="h-0.5 bg-blue-accent" />
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold uppercase tracking-wider text-white mb-4">
            {t('dev.quickStart')}
          </h2>
          <div className="bg-navy-950 border border-navy-700 rounded p-4 overflow-x-auto">
            <pre className="text-sm font-mono text-slate-300 whitespace-pre">
              {`curl -X GET \\
  https://api.scamledger.com/v1/address/ETH/0x... \\
  -H "X-API-Key: csr_your_api_key_here"`}
            </pre>
          </div>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-navy-800 border border-navy-700 rounded-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="h-0.5 bg-gold" />
            <div className="p-6">
              <h3 className="text-xl font-heading font-bold uppercase tracking-wider text-white mb-4">
                {t('dev.createKey')}
              </h3>

              {createdKey ? (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-sm">
                    {t('dev.keyWarning')}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={createdKey}
                      className="w-full px-4 py-3 pr-20 bg-navy-900 border border-navy-600 rounded text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => void handleCopyKey(createdKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-navy-700 text-slate-300 rounded text-xs font-heading uppercase tracking-wider hover:bg-navy-600 transition-colors"
                    >
                      {copied ? t('common.copied') : t('common.copy')}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedKey(null);
                    }}
                    className="w-full py-3 px-6 bg-gold text-navy-950 font-heading font-bold uppercase tracking-wider rounded hover:bg-gold/90 transition-colors"
                  >
                    {t('dev.done')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="keyName"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      {t('dev.keyName')}
                    </label>
                    <input
                      id="keyName"
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder={t('dev.keyNamePlaceholder')}
                      maxLength={64}
                      className="w-full px-4 py-3 bg-navy-900 border border-navy-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                      disabled={createLoading}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewKeyName('');
                      }}
                      className="flex-1 py-3 px-6 border border-navy-600 text-slate-300 font-heading uppercase tracking-wider rounded hover:border-slate-500 transition-colors"
                      disabled={createLoading}
                    >
                      {t('dev.cancel')}
                    </button>
                    <button
                      onClick={() => void handleCreateKey()}
                      disabled={createLoading || !newKeyName.trim()}
                      className="flex-1 py-3 px-6 bg-gold text-navy-950 font-heading font-bold uppercase tracking-wider rounded hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {createLoading ? t('common.loading') : t('dev.createKey')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteKeyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-navy-800 border border-navy-700 rounded-lg w-full max-w-sm mx-4 overflow-hidden">
            <div className="h-0.5 bg-red-500" />
            <div className="p-6">
              <h3 className="text-xl font-heading font-bold uppercase tracking-wider text-white mb-4">
                {t('dev.confirmDelete')}
              </h3>
              <p className="text-slate-400 text-sm mb-6">{t('dev.confirmDeleteDescription')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteKeyId(null)}
                  className="flex-1 py-3 px-6 border border-navy-600 text-slate-300 font-heading uppercase tracking-wider rounded hover:border-slate-500 transition-colors"
                  disabled={deleteLoading}
                >
                  {t('dev.cancel')}
                </button>
                <button
                  onClick={() => void handleDeleteKey(deleteKeyId)}
                  disabled={deleteLoading}
                  className="flex-1 py-3 px-6 bg-red-500 text-white font-heading font-bold uppercase tracking-wider rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {deleteLoading ? t('common.loading') : t('dev.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
