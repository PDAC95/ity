'use client';

import React from 'react';
import Link from 'next/link';
import { useLandingI18n } from './i18n/LandingI18nProvider';

const FooterOne = () => {
  const { t } = useLandingI18n();

  const email = 'hola@12ity.com';

  const links = [
    { titleKey: 'footer.linkHome', link: '/' },
    { titleKey: 'footer.linkFeatures', link: '#services' },
    { titleKey: 'footer.linkTestimonials', link: '#testimonials' },
    { titleKey: 'footer.linkLogin', link: '/login' },
    { titleKey: 'footer.linkRegister', link: '/register' },
  ];

  return (
    <footer className="cs_footer cs_primary_bg">
      <div className="cs_height_150 cs_height_lg_60"></div>
      <div className="container">
        <div className="row">
          <div className="col-lg-5">
            <div className="cs_footer_info">
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: "'Kanit', sans-serif",
                }}
              >
                ITY
              </span>
              <p>{t('footer.info')}</p>
              <a href={`mailto:${email}`} className="cs_primary_font anim_text_upanddowns">
                <span>{email}</span>
              </a>
            </div>
          </div>
          <div className="col-lg-6 offset-lg-1">
            <div className="cs_footer_social">
              <Link href="https://twitter.com/" className="cs_center" target="_blank">
                Twitter
              </Link>
              <Link href="https://instagram.com/" className="cs_center" target="_blank">
                Instagram
              </Link>
              <Link href="https://linkedin.com/" className="cs_center" target="_blank">
                LinkedIn
              </Link>
            </div>
            <div className="cs_height_60 cs_height_lg_30"></div>
            <ul className="cs_footer_contact_list cs_mp0">
              <li>
                <i>
                  <svg
                    width="18"
                    height="14"
                    viewBox="0 0 18 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.5043 8.78757C10.0565 9.08612 9.53631 9.24394 9 9.24394C8.46373 9.24394 7.94356 9.08612 7.49574 8.78757L0.119848 3.87016C0.0789258 3.84288 0.0390586 3.81444 0 3.78519V11.8429C0 12.7667 0.749707 13.4999 1.65702 13.4999H16.3429C17.2668 13.4999 18 12.7502 18 11.8429V3.78516C17.9608 3.81448 17.9209 3.84299 17.8799 3.87031L10.5043 8.78757Z"
                      fill="white"
                    />
                    <path
                      d="M0.704883 2.99347L8.08077 7.91091C8.35998 8.09707 8.67997 8.19012 8.99996 8.19012C9.31999 8.19012 9.64002 8.09703 9.91923 7.91091L17.2951 2.99347C17.7365 2.69939 18 2.2072 18 1.67599C18 0.762594 17.2569 0.0195312 16.3435 0.0195312H1.65646C0.743098 0.0195664 0 0.762629 0 1.67687C0 2.2072 0.263531 2.69939 0.704883 2.99347Z"
                      fill="white"
                    />
                  </svg>
                </i>
                {email}
              </li>
            </ul>
          </div>
        </div>
        <div className="cs_height_90 cs_height_lg_60"></div>
        <ul className="cs_footer_nav">
          {links.map((item, index) => (
            <li key={index}>
              <Link href={item.link}>{t(item.titleKey)}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="cs_copyright text-center">
        <div className="container">
          Copyright {new Date().getFullYear()} ITY - I Teach You. {t('footer.copyright')}.
        </div>
      </div>
    </footer>
  );
};

export default FooterOne;
