'use client';

import React from 'react';
import Count from './common/Count';
import { useLandingI18n } from './i18n/LandingI18nProvider';

const counter_data = [
  { titleKey: 'stats.creators', number: 500, suffix: '+' },
  { titleKey: 'stats.students', number: 10, suffix: 'K' },
  { titleKey: 'stats.courses', number: 2, suffix: 'K' },
  { titleKey: 'stats.countries', number: 15, suffix: '+' },
];

const FunFactSection = () => {
  const { t } = useLandingI18n();

  return (
    <>
      <div className="container">
        <div className="row align-items-center">
          {counter_data.map((item, i) => (
            <div key={i} className="col-lg-3">
              <div className="cs_funfact cs_style1">
                <div className="cs_funfact_number me-4 cs_stroke_text">
                  <div className="amin_auto_count">
                    <Count number={item.number} add_style={true} />
                  </div>
                  {item.suffix && <span>{item.suffix}</span>}
                </div>
                <div className="cs_funfact_text cs_primary_font">
                  <p>{t(item.titleKey)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="cs_height_150 cs_height_lg_60"></div>
    </>
  );
};

export default FunFactSection;
