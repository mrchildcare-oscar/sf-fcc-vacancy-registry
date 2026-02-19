import { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Users,
  Heart,
  BookOpen,
  Play,
  ChevronDown,
  ChevronUp,
  Home,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const STORAGE_KEY = 'whyFcc_seen';

// Map app language to YouTube CC language codes
const YT_CC_LANG: Record<string, string> = {
  en: 'en',
  es: 'es',
  'zh-TW': 'zh-TW',
};

export function WhyFamilyChildCare() {
  const { t, language } = useLanguage();

  // Build YouTube URL with CC enabled in the user's language
  const ccLang = YT_CC_LANG[language] || 'en';
  const ytBase = 'https://www.youtube.com/embed/Zi234CFrl_Y';
  const ytParams = `cc_load_policy=1&cc_lang_pref=${ccLang}&hl=${ccLang}`;
  const ytUrl = `${ytBase}?${ytParams}`;
  const ytUrlAutoplay = `${ytBase}?autoplay=1&${ytParams}`;
  const [hasSeen, setHasSeen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!hasSeen) {
      const timer = setTimeout(() => setMounted(true), 80);
      return () => clearTimeout(timer);
    }
  }, [hasSeen]);

  const dismiss = () => {
    setMounted(false);
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch { /* private browsing fallback */ }
      setHasSeen(true);
    }, 400);
  };

  const benefits = [
    {
      icon: ShieldCheck,
      title: t('landing.whyFcc.licensed'),
      desc: t('landing.whyFcc.licensedDesc'),
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50',
      border: 'border-l-sky-400',
    },
    {
      icon: Users,
      title: t('landing.whyFcc.smallGroups'),
      desc: t('landing.whyFcc.smallGroupsDesc'),
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      border: 'border-l-emerald-400',
    },
    {
      icon: Heart,
      title: t('landing.whyFcc.diverse'),
      desc: t('landing.whyFcc.diverseDesc'),
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-50',
      border: 'border-l-rose-400',
    },
    {
      icon: BookOpen,
      title: t('landing.whyFcc.schoolReady'),
      desc: t('landing.whyFcc.schoolReadyDesc'),
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
      border: 'border-l-violet-400',
    },
  ];

  /* ── Returning visitor: compact collapsible (warm style) ── */
  if (hasSeen) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setAccordionOpen(!accordionOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors"
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 50%, #fef2f2 100%)',
            border: '1px solid rgba(217, 119, 6, 0.15)',
          }}
        >
          <div className="flex items-center gap-2">
            <Home size={16} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-900">
              {t('landing.whyFcc.title')}
            </span>
          </div>
          {accordionOpen ? (
            <ChevronUp size={16} className="text-amber-400" />
          ) : (
            <ChevronDown size={16} className="text-amber-400" />
          )}
        </button>
        {accordionOpen && (
          <div
            className="mt-0 rounded-b-xl px-4 pt-4 pb-5 space-y-4"
            style={{
              background: 'linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%)',
              border: '1px solid rgba(217, 119, 6, 0.12)',
              borderTop: 'none',
            }}
          >
            {/* Video */}
            <div
              className="relative w-full aspect-video rounded-xl overflow-hidden"
              style={{
                border: '1px solid rgba(217,119,6,0.12)',
                boxShadow: '0 2px 8px rgba(217,119,6,0.06)',
              }}
            >
              <iframe
                src={ytUrl}
                title={t('landing.whyFcc.title')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            {/* Benefit cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className={`flex items-start gap-3 bg-white/80 rounded-xl p-3.5 border-l-[3px] ${b.border}`}
                >
                  <div className={`p-2 ${b.iconBg} rounded-lg flex-shrink-0`}>
                    <b.icon size={18} className={b.iconColor} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug">{b.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── First-time visitor: prominent welcome banner ── */
  return (
    <div
      className={`mb-6 relative overflow-hidden rounded-2xl transition-all duration-500 ease-out ${
        mounted
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6'
      }`}
      style={{
        background: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 30%, #fff7ed 60%, #fef2f2 100%)',
        border: '1px solid rgba(217, 119, 6, 0.15)',
      }}
    >
      {/* Warm decorative glows */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.08) 0%, transparent 70%)' }}
      />

      {/* Dismiss X */}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/70 hover:bg-white text-amber-600/60 hover:text-amber-700 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <div className="relative px-5 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="p-2 bg-amber-100/80 rounded-xl">
            <Home size={20} className="text-amber-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-amber-900">
            {t('landing.whyFcc.title')}
          </h2>
        </div>
        <p className="text-sm text-amber-800/70 mb-5 sm:ml-11">
          {t('landing.whyFcc.bannerSubtitle')}
        </p>

        {/* Benefits grid — 1 col mobile, 2 col sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className={`flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-3.5 border-l-[3px] ${b.border} transition-all duration-500 ease-out ${
                mounted
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-4'
              }`}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              <div className={`p-2 ${b.iconBg} rounded-lg flex-shrink-0`}>
                <b.icon size={18} className={b.iconColor} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                  {b.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Video — lazy-loaded on click */}
        {showVideo ? (
          <div
            className={`relative w-full aspect-video rounded-xl overflow-hidden mb-4 transition-all duration-500 ${
              mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{
              transitionDelay: '600ms',
              border: '1px solid rgba(217,119,6,0.12)',
              boxShadow: '0 2px 12px rgba(217,119,6,0.08)',
            }}
          >
            <iframe
              src={ytUrlAutoplay}
              title={t('landing.whyFcc.title')}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : (
          <button
            onClick={() => setShowVideo(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 bg-white/60 hover:bg-white/90 rounded-xl transition-all group mb-4 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
            style={{
              transitionDelay: '600ms',
              transitionDuration: '500ms',
              border: '1px solid rgba(217,119,6,0.1)',
            }}
          >
            <div className="p-2.5 bg-red-500 rounded-full group-hover:scale-110 transition-transform">
              <Play size={14} className="text-white ml-0.5" fill="currentColor" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">
                {t('landing.whyFcc.watchVideo')}
              </p>
              <p className="text-xs text-gray-500">5 min</p>
            </div>
          </button>
        )}

        {/* Dismiss CTA */}
        <button
          onClick={dismiss}
          className="w-full py-2.5 text-sm font-medium text-amber-700 hover:text-amber-800 bg-amber-100/50 hover:bg-amber-100/80 rounded-lg transition-colors"
        >
          {t('landing.whyFcc.gotIt')}
        </button>
      </div>
    </div>
  );
}
