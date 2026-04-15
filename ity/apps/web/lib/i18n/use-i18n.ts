'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardTranslations } from './translations';

export function useI18n() {
  const [lang, setLangState] = useState('es');

  useEffect(() => {
    const saved = localStorage.getItem('ity-lang');
    if (saved && dashboardTranslations[saved]) {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((newLang: string) => {
    if (dashboardTranslations[newLang]) {
      setLangState(newLang);
      localStorage.setItem('ity-lang', newLang);
    }
  }, []);

  const t = useCallback((key: string): string => {
    return dashboardTranslations[lang]?.[key] ?? dashboardTranslations['es']?.[key] ?? key;
  }, [lang]);

  return { lang, setLang, t };
}
