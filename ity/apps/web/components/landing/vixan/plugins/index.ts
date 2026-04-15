// @ts-nocheck
'use client';

// GSAP plugins loader
// Custom UMD plugins require window.gsap before they self-register.

let ScrollTrigger: any;
let ScrollSmoother: any;
let ScrollToPlugin: any;
let SplitText: any;

if (typeof window !== 'undefined') {
  // 1. Set window.gsap from npm gsap
  const gsapModule = require('gsap');
  window.gsap = gsapModule.gsap || gsapModule.default || gsapModule;

  // 2. Load UMD plugins — in CJS mode they export directly
  const stModule = require('./gsap/gsap-scroll-trigger.js');
  ScrollTrigger = stModule.ScrollTrigger || stModule.default;

  const ssModule = require('./gsap/gsap-scroll-smoother.js');
  ScrollSmoother = ssModule.ScrollSmoother || ssModule.default;

  const stpModule = require('./gsap/gsap-scroll-to-plugin.js');
  ScrollToPlugin = stpModule.ScrollToPlugin || stpModule.default;

  const splitModule = require('./gsap/gsap-split-text.js');
  SplitText = splitModule.SplitText || splitModule.default;
}

export { ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText };
