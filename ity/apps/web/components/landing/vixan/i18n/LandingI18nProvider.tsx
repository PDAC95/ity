'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Translations = Record<string, any>;

interface I18nContextType {
  lang: string;
  t: (key: string) => string;
  setLang: (lang: string) => void;
}

const SUPPORTED_LANGS = ['en', 'es', 'fr', 'pt'];
const LANG_LABELS: Record<string, { flag: string; label: string }> = {
  en: { flag: '\u{1F1FA}\u{1F1F8}', label: 'English' },
  es: { flag: '\u{1F1EA}\u{1F1F8}', label: 'Español' },
  fr: { flag: '\u{1F1EB}\u{1F1F7}', label: 'Français' },
  pt: { flag: '\u{1F1E7}\u{1F1F7}', label: 'Português' },
};

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  t: (key) => key,
  setLang: () => {},
});

export function useLandingI18n() {
  return useContext(I18nContext);
}

export { SUPPORTED_LANGS, LANG_LABELS };

function getNestedValue(obj: Translations, key: string): string | null {
  const keys = key.split('.');
  let value: any = obj;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return null;
    }
  }
  return typeof value === 'string' ? value : null;
}

function detectLang(): string {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('ity-lang');
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  const browser = navigator.language.slice(0, 2);
  if (SUPPORTED_LANGS.includes(browser)) return browser;
  return 'en';
}

export default function LandingI18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [ready, setReady] = useState(false);

  const loadTranslations = useCallback(async (locale: string) => {
    try {
      const res = await fetch(`/locales/${locale}.json`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setTranslations(data);
      setReady(true);
    } catch {
      if (locale !== 'en') {
        const res = await fetch('/locales/en.json');
        const data = await res.json();
        setTranslations(data);
        setLangState('en');
      }
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const detected = detectLang();
    setLangState(detected);
    loadTranslations(detected);
  }, [loadTranslations]);

  const setLang = useCallback((newLang: string) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    setLangState(newLang);
    localStorage.setItem('ity-lang', newLang);
    loadTranslations(newLang);
  }, [loadTranslations]);

  const t = useCallback((key: string): string => {
    return getNestedValue(translations, key) ?? key;
  }, [translations]);

  if (!ready) return null;

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}
