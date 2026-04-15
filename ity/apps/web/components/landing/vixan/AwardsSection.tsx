'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLandingI18n } from './i18n/LandingI18nProvider';

const PLAN_KEYS = ['free', 'pro', 'business'] as const;

const AwardsSection = () => {
  const { t } = useLandingI18n();
  const [yearly, setYearly] = useState(false);

  const getFeatures = (planKey: string): string[] => {
    const features: string[] = [];
    for (let i = 1; i <= 8; i++) {
      const key = `pricing.${planKey}.f${i}`;
      const val = t(key);
      if (val !== key) features.push(val);
    }
    return features;
  };

  const getPrice = (planKey: string): string => {
    if (planKey === 'free') return t('pricing.free.price');
    return yearly
      ? t(`pricing.${planKey}.priceYearly`)
      : t(`pricing.${planKey}.priceMonthly`);
  };

  return (
    <>
      <div id="pricing" className="cs_height_145 cs_height_lg_60"></div>
      <section>
        <div className="container">
          {/* Header */}
          <div className="cs_section_heading cs_style_1 cs_type_1" style={{ marginBottom: 0 }}>
            <div className="cs_section_heading_text">
              <div className="cs_section_subtitle anim_div_ShowZoom">{t('pricing.subtitle')}</div>
              <h2 className="cs_section_title anim_heading_title">
                {t('pricing.title')}
              </h2>
            </div>
          </div>

          {/* Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            margin: '40px 0 60px',
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: yearly ? 400 : 600,
              color: yearly ? 'var(--body-color)' : 'var(--heading-color)',
              transition: 'all 0.3s',
              fontFamily: "'Kanit', sans-serif",
            }}>
              {t('pricing.monthly')}
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              style={{
                position: 'relative',
                width: '56px',
                height: '30px',
                borderRadius: '15px',
                border: 'none',
                background: yearly ? '#ff6b00' : '#c1c1c1',
                cursor: 'pointer',
                transition: 'background 0.3s',
                padding: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: yearly ? '29px' : '3px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
            <span style={{
              fontSize: '16px',
              fontWeight: yearly ? 600 : 400,
              color: yearly ? 'var(--heading-color)' : 'var(--body-color)',
              transition: 'all 0.3s',
              fontFamily: "'Kanit', sans-serif",
            }}>
              {t('pricing.yearly')}
            </span>
            {yearly && (
              <span style={{
                background: 'rgba(255, 107, 0, 0.12)',
                color: '#ff6b00',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '20px',
                fontFamily: "'Kanit', sans-serif",
              }}>
                {t('pricing.yearlySave')}
              </span>
            )}
          </div>

          {/* Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '1100px',
            margin: '0 auto',
          }}>
            {PLAN_KEYS.map((planKey) => {
              const isPro = planKey === 'pro';
              const price = getPrice(planKey);
              const features = getFeatures(planKey);

              return (
                <div
                  key={planKey}
                  className="anim_div_ShowDowns"
                  style={{
                    position: 'relative',
                    borderRadius: '20px',
                    padding: isPro ? '3px' : '0',
                    background: isPro
                      ? 'linear-gradient(135deg, #ff6b00, #ff9500)'
                      : 'transparent',
                  }}
                >
                  {isPro && (
                    <div style={{
                      position: 'absolute',
                      top: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#ff6b00',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '6px 20px',
                      borderRadius: '20px',
                      fontFamily: "'Kanit', sans-serif",
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                      zIndex: 2,
                    }}>
                      {t('pricing.popular')}
                    </div>
                  )}
                  <div style={{
                    background: 'var(--drak-color)',
                    borderRadius: isPro ? '18px' : '20px',
                    border: isPro ? 'none' : '1px solid var(--border-color)',
                    padding: '40px 36px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* Plan name */}
                    <h3 style={{
                      fontSize: '22px',
                      fontWeight: 600,
                      color: 'var(--heading-color)',
                      marginBottom: '8px',
                      fontFamily: "'Inter Tight', sans-serif",
                    }}>
                      {t(`pricing.${planKey}.name`)}
                    </h3>
                    <p style={{
                      fontSize: '15px',
                      color: 'var(--body-color)',
                      marginBottom: '24px',
                      fontFamily: "'Kanit', sans-serif",
                    }}>
                      {t(`pricing.${planKey}.description`)}
                    </p>

                    {/* Price */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px',
                      marginBottom: '32px',
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--heading-color)',
                        fontFamily: "'Inter Tight', sans-serif",
                      }}>$</span>
                      <span style={{
                        fontSize: '56px',
                        fontWeight: 700,
                        color: 'var(--heading-color)',
                        lineHeight: 1,
                        fontFamily: "'Inter Tight', sans-serif",
                      }}>
                        {price}
                      </span>
                      <span style={{
                        fontSize: '16px',
                        color: 'var(--body-color)',
                        fontFamily: "'Kanit', sans-serif",
                      }}>
                        {t('pricing.perMonth')}
                      </span>
                    </div>

                    {/* Features */}
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 32px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}>
                      {features.map((feat, i) => (
                        <li key={i} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '15px',
                          color: 'var(--body-color)',
                          fontFamily: "'Kanit', sans-serif",
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isPro ? '#ff6b00' : '#22c55e'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href="/register"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px 28px',
                        borderRadius: '12px',
                        background: isPro ? '#ff6b00' : 'transparent',
                        border: isPro ? 'none' : '2px solid var(--border-color)',
                        color: isPro ? '#fff' : 'var(--heading-color)',
                        fontSize: '16px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontFamily: "'Kanit', sans-serif",
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {isPro ? t('pricing.ctaPro') : t('pricing.cta')}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <div className="cs_height_145 cs_height_lg_60"></div>
    </>
  );
};

export default AwardsSection;
