'use client';

import React from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';

interface DataType {
  img: string;
  title: string;
  category: string;
}

const portfolio_slider: DataType[] = [
  {
    img: '/assets/img/portfolio_1.jpg',
    title: 'Escuela de Fotografia',
    category: 'Creativos / Fotografia',
  },
  {
    img: '/assets/img/portfolio_2.jpg',
    title: 'Academia de Marketing Digital',
    category: 'Negocios / Marketing',
  },
  {
    img: '/assets/img/portfolio_3.jpg',
    title: 'Escuela de Desarrollo Web',
    category: 'Tecnologia / Programacion',
  },
  {
    img: '/assets/img/portfolio_1.jpg',
    title: 'Academia de Diseno UX/UI',
    category: 'Creativos / Diseno',
  },
  {
    img: '/assets/img/portfolio_2.jpg',
    title: 'Escuela de Cocina Online',
    category: 'Estilo de Vida / Gastronomia',
  },
  {
    img: '/assets/img/portfolio_3.jpg',
    title: 'Academia de Finanzas',
    category: 'Negocios / Finanzas',
  },
];

const PortfolioSection = () => {
  return (
    <>
      <div id="portfolio" className="cs_horizontal_scroll_wrap">
        <div className="cs_height_145 cs_height_lg_60"></div>
        <div className="container">
          <div className="cs_section_heading cs_style_1 cs_type_2">
            <div className="cs_section_heading_text">
              <div className="cs_section_subtitle anim_div_ShowZoom">Casos de Exito</div>
              <h2 className="cs_section_title anim_heading_title">
                Escuelas Creadas por Creadores como Tu
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
          {portfolio_slider.map((item, i) => (
            <SwiperSlide key={i} className="swiper-slide">
              <div className="cs_horizontal_scroll">
                <Link href="/auth/register" className="cs_portfolio cs_style_1">
                  <div className="cs_portfolio_img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.img} alt={item.title} />
                  </div>
                  <div className="cs_portfolio_overlay"></div>
                  <div className="cs_portfolio_info">
                    <h2 className="cs_portfolio_title">{item.title}</h2>
                    <div className="cs_portfolio_subtitle">{item.category}</div>
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
