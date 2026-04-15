'use client';

import '@/styles/landing.scss';

import React from 'react';
import LandingI18nProvider from './i18n/LandingI18nProvider';
import Wrapper from './Wrapper';
import HeaderOne from './HeaderOne';
import HeroHomeOne from './HeroHomeOne';
import MarqueeArea from './MarqueeArea';
import AboutSection from './AboutSection';
import ServiceSection from './ServiceSection';
import PortfolioSection from './PortfolioSection';
import AwardsSection from './AwardsSection';
import TestimonialSection from './TestimonialSection';
import FunFactSection from './FunFactSection';
import VideoSection from './VideoSection';
import SubscribeSection from './SubscribeSection';
import BrandSection from './BrandSection';
import FooterOne from './FooterOne';

const LandingPage = () => {
  return (
    <LandingI18nProvider>
    <div className="vixan-landing">
      {/* Google Fonts for landing page only */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,100..900;1,100..900&family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet"
      />
      <Wrapper>
        <HeaderOne />
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <main>
              <HeroHomeOne />
              <MarqueeArea />
              <AboutSection />
              <ServiceSection />
              <PortfolioSection />
              <AwardsSection />
              <TestimonialSection />
              <FunFactSection />
              <VideoSection />
              <SubscribeSection />
              <BrandSection />
            </main>
            <FooterOne />
          </div>
        </div>
      </Wrapper>
    </div>
    </LandingI18nProvider>
  );
};

export default LandingPage;
