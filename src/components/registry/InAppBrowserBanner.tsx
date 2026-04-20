import { useState, useEffect } from 'react';
import { AlertTriangle, X, Copy, Check } from 'lucide-react';
import { detectInAppBrowser, type InAppBrowser } from '../../utils/inAppBrowser';
import { useLanguage } from '../../i18n/LanguageContext';

const DISMISS_KEY = 'inapp_browser_banner_dismissed';

export function InAppBrowserBanner() {
  const { t } = useLanguage();
  const [browser, setBrowser] = useState<InAppBrowser>(null);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBrowser(detectInAppBrowser());
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  if (!browser || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — fall back to selection
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
      document.body.removeChild(input);
    }
  };

  const browserName =
    browser === 'wechat' ? 'WeChat' :
    browser === 'line' ? 'LINE' :
    browser === 'facebook' ? 'Facebook' :
    browser === 'instagram' ? 'Instagram' :
    browser === 'tiktok' ? 'TikTok' : 'in-app';

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              {t('inAppBrowser.title').replace('{{browser}}', browserName)}
            </p>
            <p className="text-xs text-amber-800 mt-1">
              {t('inAppBrowser.body')}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium text-amber-900 hover:bg-amber-100"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? t('inAppBrowser.copied') : t('inAppBrowser.copyLink')}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-amber-700 hover:bg-amber-100 rounded flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
