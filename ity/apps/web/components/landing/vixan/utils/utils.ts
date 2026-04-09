// @ts-nocheck
'use client';

import { gsap } from 'gsap';

export const animationCreate = () => {
  if (typeof window !== 'undefined') {
    const parallaxMouse = document.querySelectorAll('.cs_parallax');
    if (parallaxMouse.length > 0) {
      window.addEventListener('mousemove', function (e) {
        parallaxMouse.forEach((el) => {
          const moving_value = (el as HTMLElement).getAttribute('data-speed');
          const x = (e.clientX * parseInt(moving_value || '0')) / 250;
          const y = (e.clientY * parseInt(moving_value || '0')) / 250;
          (el as HTMLElement).style.transform = `translateX(${x}px) translateY(${y}px)`;
        });
      });
    }
  }
};
