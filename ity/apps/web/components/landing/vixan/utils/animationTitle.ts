// @ts-nocheck
'use client';

import { gsap } from 'gsap';
import { SplitText } from '../plugins';

const animationTitle = () => {
  if (typeof window !== 'undefined') {
    const splitTitleLines = gsap.utils.toArray('.anim_heading_title');
    splitTitleLines.forEach((splitTextLine) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: splitTextLine,
          start: 'top 90%',
          end: 'bottom 60%',
          scrub: false,
          markers: false,
          toggleActions: 'play none none none',
        },
      });

      const itemSplitted = new SplitText(splitTextLine, {
        type: 'words, lines',
      });
      gsap.set(splitTextLine, { perspective: 400 });
      itemSplitted.split({ type: 'lines' });
      tl.from(itemSplitted.lines, {
        duration: 1,
        delay: 0.3,
        opacity: 0,
        rotationX: -80,
        force3D: true,
        transformOrigin: 'top center -50',
        stagger: 0.1,
      });
    });
  }

  if (typeof window !== 'undefined') {
    const textTextWrittings = gsap.utils.toArray('.anim_text_writting');
    textTextWrittings.forEach((splitTextLine) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: splitTextLine,
          start: 'top 90%',
          end: 'bottom 60%',
          scrub: false,
          markers: false,
          toggleActions: 'play none none none',
        },
      });
      const textCharsWritting = new SplitText(splitTextLine, {
        type: 'chars, words',
      });
      tl.from(
        textCharsWritting.chars,
        {
          duration: 0.5,
          x: 100,
          autoAlpha: 0,
          stagger: 0.1,
        },
        '-=1'
      );
    });
  }

  if (typeof window !== 'undefined') {
    const textWordWrittings = gsap.utils.toArray('.anim_word_writting');

    textWordWrittings.forEach((splitWordLine) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: splitWordLine,
          start: 'top 90%',
          end: 'bottom 60%',
          scrub: false,
          markers: false,
          toggleActions: 'play none none none',
        },
      });
      const textWordWritting = new SplitText(splitWordLine, {
        type: 'words',
      });
      tl.from(
        textWordWritting.words,
        {
          duration: 0.7,
          x: 100,
          delay: 0.5,
          autoAlpha: 0,
          stagger: 0.2,
        },
        '-=1'
      );
    });
  }

  if (typeof window !== 'undefined') {
    const splitTextLines = gsap.utils.toArray('.anim_text');

    splitTextLines.forEach((splitTextLine) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: splitTextLine,
          start: 'top 90%',
          duration: 2,
          end: 'bottom 60%',
          scrub: false,
          markers: false,
          toggleActions: 'play none none none',
        },
      });

      const itemSplitted = new SplitText(splitTextLine, {
        type: 'lines',
      });
      gsap.set(splitTextLine, {
        perspective: 400,
      });
      itemSplitted.split({
        type: 'lines',
      });
      tl.from(itemSplitted.lines, {
        duration: 1,
        delay: 0.5,
        opacity: 0,
        rotationX: -80,
        force3D: true,
        transformOrigin: 'top center -50',
        stagger: 0.1,
      });
    });
  }

  if (typeof window !== 'undefined') {
    const blogAnim = gsap.utils.toArray('.anim_blog');
    gsap.set(blogAnim, {
      opacity: 0,
      y: -100,
      x: -100,
    });

    if (blogAnim) {
      blogAnim.forEach((item, i) => {
        gsap.to(item, {
          scrollTrigger: {
            trigger: item,
            start: 'top center+=200',
            markers: false,
          },
          opacity: 1,
          x: -0,
          y: -0,
          ease: 'power2.out',
          duration: 2,
          stagger: 0.5,
        });
      });
    }
  }

  if (typeof window !== 'undefined') {
    const aminTextUpanddowns = gsap.utils.toArray('.anim_text_upanddowns');
    const aminTextUpanddownChar = new SplitText(aminTextUpanddowns, {
      type: 'chars',
    });
    const textUpanddown = gsap.timeline({
      scrollTrigger: {
        trigger: aminTextUpanddowns,
        start: 'top 90%',
        end: 'bottom 60%',
        scrub: false,
        markers: false,
        toggleActions: 'play none none none',
      },
    });

    textUpanddown.from(aminTextUpanddownChar.chars, {
      duration: 2,
      opacity: 0,
      delay: 0.5,
      scale: 1.2,
      y: 50,
      rotationX: 100,
      transformOrigin: '0% 30% -30',
      ease: 'elastic',
      stagger: 0.05,
    });
  }

  if (typeof window !== 'undefined') {
    const divShowsZoom = gsap.utils.toArray('.anim_div_ShowZoom');
    divShowsZoom.forEach((showsZoom) => {
      gsap.set(showsZoom, {
        opacity: 0,
        scale: 0,
      });

      gsap.to(showsZoom, {
        scrollTrigger: {
          trigger: showsZoom,
          start: 'top 90%',
          end: 'bottom 60%',
          markers: false,
        },
        opacity: 1,
        scale: 1,
        delay: 0.5,
        ease: 'power3.out',
        duration: 1,
        stagger: 0.5,
      });
    });
  }

  if (typeof window !== 'undefined') {
    const divShowsDowns = gsap.utils.toArray('.anim_div_ShowDowns');
    divShowsDowns.forEach((showsDown) => {
      gsap.set(showsDown, {
        opacity: 0,
        y: +100,
      });

      gsap.to(showsDown, {
        scrollTrigger: {
          trigger: showsDown,
          start: 'top 90%',
          end: 'bottom 60%',
          markers: false,
        },
        opacity: 1,
        y: -0,
        ease: 'power2.out',
        duration: 2,
        stagger: 1,
      });
    });
  }
};

export default animationTitle;
