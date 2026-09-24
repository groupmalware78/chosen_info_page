import { googleFontsHref, themeToCss } from '../../../shared/constants.js';

/** Applies a theme at runtime (used on load in dev and for live preview in the admin). */
export function applyTheme(theme) {
  if (!theme) return;
  let style = document.getElementById('theme-vars');
  if (!style) {
    style = document.createElement('style');
    style.id = 'theme-vars';
    document.head.appendChild(style);
  }
  style.textContent = themeToCss(theme);

  const href = googleFontsHref(theme);
  let link = document.getElementById('theme-fonts');
  if (!link) {
    link = [...document.querySelectorAll('link[rel="stylesheet"]')].find((l) => l.href.startsWith('https://fonts.googleapis.com'));
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.id = 'theme-fonts';
  }
  if (link.href !== href) link.href = href;

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.primary);
}
