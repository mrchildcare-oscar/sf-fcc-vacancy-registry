import { useEffect } from 'react';
import { ExternalLink, Heart } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

// Join It ships this widget as a <script> snippet that injects the form. That snippet
// never executes here (Vite/React renders the DOM after the parser has moved on), so we
// embed the hosted widget in an iframe instead — same widget, same widget id.
const DONATION_WIDGET_SRC = 'https://app.joinit.com/embed/donation-widget/MtwudgEsY9TFFhWgK';

// Shown when the browser blocks third-party frames (some in-app browsers do).
const DONATION_PAGE_URL = 'https://app.joinit.com/o/fccasf-member';

// `t()` resolves string keys only — it warns and returns the key for arrays — so the
// bullets are numbered keys under donate.*, matching how the rest of i18n/*.json is shaped.
const SUPPORT_KEYS = ['support1', 'support2', 'support3'] as const;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2';

export function Donate() {
  const { t } = useLanguage();

  // This app is a single static index.html behind hash routing, so there is no per-route
  // head management. Set the title for this view and put back whatever it was on unmount.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = t('donate.metaTitle');
    return () => {
      document.title = previousTitle;
    };
  }, [t]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="mb-8">
          {/* No language switcher here — AudienceTopBar renders the global one site-wide. */}
          <a
            href="#public"
            className={`mb-4 inline-flex items-center gap-1 rounded text-sm text-teal-700 hover:underline ${FOCUS_RING}`}
          >
            ← {t('insights.backToListings')}
          </a>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{t('donate.title')}</h1>
          <p className="mt-2 max-w-2xl text-gray-600">{t('donate.intro')}</p>
        </div>

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="text-teal-600">
              <Heart size={16} />
            </span>
            {t('donate.supportsHeading')}
          </div>
          <ul className="space-y-2">
            {SUPPORT_KEYS.map((key) => (
              <li key={key} className="flex gap-2 text-gray-600">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                <span>{t(`donate.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-medium text-gray-700">{t('donate.formHeading')}</h2>

          <div className="mx-auto w-full max-w-[1024px]">
            <iframe
              src={DONATION_WIDGET_SRC}
              title={t('donate.formHeading')}
              allow="payment"
              loading="lazy"
              style={{ width: '100%', height: '800px', border: 'none', display: 'block' }}
            />
            {/* Join It's widget checks for this attribution link — keep it in the DOM. */}
            <a href="https://joinit.com" className="sr-only">
              Join It
            </a>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {t('donate.fallback')}{' '}
            <a
              href={DONATION_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 rounded text-teal-700 hover:underline ${FOCUS_RING}`}
            >
              {t('donate.formHeading')}
              <ExternalLink size={12} />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
