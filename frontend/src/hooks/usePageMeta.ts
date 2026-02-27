import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
}

const BASE_URL = 'https://scamledger.com';

export function usePageMeta({ title, description, canonical }: PageMeta): void {
  const location = useLocation();

  useEffect(() => {
    document.title = `${title} | ScamLedger`;

    setMetaTag('description', description);
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:type', 'website');
    setMetaTag('og:url', canonical ?? `${BASE_URL}${location.pathname}`);
    setMetaTag('og:site_name', 'ScamLedger');
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);

    setLinkTag('canonical', canonical ?? `${BASE_URL}${location.pathname}`);
    setHreflangTags(location.pathname);
  }, [title, description, canonical, location.pathname]);
}

function setMetaTag(name: string, content: string): void {
  const isOg = name.startsWith('og:') || name.startsWith('twitter:');
  const attr = isOg ? 'property' : 'name';
  let element = document.querySelector(`meta[${attr}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setLinkTag(rel: string, href: string): void {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function setHreflangTags(pathname: string): void {
  const languages = ['zh-TW', 'en'];
  for (const lang of languages) {
    const id = `hreflang-${lang}`;
    let element = document.getElementById(id);
    if (!element) {
      element = document.createElement('link');
      element.id = id;
      element.setAttribute('rel', 'alternate');
      element.setAttribute('hreflang', lang);
      document.head.appendChild(element);
    }
    element.setAttribute('href', `${BASE_URL}${pathname}?lng=${lang}`);
  }
}
