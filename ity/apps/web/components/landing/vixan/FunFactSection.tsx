'use client';

import React from 'react';
import Count from './common/Count';

interface DataType {
  id: number;
  title: string;
  number: number;
  suffix?: string;
}

const counter_data: DataType[] = [
  {
    id: 1,
    title: 'Creadores Activos',
    number: 500,
    suffix: '+',
  },
  {
    id: 2,
    title: 'Estudiantes',
    number: 10,
    suffix: 'K',
  },
  {
    id: 3,
    title: 'Cursos Publicados',
    number: 2,
    suffix: 'K',
  },
  {
    id: 4,
    title: 'Paises',
    number: 15,
    suffix: '+',
  },
];

const FunFactSection = () => {
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
                  <p>{item.title}</p>
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
