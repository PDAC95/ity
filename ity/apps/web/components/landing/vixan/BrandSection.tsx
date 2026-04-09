'use client';

import React from 'react';

const brand_data: string[] = [
  '/assets/img/partner_1.svg',
  '/assets/img/partner_2.svg',
  '/assets/img/partner_3.svg',
  '/assets/img/partner_4.svg',
  '/assets/img/partner_5.svg',
  '/assets/img/partner_6.svg',
  '/assets/img/partner_7.svg',
  '/assets/img/partner_8.svg',
  '/assets/img/partner_11.svg',
];

const brand_thumb_data: string[] = [
  '/assets/img/partner_9.svg',
  '/assets/img/partner_10.svg',
  '/assets/img/partner_11.svg',
  '/assets/img/partner_12.svg',
  '/assets/img/partner_13.svg',
  '/assets/img/partner_14.svg',
  '/assets/img/partner_15.svg',
  '/assets/img/partner_1.svg',
  '/assets/img/partner_3.svg',
];

const BrandSection = () => {
  return (
    <>
      <div className="cs_height_140 cs_height_lg_70"></div>
      <div className="cs_moving_section_wrap cs_bold cs_moving_section_hover_push">
        <div className="cs_moving_section_in">
          <div className="cs_moving_section cs_animation_speed_40">
            <div className="cs_partner_logo_wrap">
              {brand_data.map((item, i) => (
                <div key={i} className="cs_partner_logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item} alt="partner" />
                </div>
              ))}
            </div>
          </div>
          <div className="cs_moving_section cs_animation_speed_40">
            <div className="cs_partner_logo_wrap">
              {brand_data.map((item, i) => (
                <div key={i} className="cs_partner_logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item} alt="partner" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="cs_height_45 cs_height_lg_45"></div>
      <div className="cs_moving_section_wrap cs_bold cs_moving_section_hover_push">
        <div className="cs_moving_section_in">
          <div className="cs_moving_section cs_animation_speed_50">
            <div className="cs_partner_logo_wrap">
              {brand_thumb_data.map((item, i) => (
                <div key={i} className="cs_partner_logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item} alt="partner" />
                </div>
              ))}
            </div>
          </div>
          <div className="cs_moving_section cs_animation_speed_50">
            <div className="cs_partner_logo_wrap">
              {brand_thumb_data.map((item, i) => (
                <div key={i} className="cs_partner_logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item} alt="partner" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="cs_height_140 cs_height_lg_70"></div>
    </>
  );
};

export default BrandSection;
