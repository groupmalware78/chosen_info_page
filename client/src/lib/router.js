import { useEffect, useState } from 'react';

export function navigate(to) {
  if (to === window.location.pathname + window.location.hash) return;
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export function scrollToHash(hash, behavior = 'smooth') {
  const el = hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (el) el.scrollIntoView({ behavior });
  return Boolean(el);
}

/**
 * Click handler for internal <a> links: in-page anchors scroll smoothly, other same-origin
 * links navigate client-side. Modified clicks and external links behave normally.
 */
export function linkHandler(e) {
  const a = e.currentTarget;
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target === '_blank' || a.origin !== window.location.origin) return;
  e.preventDefault();
  if (a.pathname === window.location.pathname) {
    if (a.hash) {
      window.history.replaceState({}, '', a.hash);
      scrollToHash(a.hash);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }
  navigate(a.pathname + a.hash);
  if (!a.hash) window.scrollTo(0, 0);
  // Pages scroll to the hash themselves once rendered (see useScrollToHashOnMount).
}

export function useScrollToHashOnMount() {
  useEffect(() => {
    if (window.location.hash) requestAnimationFrame(() => scrollToHash(window.location.hash, 'auto'));
    else window.scrollTo(0, 0);
  }, []);
}
