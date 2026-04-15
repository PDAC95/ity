'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { dashboardTranslations } from './translations';

interface I18nContextValue {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'es',
  setLang: () => {},
  t: (key) => dashboardTranslations['es']?.[key] ?? key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangRaw] = useState('es');

  useEffect(() => {
    const saved = localStorage.getItem('ity-lang');
    if (saved && dashboardTranslations[saved]) {
      setLangRaw(saved);
    }
  }, []);

  const setLang = (newLang: string) => {
    if (dashboardTranslations[newLang]) {
      setLangRaw(newLang);
      localStorage.setItem('ity-lang', newLang);
    }
  };

  const t = (key: string): string => {
    return dashboardTranslations[lang]?.[key] ?? dashboardTranslations['es']?.[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
