'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SELECTOR = [
  '.site-page main h1', '.site-page main h2', '.site-page main h3', '.site-page main p',
  '.site-page-dark h1', '.site-page-dark h2', '.site-page-dark h3', '.site-page-dark p',
].join(', ');

export function SiteScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(SELECTOR);
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('scroll-reveal', 'is-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    elements.forEach((element) => {
      element.classList.add('scroll-reveal');
      if (element.getBoundingClientRect().top < window.innerHeight) {
        element.classList.add('is-revealed');
      } else {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
