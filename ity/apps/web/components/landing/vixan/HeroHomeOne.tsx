'use client';

import Link from 'next/link';
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useLandingI18n } from './i18n/LandingI18nProvider';

const SLIDES = [
  { key: 'slide1', img: '/assets/img/hero_img_1.jpg' },
  { key: 'slide2', img: '/assets/img/hero_img_1.jpg' },
  { key: 'slide3', img: '/assets/img/hero_img_1.jpg' },
];

const HeroHomeOne = () => {
  const { t } = useLandingI18n();
  return (
    <>
      <Swiper
        loop={true}
        slidesPerView={1}
        autoplay={{ delay: 3000 }}
        pagination={{ clickable: true }}
        className="cs_slider cs_slider_1"
      >
        {SLIDES.map((slide, index) => (
          <SwiperSlide key={index} className="swiper-slide">
            <div className="cs_hero cs_style1 cs_center cs_parallax">
              <div
                className="cs_hero_bg cs_bg cs_parallax_bg"
                style={{ backgroundImage: `url(${slide.img})` }}
              ></div>
              <div className="container">
                <div className="cs_hero_text">
                  <div className="cs_hero_mini_title">
                    <svg
                      width="134"
                      height="12"
                      viewBox="0 0 134 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M133.53 6.53033C133.823 6.23744 133.823 5.76256 133.53 5.46967L128.757 0.696699C128.464 0.403806 127.99 0.403806 127.697 0.696699C127.404 0.989593 127.404 1.46447 127.697 1.75736L131.939 6L127.697 10.2426C127.404 10.5355 127.404 11.0104 127.697 11.3033C127.99 11.5962 128.464 11.5962 128.757 11.3033L133.53 6.53033ZM0 6.75H133V5.25H0V6.75Z"
                        fill="#101010"
                      />
                    </svg>
                    {t(`hero.${slide.key}.subtitle`)}
                  </div>
                  <div className="cs_height_20 cs_height_lg_20"></div>
                  <h1 className="cs_hero_title">{t(`hero.${slide.key}.title`)}</h1>
                  <div className="cs_height_70 cs_height_lg_60"></div>
                  <div className="cs_hero_text_in">
                    <div className="cs_hero_subtitle">{t(`hero.${slide.key}.description`)}</div>
                    <div className="cs_height_65 cs_height_lg_40"></div>
                    <div className="cs_height_20 cs_height_lg_0"></div>
                    <div className="ity-hero-buttons">
                      <Link href="/register" className="ity-hero-cta">
                        <span>{t('hero.cta')}</span>
                        <svg width="18" height="12" viewBox="0 0 13 10">
                          <path d="M1,5 L11,5"></path>
                          <polyline points="8 1 12 5 8 9"></polyline>
                        </svg>
                      </Link>

                      <a href="#video" className="ity-hero-play" onClick={(e) => {
                        e.preventDefault();
                        const el = document.querySelector('#video');
                        if (el) {
                          const top = el.getBoundingClientRect().top + window.scrollY - 80;
                          window.scrollTo({ top, behavior: 'smooth' });
                        }
                      }}>
                        <span>{t('hero.watchDemo')}</span>
                        <svg width="18" height="12" viewBox="0 0 13 10">
                          <path d="M1,5 L11,5"></path>
                          <polyline points="8 1 12 5 8 9"></polyline>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
        <div className="cs_pagination cs_style1"></div>
      </Swiper>

      <style>{`
        .ity-hero-buttons {
          display: flex;
          align-items: center;
          gap: 28px;
          flex-wrap: wrap;
        }

        /* === Shared bubble button === */
        .ity-hero-cta,
        .ity-hero-play {
          position: relative;
          padding: 17px 28px;
          transition: all 0.2s ease;
          border: none;
          background: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .ity-hero-cta::before,
        .ity-hero-play::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          display: block;
          border-radius: 50px;
          width: 56px;
          height: 56px;
          transition: all 0.3s ease;
        }
        .ity-hero-cta span,
        .ity-hero-play span {
          position: relative;
          font-family: 'Inter Tight', sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .ity-hero-cta svg,
        .ity-hero-play svg {
          position: relative;
          top: 0;
          margin-left: 12px;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 2;
          transform: translateX(-5px);
          transition: all 0.3s ease;
        }
        .ity-hero-cta:hover::before,
        .ity-hero-play:hover::before {
          width: 100%;
        }
        .ity-hero-cta:hover svg,
        .ity-hero-play:hover svg {
          transform: translateX(0);
        }
        .ity-hero-cta:active,
        .ity-hero-play:active {
          transform: scale(0.95);
        }

        /* === Get Started (orange) === */
        .ity-hero-cta::before {
          background: #ff6b00;
        }
        .ity-hero-cta span {
          color: #101010;
          transition: color 0.3s ease;
        }
        .ity-hero-cta svg {
          stroke: #101010;
          transition: stroke 0.3s ease, transform 0.3s ease;
        }
        .ity-hero-cta:hover span {
          color: #fff;
        }
        .ity-hero-cta:hover svg {
          stroke: #fff;
        }
        .ity-hero-cta:hover::before {
          background: #e86200;
        }

        /* === Watch Demo (dark glass) === */
        .ity-hero-play::before {
          background: rgba(16, 16, 16, 0.15);
        }
        .ity-hero-play span {
          color: #101010;
          transition: color 0.3s ease;
        }
        .ity-hero-play svg {
          stroke: #101010;
          transition: stroke 0.3s ease, transform 0.3s ease;
        }
        .ity-hero-play:hover span {
          color: #fff;
        }
        .ity-hero-play:hover svg {
          stroke: #fff;
        }
        .ity-hero-play:hover::before {
          background: rgba(16, 16, 16, 0.85);
        }

        @media (max-width: 575px) {
          .ity-hero-buttons {
            gap: 16px;
          }
          .ity-hero-cta,
          .ity-hero-play {
            padding: 13px 20px;
          }
          .ity-hero-cta::before,
          .ity-hero-play::before {
            width: 44px;
            height: 44px;
          }
          .ity-hero-cta span,
          .ity-hero-play span {
            font-size: 15px;
          }
        }
      `}</style>
    </>
  );
};

export default HeroHomeOne;
