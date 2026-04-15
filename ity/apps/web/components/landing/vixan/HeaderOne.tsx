'use client';

import Link from 'next/link';
import LanguageSelector from './i18n/LanguageSelector';
import { useLandingI18n, SUPPORTED_LANGS, LANG_LABELS } from './i18n/LandingI18nProvider';
import React, { useEffect, useState } from 'react';

const HeaderOne = () => {
  const { t, lang, setLang } = useLandingI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: t('nav.home'), href: '#', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
    { label: t('nav.features'), href: '#services', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { label: t('caseStudy.subtitle'), href: '#portfolio', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { label: t('pricing.subtitle'), href: '#pricing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const scrollTo = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.querySelector(href);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 991) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: scrolled ? '10px' : '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: scrolled ? 'calc(100% - 40px)' : 'calc(100% - 80px)',
          maxWidth: '1320px',
          zIndex: 9999,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 28px',
            borderRadius: '16px',
            background: scrolled
              ? 'rgba(16, 16, 16, 0.85)'
              : 'rgba(16, 16, 16, 0.45)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: scrolled
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 4px 16px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#fff',
                fontFamily: "'Kanit', sans-serif",
                letterSpacing: '1px',
              }}
            >
              ITY
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            className="ity-desktop-nav"
          >
            {navItems.map((item, i) => (
              <a
                key={i}
                href={item.href}
                onClick={(e) => scrollTo(e, item.href)}
                style={{
                  color: 'rgba(255, 255, 255, 0.75)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Kanit', sans-serif",
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = '#fff';
                  (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.75)';
                  (e.target as HTMLElement).style.background = 'transparent';
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right side: Language + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div className="ity-desktop-nav">
              <LanguageSelector />
            </div>

            <Link
              href="/login"
              className="ity-desktop-nav"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '10px',
                background: '#ff6b00',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.25s ease',
                fontFamily: "'Kanit', sans-serif",
                border: 'none',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#e55f00';
                (e.target as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = '#ff6b00';
                (e.target as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {t('nav.login')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Mobile hamburger */}
            <button
              className="ity-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                flexDirection: 'column',
                gap: '5px',
                position: 'relative',
                zIndex: 10001,
              }}
            >
              <span style={{
                display: 'block', width: '22px', height: '2px', background: '#fff',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
              }} />
              <span style={{
                display: 'block', width: '22px', height: '2px', background: '#fff',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: mobileOpen ? 0 : 1,
                transform: mobileOpen ? 'translateX(-10px)' : 'none',
              }} />
              <span style={{
                display: 'block', width: '22px', height: '2px', background: '#fff',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
              }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen overlay */}
      <div
        className="ity-mobile-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(10, 10, 10, 0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          opacity: mobileOpen ? 1 : 0,
          visibility: mobileOpen ? 'visible' as const : 'hidden' as const,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '100px 32px 40px',
        }}
      >
        {/* Nav items — large, centered, staggered */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flex: 1,
          justifyContent: 'center',
        }}>
          {navItems.map((item, i) => (
            <a
              key={i}
              href={item.href}
              onClick={(e) => scrollTo(e, item.href)}
              className="ity-mobile-nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '28px',
                fontWeight: 600,
                padding: '20px 16px',
                borderRadius: '16px',
                fontFamily: "'Inter Tight', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: mobileOpen ? `${i * 0.06}s` : '0s',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <svg
                width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,107,0,0.7)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d={item.icon} />
              </svg>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Bottom section: Language + CTA */}
        <div style={{
          opacity: mobileOpen ? 1 : 0,
          transform: mobileOpen ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: mobileOpen ? '0.3s' : '0s',
        }}>
          {/* Language selector — pill style */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '20px',
            padding: '6px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {SUPPORTED_LANGS.map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '12px 8px',
                  borderRadius: '10px',
                  border: 'none',
                  background: lang === code
                    ? 'rgba(255, 107, 0, 0.15)'
                    : 'transparent',
                  color: lang === code ? '#ff6b00' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: lang === code ? 600 : 400,
                  fontFamily: "'Kanit', sans-serif",
                  transition: 'all 0.25s ease',
                }}
              >
                <span style={{ fontSize: '16px' }}>{LANG_LABELS[code]?.flag}</span>
                <span>{code.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px 24px',
                borderRadius: '14px',
                background: '#ff6b00',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: "'Kanit', sans-serif",
                transition: 'all 0.25s ease',
              }}
            >
              {t('hero.cta')}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 24px',
                borderRadius: '14px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 500,
                textDecoration: 'none',
                fontFamily: "'Kanit', sans-serif",
                transition: 'all 0.25s ease',
              }}
            >
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        .ity-desktop-nav { display: flex !important; }
        .ity-mobile-toggle { display: none !important; }
        .ity-mobile-overlay { display: none; }

        @media (max-width: 991px) {
          .ity-desktop-nav { display: none !important; }
          .ity-mobile-toggle { display: flex !important; }
          .ity-mobile-overlay { display: flex !important; }
        }

        .ity-mobile-nav-item:active {
          background: rgba(255, 107, 0, 0.08) !important;
          transform: scale(0.98) !important;
        }
      `}</style>
    </>
  );
};

export default HeaderOne;
