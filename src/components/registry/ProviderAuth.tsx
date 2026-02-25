import { useState } from 'react';
import { Mail, Lock, Chrome, ArrowRight, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { supabase } from '../../lib/supabase';

interface ProviderAuthProps {
  onEmailAuth: (email: string, password: string, isSignUp: boolean) => Promise<{ error?: string }>;
  onGoogleAuth: () => Promise<{ error?: string }>;
}

export function ProviderAuth({ onEmailAuth, onGoogleAuth }: ProviderAuthProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authMethod, setAuthMethod] = useState<'magic' | 'password'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('auth.enterEmail'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err) {
      console.error('[Auth] Magic link error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'forgot') {
      if (!email) {
        setError(t('auth.enterEmail'));
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) {
          setError(error.message);
        } else {
          setResetSent(true);
        }
      } catch (err) {
        console.error('[Auth] Password reset error:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await onEmailAuth(email, password, mode === 'signup');
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('[Auth] Submit error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await onGoogleAuth();
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('[Auth] Google auth error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.title')}
          </h1>
          <p className="text-gray-600">
            {t('auth.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Chrome size={20} className="text-blue-500" />
            <span className="font-medium">{t('auth.continueWithGoogle')}</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">{t('auth.orContinueWith')}</span>
            </div>
          </div>

          {/* Email Form */}
          {mode === 'forgot' ? (
            // Forgot Password Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {resetSent ? (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-4 rounded-lg">
                  <CheckCircle size={18} />
                  <span>{t('auth.resetEmailSent')}</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">{t('auth.forgotPasswordHelp')}</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('common.email')}
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t('auth.emailPlaceholder')}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {loading ? t('common.loading') : t('auth.sendResetLink')}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => { setMode('signin'); setResetSent(false); setError(''); }}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                {t('common.back')} {t('common.signIn').toLowerCase()}
              </button>
            </form>
          ) : authMethod === 'magic' && mode === 'signin' ? (
            // Magic Link Form
            <form onSubmit={handleMagicLink} className="space-y-4">
              {magicLinkSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail size={24} className="text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{t('auth.checkEmail')}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('auth.magicLinkSent', { email })}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setMagicLinkSent(false); setEmail(''); }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t('auth.useDifferentEmail')}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('common.email')}
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t('auth.emailPlaceholder')}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {loading ? (
                      t('common.loading')
                    ) : (
                      <>
                        <Sparkles size={18} />
                        {t('auth.sendMagicLink')}
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    {t('auth.magicLinkHelp')}
                  </p>
                </>
              )}

              {!magicLinkSent && (
                <button
                  type="button"
                  onClick={() => setAuthMethod('password')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('auth.usePassword')}
                </button>
              )}
            </form>
          ) : (
            // Sign In / Sign Up with Password Form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.email')}
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('common.password')}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('settings.confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? (
                  t('common.loading')
                ) : (
                  <>
                    {mode === 'signin' ? t('common.signIn') : t('auth.createAccount')}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => { setAuthMethod('magic'); setError(''); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('auth.useMagicLink')}
                </button>
              )}
            </form>
          )}

          {mode !== 'forgot' && !magicLinkSent && (
            <div className="mt-6 text-center text-sm">
              {mode === 'signin' ? (
                <p className="text-gray-600">
                  {t('auth.noAccount')}{' '}
                  <button
                    onClick={() => { setMode('signup'); setAuthMethod('password'); }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {t('common.signUp')}
                  </button>
                </p>
              ) : (
                <p className="text-gray-600">
                  {t('auth.hasAccount')}{' '}
                  <button
                    onClick={() => { setMode('signin'); setAuthMethod('magic'); }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {t('common.signIn')}
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
