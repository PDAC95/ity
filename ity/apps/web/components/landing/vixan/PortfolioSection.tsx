'use client';

import React from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useLandingI18n } from './i18n/LandingI18nProvider';

const portfolio_images = [
  '/assets/img/portfolio_1.jpg',
  '/assets/img/portfolio_2.jpg',
  '/assets/img/portfolio_3.jpg',
  '/assets/img/portfolio_1.jpg',
  '/assets/img/portfolio_2.jpg',
  '/assets/img/portfolio_3.jpg',
];

const case_keys = [
  'caseStudy.case1',
  'caseStudy.case2',
  'caseStudy.case3',
  'caseStudy.case4',
  'caseStudy.case5',
  'caseStudy.case6',
];

const PortfolioSection = () => {
  const { t } = useLandingI18n();

  return (
    <>
      <div id="portfolio" className="cs_horizontal_scroll_wrap">
        <div className="cs_height_145 cs_height_lg_60"></div>
        <div className="container">
          <div className="cs_section_heading cs_style_1 cs_type_2">
            <div className="cs_section_heading_text">
              <div className="cs_section_subtitle anim_div_ShowZoom">{t('caseStudy.subtitle')}</div>
              <h2 className="cs_section_title anim_heading_title">
                {t('caseStudy.title')}
              </h2>
            </div>
          </div>
          <div className="cs_height_100 cs_height_lg_60"></div>
        </div>
        <Swiper
          loop={true}
          speed={1000}
          slidesPerView="auto"
          pagination={{
            el: '.cs_pagination',
            clickable: true,
          }}
          className="cs_horizontal_scrolls anim_div_ShowDowns"
        >
          {case_keys.map((key, i) => (
            <SwiperSlide key={i} className="swiper-slide">
              <div className="cs_horizontal_scroll">
                <Link href="/register" className="cs_portfolio cs_style_1">
                  <div className="cs_portfolio_img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={portfolio_images[i]} alt={t(`${key}.title`)} />
                  </div>
                  <div className="cs_portfolio_overlay"></div>
                  <div className="cs_portfolio_info">
                    <h2 className="cs_portfolio_title">{t(`${key}.title`)}</h2>
                    <div className="cs_portfolio_subtitle">{t(`${key}.category`)}</div>
                  </div>
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="cs_height_145 cs_height_lg_60"></div>
    </>
  );
};

export default PortfolioSection;
