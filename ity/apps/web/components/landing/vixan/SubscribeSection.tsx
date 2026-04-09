'use client';

import React from 'react';
import Link from 'next/link';

const SubscribeSection = () => {
  return (
    <>
      <div className="container">
        <div className="cs_newsletter cs_style_1 cs_primary_bg cs_shape_wrap_1 cs_parallax">
          <div className="cs_shape_1">
            <svg width="149" height="150" viewBox="0 0 149 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.23">
                <path
                  d="M54.7532 1.2627C47.1932 42.3276 41.0646 48.4558 0 56.0158C41.065 63.5757 47.1932 69.7039 54.7532 110.769C62.3131 69.7039 68.4414 63.5757 109.506 56.0158C68.4414 48.4558 62.3128 42.3276 54.7532 1.2627Z"
                  fill="#454545"
                />
                <path
                  d="M114.179 78.2979C109.372 104.413 105.474 108.311 79.3584 113.119C105.474 117.926 109.372 121.824 114.179 147.939C118.987 121.824 122.885 117.926 149 113.119C122.884 108.311 118.987 104.413 114.179 78.2979Z"
                  fill="#454545"
                />
              </g>
            </svg>
          </div>
          <div className="cs_shape_2">
            <svg width="149" height="150" viewBox="0 0 149 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.23">
                <path
                  d="M54.7532 1.2627C47.1932 42.3276 41.0646 48.4558 0 56.0158C41.065 63.5757 47.1932 69.7039 54.7532 110.769C62.3131 69.7039 68.4414 63.5757 109.506 56.0158C68.4414 48.4558 62.3128 42.3276 54.7532 1.2627Z"
                  fill="#454545"
                />
                <path
                  d="M114.179 78.2979C109.372 104.413 105.474 108.311 79.3584 113.119C105.474 117.926 109.372 121.824 114.179 147.939C118.987 121.824 122.885 117.926 149 113.119C122.884 108.311 118.987 104.413 114.179 78.2979Z"
                  fill="#454545"
                />
              </g>
            </svg>
          </div>
          <div className="cs_section_heading cs_style_1 cs_color_1 text-center">
            <div className="cs_section_heading_text">
              <h2 className="cs_section_title anim_text_upanddowns">
                Comienza tu Escuela Online <br />Hoy Mismo
              </h2>
            </div>
          </div>
          <div className="cs_height_70 cs_height_lg_40"></div>
          <div className="text-center">
            <Link
              href="/auth/register"
              className="cs_btn cs_style_1 cs_color_1"
              style={{ display: 'inline-flex', fontSize: '18px', padding: '15px 40px' }}
            >
              <span>Crear mi Escuela Gratis</span>
              <svg
                width="19"
                height="13"
                viewBox="0 0 19 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.5303 7.03033C18.8232 6.73744 18.8232 6.26256 18.5303 5.96967L13.7574 1.1967C13.4645 0.903806 12.9896 0.903806 12.6967 1.1967C12.4038 1.48959 12.4038 1.96447 12.6967 2.25736L16.9393 6.5L12.6967 10.7426C12.4038 11.0355 12.4038 11.5104 12.6967 11.8033C12.9896 12.0962 13.4645 12.0962 13.7574 11.8033L18.5303 7.03033ZM0 7.25H18V5.75H0V7.25Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscribeSection;
