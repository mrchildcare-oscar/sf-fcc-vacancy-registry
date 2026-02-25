import { createContext, useContext, useState, ReactNode } from 'react';
import en from './en.json';
import zhTW from './zh-TW.json';
import es from './es.json';

type Language = 'en' | 'zh-TW' | 'es';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Translations> = {
  'en': en,
  'zh-TW': zhTW,
  'es': es as Translations,
};

const LanguageContext = createContext<LanguageContextType | null>(null);

// Map short URL param values to Language codes
const LANG_PARAM_MAP: Record<string, Language> = {
  'en': 'en',
  'es': 'es',
  'zh': 'zh-TW',
  'zh-TW': 'zh-TW',
  'zh-tw': 'zh-TW',
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // 1. Check URL param first (?lang=es, ?lang=zh) — for QR codes on flyers
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && LANG_PARAM_MAP[langParam]) {
      const lang = LANG_PARAM_MAP[langParam];
      localStorage.setItem('language', lang);
      return lang;
    }

    // 2. Check localStorage
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'zh-TW' || saved === 'es') {
      return saved;
    }

    // 3. Fallback to browser language
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
      return 'zh-TW';
    }
    if (browserLang.startsWith('es')) {
      return 'es';
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Translation function with support for nested keys and parameters
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key is not a string: ${key}`);
      return key;
    }

    // Replace parameters like {location} or {count}
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() || `{${paramKey}}`;
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Language switcher component
export function LanguageSwitcher({ className, compact }: { className?: string; compact?: boolean }) {
  const { language, setLanguage } = useLanguage();

  const buttonPadding = compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div className={`inline-flex items-center rounded-lg border border-gray-300 overflow-hidden flex-shrink-0 ${className || ''}`}>
      <button
        onClick={() => setLanguage('en')}
        className={`${buttonPadding} font-medium transition-colors whitespace-nowrap ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`${buttonPadding} font-medium transition-colors whitespace-nowrap ${
          language === 'es'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLanguage('zh-TW')}
        className={`${buttonPadding} font-medium transition-colors whitespace-nowrap ${
          language === 'zh-TW'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        中文
      </button>
    </div>
  );
}
