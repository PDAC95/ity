// @ts-nocheck
'use client';

import React, { useEffect } from 'react';

const MouseMove = () => {
  const mousemoveHandler = (e: MouseEvent) => {
    try {
      let tl = gsap.timeline({
        defaults: {
          x: e.clientX,
          y: e.clientY,
        },
      });

      tl.to('.cs_cursor_1', {
        ease: 'power2.out',
      }).to(
        '.cs_cursor_2',
        {
          ease: 'power2.out',
        },
        '-=0.4'
      );
    } catch (error) {
      // gsap not ready yet
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', mousemoveHandler);
    return () => {
      document.removeEventListener('mousemove', mousemoveHandler);
    };
  }, []);

  return (
    <>
      <div className="cs_cursor_1"></div>
      <div className="cs_cursor_2"></div>
    </>
  );
};

export default MouseMove;
