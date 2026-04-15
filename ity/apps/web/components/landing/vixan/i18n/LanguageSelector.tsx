'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLandingI18n, SUPPORTED_LANGS, LANG_LABELS } from './LandingI18nProvider';

const LanguageSelector = () => {
  const { lang, setLang } = useLandingI18n();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`lang-selector-wrapper${open ? ' open' : ''}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        className="lang-toggle"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '50px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'all 0.3s ease',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>{lang.toUpperCase()}</span>
        <svg
          width="10" height="10"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className="lang-dropdown"
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '8px 0',
          minWidth: '140px',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' as const : 'hidden' as const,
          transform: open ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.3s ease',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 1000,
        }}
      >
        {SUPPORTED_LANGS.map((code) => (
          <div
            key={code}
            onClick={() => { setLang(code); setOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              color: lang === code ? '#59D2F3' : 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              background: lang === code ? 'rgba(89, 210, 243, 0.15)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (lang !== code) (e.currentTarget as HTMLDivElement).style.background = 'rgba(89, 210, 243, 0.1)';
            }}
            onMouseLeave={(e) => {
              if (lang !== code) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '18px' }}>{LANG_LABELS[code]?.flag}</span>
            <span>{LANG_LABELS[code]?.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
