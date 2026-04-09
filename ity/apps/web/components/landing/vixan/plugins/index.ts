// @ts-nocheck
'use client';

// GSAP core from npm — plugins from custom builds in public/assets/plugins/
// These UMD plugins register themselves with the global gsap instance

let ScrollTrigger: any;
let ScrollSmoother: any;
let ScrollToPlugin: any;
let SplitText: any;

if (typeof window !== 'undefined') {
  // Make gsap available globally for the UMD plugins
  const gsapModule = require('gsap');
  window.gsap = gsapModule.gsap || gsapModule.default || gsapModule;

  // Load UMD plugins — they self-register with window.gsap
  require('../../../../public/assets/plugins/gsap-scroll-trigger.js');
  require('../../../../public/assets/plugins/gsap-scroll-smoother.js');
  require('../../../../public/assets/plugins/gsap-scroll-to-plugin.js');
  require('../../../../public/assets/plugins/gsap-split-text.js');

  ScrollTrigger = window.ScrollTrigger;
  ScrollSmoother = window.ScrollSmoother;
  ScrollToPlugin = window.ScrollToPlugin;
  SplitText = window.SplitText;
}

export { ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText };
