'use client';

import React, { useState } from 'react';

interface DataType {
  id: number;
  icon: string;
  img: string;
  brand: string;
  title: string;
  des: string;
}

const award_data: DataType[] = [
  {
    id: 1,
    icon: '/assets/img/award_1.svg',
    img: '/assets/img/award_thumb_1.jpg',
    brand: 'Facilidad',
    title: 'Configuracion en Minutos',
    des: 'Lanza tu escuela online sin necesidad de conocimientos tecnicos. Nuestro asistente IA te guia paso a paso.',
  },
  {
    id: 2,
    icon: '/assets/img/award_2.svg',
    img: '/assets/img/award_thumb_2.jpg',
    brand: 'Escalabilidad',
    title: 'Crece Sin Limites',
    des: 'Desde tu primer alumno hasta miles. Nuestra infraestructura se adapta a tus necesidades sin costos adicionales.',
  },
  {
    id: 3,
    icon: '/assets/img/award_3.svg',
    img: '/assets/img/award_thumb_3.jpg',
    brand: 'Control Total',
    title: '0% Comisiones por Venta',
    des: 'Tu fijas los precios, tu recibes el 100% de las ganancias. Sin comisiones ocultas, sin sorpresas en tu facturacion.',
  },
];

const AwardsSection = () => {
  const [activeTab, setActiveTab] = useState(0);
  const handleMouseEnter = (index: number) => {
    setActiveTab(index);
  };

  return (
    <>
      <section>
        <div className="container">
          <div className="cs_section_heading cs_style_1 cs_type_1 swiper-slide swiper-slide-active">
            <div className="cs_section_heading_text">
              <div className="cs_section_subtitle anim_div_ShowZoom">Ventajas ITY</div>
              <h2 className="cs_section_title anim_heading_title">
                Por Que Creadores Eligen ITY para sus Escuelas
              </h2>
            </div>
          </div>
          <div className="cs_height_100 cs_height_lg_60"></div>
          <div className="cs_card_2_list">
            {award_data.map((item, i) => (
              <div
                key={i}
                onMouseEnter={() => handleMouseEnter(i)}
                className={`cs_card cs_style_2 cs_hover_tab anim_div_ShowDowns ${activeTab === i ? 'active' : ''}`}
              >
                <div className="cs_card_left">
                  <div className="cs_card_logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.icon} alt={item.title} />
                  </div>
                  <div>
                    <h2 className="cs_card_title">{item.title}</h2>
                    <div className="cs_card_subtitle">{item.des}</div>
                  </div>
                </div>
                <div className="cs_card_right">
                  <h2 className="cs_card_brand">{item.brand}</h2>
                </div>
                <div className="cs_card_hover_img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.img} alt={item.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="cs_height_145 cs_height_lg_60"></div>
    </>
  );
};

export default AwardsSection;
