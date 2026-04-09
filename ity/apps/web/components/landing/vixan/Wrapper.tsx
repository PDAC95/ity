// @ts-nocheck
'use client';

import { gsap } from 'gsap';
import { useEffect } from 'react';
import MouseMove from './common/MouseMove';
import ScrollToTop from './common/ScrollToTop';

import { animationCreate } from './utils/utils';
import animationTitle from './utils/animationTitle';
import { scrollSmother } from './utils/scrollSmother';
import buttonAnimation from './utils/buttonAnimation';

import {
  ScrollSmoother,
  ScrollToPlugin,
  ScrollTrigger,
  SplitText,
} from './plugins';

gsap.registerPlugin(ScrollSmoother, ScrollTrigger, ScrollToPlugin, SplitText);

if (typeof window !== 'undefined') {
  require('bootstrap/dist/js/bootstrap');
}

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      animationCreate();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      ScrollSmoother.create({
        smooth: 1.35,
        effects: true,
        smoothTouch: false,
        normalizeScroll: false,
        ignoreMobileResize: true,
      });
    }
  }, []);

  useEffect(() => {
    buttonAnimation();
    animationTitle();
    scrollSmother();
  }, []);

  return (
    <>
      {children}
      <MouseMove />
      <ScrollToTop />
    </>
  );
};

export default Wrapper;
