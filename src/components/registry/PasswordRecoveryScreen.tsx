import { useState } from 'react';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage, LanguageSwitcher } from '../../i18n/LanguageContext';

interface PasswordRecoveryScreenProps {
  userEmail?: string;
  onSuccess: () => void;
}

export function PasswordRecoveryScreen({ userEmail, onSuccess }: PasswordRecoveryScreenProps) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      setDone(true);
      setLoading(false);
      setTimeout(onSuccess, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-end">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={20} className="text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              {t('auth.setNewPasswordTitle')}
            </h1>
          </div>
          <p className="text-sm text-gray-600 mb-5">
            {t('auth.setNewPasswordSubtitle')}
          </p>

          {userEmail && (
            <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">{t('auth.accountEmail')}</p>
              <p className="text-sm font-medium text-gray-900">{userEmail}</p>
            </div>
          )}

          {done ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle size={18} />
              <span className="text-sm">{t('auth.passwordUpdated')}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('auth.newPassword')}
                autoFocus
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder={t('auth.confirmPassword')}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {error && (
                <div className="flex items-start gap-2 p-2 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('auth.updatePassword')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
