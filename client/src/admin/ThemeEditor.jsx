import { useEffect } from 'react';
import { FONTS, THEME_PRESETS, contrastText, themeVars } from '../../../shared/constants.js';
import { applyTheme } from '../lib/theme.js';
import { ColorInput, Field, useAdmin } from './fields.jsx';
import { PageHead, SaveBar, useContentDraft } from './ContentEditor.jsx';

const COLORS = [
  ['primary', 'Primary', 'Header, buttons, headings accents, footer tint'],
  ['accent', 'Accent', 'Call-to-action buttons and highlights'],
  ['background', 'Page background', ''],
  ['surface', 'Cards & panels', ''],
  ['text', 'Text', ''],
  ['muted', 'Secondary text', ''],
  ['border', 'Borders', ''],
];

function contrastRatio(a, b) {
  const lum = (hex) => {
    const n = hex.replace('#', '');
    const [r, g, bl] = [0, 2, 4].map((i) => {
      const c = parseInt(n.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function Preview({ theme, site }) {
  const vars = themeVars(theme);
  return (
    <div className="t-preview" style={vars} aria-label="Theme preview">
      <div className="t-hero">
        <div className="t-nav">
          <span className="t-logo">
            <span className="t-mark">{(site.shortName || 'CL').split(/\s+/).map((w) => w[0]).join('').slice(0, 2)}</span>
            {site.shortName || site.companyName}
          </span>
          <span className="t-btn t-accent t-sm">Get a quote</span>
        </div>
        <p className="t-eyebrow">Co-loading · Consolidation</p>
        <h3>Share the container. Keep the savings.</h3>
        <div className="t-row">
          <span className="t-btn t-accent">View rates</span>
          <span className="t-btn t-ghost">Contact us</span>
        </div>
      </div>
      <div className="t-body">
        <div className="t-card">
          <span className="t-icon">⛴</span>
          <strong>LCL Sea Freight</strong>
          <p>Share container space and pay only for the CBM you use.</p>
        </div>
        <div className="t-card">
          <span className="t-icon">✈</span>
          <strong>Air Consolidation</strong>
          <p>Fast, cost-effective air freight on scheduled flights.</p>
        </div>
        <div className="t-row t-full">
          <span className="t-btn t-primary">Send message</span>
          <span className="t-link">Terms &amp; Conditions</span>
        </div>
      </div>
    </div>
  );
}

export function ThemeEditor() {
  const { content } = useAdmin();
  const { draft, setDraft, errors, saving, dirty, save, reset } = useContentDraft('theme');
  const set = (k, v) => setDraft({ ...draft, [k]: v, ...(COLORS.some(([c]) => c === k) ? { preset: 'Custom' } : {}) });

  // Load chosen Google Fonts so the preview renders with them.
  useEffect(() => {
    applyTheme(draft);
  }, [draft]);

  const textContrast = contrastRatio(draft.text, draft.background);
  const mutedContrast = contrastRatio(draft.muted, draft.background);

  return (
    <>
      <PageHead title="Theme" description="Colours, typography and shape of the public site. Changes preview live and publish when saved." />
      <div className="t-layout">
        <div>
          <section className="a-card">
            <header className="a-card-head">
              <h2>Presets</h2>
              <p className="a-muted">Start from a preset, then fine-tune below.</p>
            </header>
            <div className="t-presets">
              {Object.entries(THEME_PRESETS).map(([name, p]) => (
                <button
                  key={name}
                  type="button"
                  className={`t-preset${draft.preset === name ? ' is-active' : ''}`}
                  onClick={() => setDraft({ ...draft, ...p, preset: name })}
                  aria-pressed={draft.preset === name}
                >
                  <span className="t-swatches">
                    {[p.primary, p.accent, p.background, p.text].map((c, i) => (
                      <span key={i} style={{ background: c }} />
                    ))}
                  </span>
                  {name}
                </button>
              ))}
            </div>
          </section>

          <section className="a-card">
            <header className="a-card-head">
              <h2>Colours</h2>
            </header>
            <div className="a-grid">
              {COLORS.map(([k, label, help]) => (
                <Field key={k} label={label} help={help} error={errors[k]} htmlFor={`c-${k}`}>
                  <ColorInput id={`c-${k}`} value={draft[k]} onChange={(v) => set(k, v)} />
                </Field>
              ))}
            </div>
            {(textContrast < 4.5 || mutedContrast < 3) && (
              <p className="a-warning">
                Low contrast: text may be hard to read ({textContrast.toFixed(1)}:1 body, {mutedContrast.toFixed(1)}:1 secondary). Aim for at least 4.5:1.
              </p>
            )}
            <p className="a-help">
              Button text colour is picked automatically for readability (primary buttons use {contrastText(draft.primary) === '#ffffff' ? 'white' : 'dark'} text).
            </p>
          </section>

          <section className="a-card">
            <header className="a-card-head">
              <h2>Typography &amp; shape</h2>
            </header>
            <div className="a-grid">
              <Field label="Heading font" htmlFor="t-hf">
                <select id="t-hf" className="a-input" value={draft.headingFont} onChange={(e) => set('headingFont', e.target.value)}>
                  {FONTS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </Field>
              <Field label="Body font" htmlFor="t-bf">
                <select id="t-bf" className="a-input" value={draft.bodyFont} onChange={(e) => set('bodyFont', e.target.value)}>
                  {FONTS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </Field>
              <Field label={`Corner roundness: ${draft.radius}px`} htmlFor="t-r">
                <input id="t-r" type="range" min="0" max="28" value={draft.radius} onChange={(e) => set('radius', Number(e.target.value))} />
              </Field>
              <Field label={`Hero image overlay: ${draft.heroOverlay}%`} help="Darkens the hero background image so text stays readable." htmlFor="t-o">
                <input id="t-o" type="range" min="0" max="95" value={draft.heroOverlay} onChange={(e) => set('heroOverlay', Number(e.target.value))} />
              </Field>
            </div>
          </section>
        </div>

        <aside className="t-aside">
          <p className="a-group-label">Live preview</p>
          <Preview theme={draft} site={content.site} />
        </aside>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} label="Publish theme" />
    </>
  );
}
