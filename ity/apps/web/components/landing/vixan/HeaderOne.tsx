'use client';

import Link from 'next/link';
import MobileMenu from './MobileMenu';
import React, { useEffect, useState } from 'react';

interface MenuItem {
  id: number;
  title: string;
  link: string;
  has_dropdown: boolean;
  sub_menu?: {
    id: number;
    title: string;
    link: string;
  }[];
}

const menu_data: MenuItem[] = [
  {
    id: 1,
    title: 'Inicio',
    link: '/',
    has_dropdown: false,
  },
  {
    id: 2,
    title: 'Funciones',
    link: '#services',
    has_dropdown: false,
  },
  {
    id: 3,
    title: 'Casos de Exito',
    link: '#portfolio',
    has_dropdown: false,
  },
  {
    id: 4,
    title: 'Testimonios',
    link: '#testimonials',
    has_dropdown: false,
  },
  {
    id: 5,
    title: 'Iniciar Sesion',
    link: '/auth/login',
    has_dropdown: false,
  },
];

const HeaderOne = () => {
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const stickyHandler = () => {
      setSticky(window.scrollY > 200);
    };
    window.addEventListener('scroll', stickyHandler);
    return () => window.removeEventListener('scroll', stickyHandler);
  }, []);

  const [active, setActive] = useState<boolean>(false);
  const handleActive = () => {
    setActive(!active);
  };

  const [navTitle, setNavTitle] = useState('');
  const openMobileMenu = (menu: string) => {
    if (navTitle === menu) {
      setNavTitle('');
    } else {
      setNavTitle(menu);
    }
  };

  const [lastScrollTop, setLastScrollTop] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.cs_sticky_header') as HTMLElement | null;

      if (!header) return;

      const headerHeight = header.offsetHeight + 30;
      const windowTop = window.pageYOffset || document.documentElement.scrollTop;

      if (windowTop >= headerHeight) {
        header.classList.add('cs_gescout_sticky');
      } else {
        header.classList.remove('cs_gescout_sticky');
        header.classList.remove('cs_gescout_show');
      }

      if (header.classList.contains('cs_gescout_sticky')) {
        if (windowTop < lastScrollTop) {
          header.classList.add('cs_gescout_show');
        } else {
          header.classList.remove('cs_gescout_show');
        }
      }

      setLastScrollTop(windowTop);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollTop]);

  return (
    <>
      <header
        className={`cs_site_header cs_style1 cs_sticky_header cs_site_header_full_width ${sticky ? 'cs_gescout_sticky' : ''}`}
      >
        <div className="cs_main_header">
          <div className="container">
            <div className="cs_main_header_in">
              <div className="cs_main_header_left">
                <Link className="cs_site_branding logo-dark" href="/">
                  <span style={{ fontSize: '28px', fontWeight: 700, color: '#101010', fontFamily: "'Kanit', sans-serif" }}>
                    ITY
                  </span>
                </Link>
                <Link className="cs_site_branding logo-white" href="/">
                  <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff', fontFamily: "'Kanit', sans-serif" }}>
                    ITY
                  </span>
                </Link>
              </div>
              <div className="cs_main_header_right">
                <div className="cs_nav cs_medium">
                  <MobileMenu active={active} navTitle={navTitle} openMobileMenu={openMobileMenu} />
                  <span
                    className={`cs_munu_toggle ${active ? 'cs_toggle_active' : ''}`}
                    onClick={handleActive}
                  >
                    <span></span>
                  </span>
                </div>
                <div className="cs_toolbox">
                  <span className="cs_icon_btn">
                    <span className="cs_icon_btn_in" onClick={handleActive}>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`cs_side_header ${active ? 'active' : ''}`}>
        <button className="cs_close" onClick={handleActive}></button>
        <div className="cs_side_header_overlay"></div>
        <div className="cs_side_header_in">
          <Link className="cs_site_branding" href="/">
            <span style={{ fontSize: '32px', fontWeight: 700, color: '#fff', fontFamily: "'Kanit', sans-serif" }}>
              ITY
            </span>
          </Link>
          <div className="row align-items-end">
            <div className="col-7">
              <div className="cs_box_one">
                <div className="cs_nav_black_section cs_font_changes">
                  <ul>
                    {menu_data.map((item, i) => (
                      <li
                        key={i}
                        className={`menu-item-has-black-section cs_style_1 ${navTitle === item.title ? 'active' : ''}`}
                      >
                        <Link href={item.link}>{item.title}</Link>
                        {item.has_dropdown && (
                          <>
                            <ul style={{ display: navTitle === item.title ? 'block' : 'none' }}>
                              {item?.sub_menu?.map((sub_item, index) => (
                                <li key={index}>
                                  <Link href={sub_item.link}>{sub_item.title}</Link>
                                </li>
                              ))}
                            </ul>
                            <span
                              onClick={() => openMobileMenu(item.title)}
                              className={`cs_munu_dropdown_toggle_1 ${navTitle === item.title ? 'active' : ''}`}
                            ></span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-4 offset-1">
              <div className="cs_box_two">
                <div>
                  <p>
                    <svg
                      width="14"
                      height="18"
                      viewBox="0 0 14 19"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 0.0195312C3.14027 0.0195312 0 3.01027 0 6.68621C0 7.78973 0.289693 8.88387 0.840408 9.85434L6.6172 17.8047C6.69411 17.9373 6.84065 18.0195 7 18.0195C7.15935 18.0195 7.30589 17.9373 7.3828 17.8047L13.1617 9.85105C13.7103 8.88387 14 7.78969 14 6.68617C14 3.01027 10.8597 0.0195312 7 0.0195312ZM7 10.0195C5.07014 10.0195 3.50002 8.52418 3.50002 6.68621C3.50002 4.84824 5.07014 3.35289 7 3.35289C8.92986 3.35289 10.5 4.84824 10.5 6.68621C10.5 8.52418 8.92986 10.0195 7 10.0195Z"
                        fill="white"
                      ></path>
                    </svg>
                    <span className="ms-2">100% Online Platform</span>
                  </p>

                  <h4 className="cs_phone_number">
                    <Link href="/auth/register">
                      <span className="ms-2">Comienza Gratis</span>
                    </Link>
                  </h4>

                  <ul className="cs_social_link">
                    <li>
                      <a target="_blank" href="https://www.twitter.com/">
                        Twitter
                      </a>
                    </li>
                    <li>
                      <a target="_blank" href="https://www.instagram.com/">
                        Instagram
                      </a>
                    </li>
                    <li>
                      <a target="_blank" href="https://www.linkedin.com/">
                        LinkedIn
                      </a>
                    </li>
                  </ul>

                  <hr className="mt-2 me-5 mb-2" />
                  <h2>
                    <a href="mailto:hola@12ity.com" className="cs_primary_font cs_text_btn">
                      <span className="cs_black">hola@12ity.com</span>
                    </a>
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeaderOne;
