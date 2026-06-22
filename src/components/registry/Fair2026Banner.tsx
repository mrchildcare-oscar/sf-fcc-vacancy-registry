import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const DISMISS_KEY = 'fcc_fair_2026_banner_dismissed';
// Auto-retire the banner after the event (Sat Jun 27, 2026); cutoff = Jun 28 00:00 PT.
export const FAIR_HIDE_AFTER = Date.parse('2026-06-28T00:00:00-07:00');

/**
 * Slim, dismissible homepage banner promoting the Family Child Care Fair.
 * Links to the standalone static page at /fcc-fair-2026. Trilingual via i18n;
 * disappears on its own once the event has passed.
 */
export function Fair2026Banner() {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    setHidden(dismissed || Date.now() > FAIR_HIDE_AFTER);
  }, []);

  if (hidden) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setHidden(true);
  };

  return (
    <div className="bg-blue-600 text-white">
      <div className="max-w-6xl mx-auto px-4 py-2.5">
        <div className="flex items-center gap-3">
          <a
            href="/fcc-fair-2026"
            className="flex-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-sm font-semibold leading-snug hover:opacity-90"
          >
            <span>{t('fairBanner.text')}</span>
            <span className="underline underline-offset-2 whitespace-nowrap">{t('fairBanner.cta')}</span>
          </a>
          <button
            onClick={handleDismiss}
            className="p-1 text-white/80 hover:bg-white/15 rounded flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
