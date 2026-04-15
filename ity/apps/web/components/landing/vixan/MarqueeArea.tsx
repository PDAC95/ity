'use client';

import React from 'react';
import { useLandingI18n } from './i18n/LandingI18nProvider';

const MarqueeArea = () => {
  const { t } = useLandingI18n();

  const marqueeText = [
    t('marquee.item1'),
    t('marquee.item2'),
    t('marquee.item3'),
    t('marquee.item4'),
    t('marquee.item5'),
  ].join(' * ');

  const fullText = `${marqueeText} * ${marqueeText}`;

  return (
    <>
      <div className="cs_height_130 cs_height_lg_60"></div>
      <div className="cs_moving_section_wrap cs_bold">
        <div className="cs_moving_section_in">
          <div className="cs_moving_section cs_stroke_text">
            {fullText}
          </div>
          <div className="cs_moving_section cs_stroke_text">
            {fullText}
          </div>
        </div>
      </div>
    </>
  );
};

export default MarqueeArea;
