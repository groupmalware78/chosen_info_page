// Shared between the API (validation) and the client (admin UI + rendering).

export const FONTS = [
  'Inter',
  'DM Sans',
  'Manrope',
  'Poppins',
  'Montserrat',
  'Work Sans',
  'Nunito',
  'Open Sans',
  'Lato',
  'Roboto',
  'Source Sans 3',
  'Raleway',
  'Space Grotesk',
  'Oswald',
  'Playfair Display',
  'Merriweather',
];

export const ICONS = [
  'ship',
  'plane',
  'truck',
  'container',
  'warehouse',
  'customs',
  'box',
  'globe',
  'shield',
  'clock',
  'handshake',
  'route',
];

export const MODES = ['sea', 'air', 'road'];
export const UNITS = ['kg', 'cbm'];

export const THEME_PRESETS = {
  'Harbour Navy': {
    primary: '#0b3d91',
    accent: '#f59e0b',
    background: '#f7f8fb',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#5b6477',
    border: '#e2e6ef',
  },
  'Cargo Orange': {
    primary: '#e2561b',
    accent: '#1f2a44',
    background: '#fbf8f5',
    surface: '#ffffff',
    text: '#1c1917',
    muted: '#6b625b',
    border: '#ece4dc',
  },
  'Evergreen Freight': {
    primary: '#0f766e',
    accent: '#eab308',
    background: '#f5f9f8',
    surface: '#ffffff',
    text: '#0b1f1d',
    muted: '#51645f',
    border: '#dce8e5',
  },
  'Midnight Port': {
    primary: '#38bdf8',
    accent: '#fbbf24',
    background: '#0b1220',
    surface: '#131c2e',
    text: '#e5ecf6',
    muted: '#94a3b8',
    border: '#243049',
  },
};

export const DEFAULT_THEME = {
  preset: 'Harbour Navy',
  ...THEME_PRESETS['Harbour Navy'],
  headingFont: 'Manrope',
  bodyFont: 'Inter',
  radius: 12,
  heroOverlay: 65,
};

/** Relative luminance helper used to pick readable text on coloured backgrounds. */
export function contrastText(hex) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? '#0b1220' : '#ffffff';
}

/** CSS custom properties for a theme. Values are pre-validated hex colours and enum fonts. */
export function themeVars(theme) {
  const t = { ...DEFAULT_THEME, ...theme };
  return {
    '--c-primary': t.primary,
    '--c-on-primary': contrastText(t.primary),
    '--c-accent': t.accent,
    '--c-on-accent': contrastText(t.accent),
    '--c-bg': t.background,
    '--c-surface': t.surface,
    '--c-text': t.text,
    '--c-muted': t.muted,
    '--c-border': t.border,
    '--font-heading': `'${t.headingFont}', system-ui, sans-serif`,
    '--font-body': `'${t.bodyFont}', system-ui, sans-serif`,
    '--radius': `${t.radius}px`,
    '--hero-overlay': String(t.heroOverlay / 100),
    'color-scheme': contrastText(t.background) === '#ffffff' ? 'dark' : 'light',
  };
}

export function themeToCss(theme) {
  const body = Object.entries(themeVars(theme))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return `:root{${body}}`;
}

export function googleFontsHref(theme) {
  const t = { ...DEFAULT_THEME, ...theme };
  const families = [...new Set([t.headingFont, t.bodyFont])]
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
