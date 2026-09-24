import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icons.jsx';
import { api } from '../lib/api.js';
import { linkHandler, useScrollToHashOnMount } from '../lib/router.js';

const MODE_LABELS = { sea: 'Sea', air: 'Air', road: 'Road' };
const UNIT_LABELS = { kg: 'per kg', cbm: 'per CBM' };

/** Paragraphs from CMS text: blank lines split paragraphs. */
function Paragraphs({ text, className }) {
  return (text || '')
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p, i) => (
      <p key={i} className={className}>
        {p}
      </p>
    ));
}

function SmartLink({ href, children, ...props }) {
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      onClick={external || /^(mailto|tel):/i.test(href) ? undefined : linkHandler}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    >
      {children}
    </a>
  );
}

function SectionHeader({ eyebrow, heading, subheading, center = true }) {
  if (!eyebrow && !heading && !subheading) return null;
  return (
    <header className={`section-header${center ? ' is-center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {heading && <h2>{heading}</h2>}
      {subheading && <p className="lead">{subheading}</p>}
    </header>
  );
}

export function Logo({ site, light }) {
  const name = site.shortName || site.companyName || 'Chosen Logistics';
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <a href="/" onClick={linkHandler} className={`logo${light ? ' is-light' : ''}`} aria-label={`${name} home`}>
      {site.logoUrl ? (
        <img src={site.logoUrl} alt="" className="logo-img" />
      ) : (
        <span className="logo-mark" aria-hidden="true">
          {initials}
        </span>
      )}
      <span className="logo-text">{name}</span>
    </a>
  );
}

function navItems(content) {
  const v = content.sections?.visibility || {};
  return [
    v.branding !== false && { id: 'brand', label: 'Our brand' },
    v.about !== false && { id: 'about', label: 'Who we are' },
    v.services !== false && { id: 'services', label: 'Services' },
    v.rates !== false && { id: 'rates', label: 'Rates' },
    v.faqs !== false && { id: 'faqs', label: 'FAQs' },
  ].filter(Boolean);
}

export function Header({ content, solid = false }) {
  const { site } = content;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const items = navItems(content);
  const showContact = content.sections?.visibility?.contact !== false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const onNav = (e) => {
    setOpen(false);
    linkHandler(e);
  };

  return (
    <header className={`site-header${scrolled || solid || open ? ' is-solid' : ''}`}>
      <div className="container header-inner">
        <Logo site={site} light={!(scrolled || solid || open)} />
        <nav className={`main-nav${open ? ' is-open' : ''}`} aria-label="Main" id="main-nav">
          {items.map((it) => (
            <a key={it.id} href={`/#${it.id}`} onClick={onNav}>
              {it.label}
            </a>
          ))}
          {showContact && (
            <a href="/#contact" onClick={onNav} className="btn btn-accent nav-cta">
              Get a quote
            </a>
          )}
        </nav>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
    </header>
  );
}

function Hero({ hero }) {
  const style = hero.backgroundImage ? { '--hero-image': `url("${hero.backgroundImage.replace(/"/g, '%22')}")` } : undefined;
  return (
    <section className={`hero${hero.backgroundImage ? ' has-image' : ''}`} id="top" style={style}>
      <div className="hero-bg" aria-hidden="true">
        <svg className="hero-pattern" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="800" height="600" fill="url(#grid)" />
          <path d="M-20 470 C 200 380, 420 520, 820 330" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 10" />
        </svg>
      </div>
      <div className="container hero-inner">
        <div className="hero-copy">
          {hero.eyebrow && <span className="eyebrow is-light">{hero.eyebrow}</span>}
          <h1>{hero.heading}</h1>
          {hero.subheading && <p className="hero-sub">{hero.subheading}</p>}
          <div className="hero-actions">
            {hero.primaryCta?.label && hero.primaryCta?.href && (
              <SmartLink href={hero.primaryCta.href} className="btn btn-accent btn-lg">
                {hero.primaryCta.label}
                <Icon name="arrow" size={18} />
              </SmartLink>
            )}
            {hero.secondaryCta?.label && hero.secondaryCta?.href && (
              <SmartLink href={hero.secondaryCta.href} className="btn btn-ghost-light btn-lg">
                {hero.secondaryCta.label}
              </SmartLink>
            )}
          </div>
        </div>
        {hero.stats?.length > 0 && (
          <dl className="hero-stats">
            {hero.stats.map((s, i) => (
              <div key={i} className="hero-stat">
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

function Branding({ branding, site }) {
  return (
    <section className="section brand" id="brand">
      <div className="container brand-grid">
        <div className="brand-identity">
          <div className="brand-emblem" aria-hidden="true">
            {site.logoUrl ? <img src={site.logoUrl} alt="" /> : <Icon name="container" size={56} strokeWidth={1.4} />}
          </div>
          <p className="brand-name">{site.companyName}</p>
          {site.tagline && <p className="brand-tagline">{site.tagline}</p>}
        </div>
        <div className="brand-story">
          <SectionHeader eyebrow={branding.eyebrow} heading={branding.heading} center={false} />
          <Paragraphs text={branding.body} className="lead" />
          {(branding.mission || branding.vision) && (
            <div className="mv-grid">
              {branding.mission && (
                <div className="mv-card">
                  <h3>Our mission</h3>
                  <p>{branding.mission}</p>
                </div>
              )}
              {branding.vision && (
                <div className="mv-card">
                  <h3>Our vision</h3>
                  <p>{branding.vision}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {branding.values?.length > 0 && (
        <div className="container">
          <ul className="values-grid">
            {branding.values.map((v, i) => (
              <li key={i} className="value-card">
                <span className="value-index">{String(i + 1).padStart(2, '0')}</span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function About({ about }) {
  return (
    <section className="section about is-alt" id="about">
      <div className="container about-grid">
        <div className="about-media">
          {about.image ? (
            <img src={about.image} alt="" loading="lazy" />
          ) : (
            <div className="about-illustration" aria-hidden="true">
              <Icon name="ship" size={120} strokeWidth={1} />
            </div>
          )}
          {about.badgeValue && (
            <div className="about-badge">
              <strong>{about.badgeValue}</strong>
              <span>{about.badgeLabel}</span>
            </div>
          )}
        </div>
        <div className="about-copy">
          <SectionHeader eyebrow={about.eyebrow} heading={about.heading} center={false} />
          <Paragraphs text={about.body} />
          {about.highlights?.length > 0 && (
            <ul className="check-list">
              {about.highlights.filter(Boolean).map((h, i) => (
                <li key={i}>
                  <span className="check-icon">
                    <Icon name="check" size={16} strokeWidth={2.5} />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Services({ meta, services }) {
  return (
    <section className="section services" id="services">
      <div className="container">
        <SectionHeader {...meta} />
        <ul className="services-grid">
          {services.map((s) => (
            <li key={s.id} className="service-card">
              <span className="service-icon">
                <Icon name={s.icon} size={28} />
              </span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Chargeable quantity and cost for a rate given actual weight (kg) and volume (CBM). */
export function estimate(rate, weightKg, volumeCbm, meta) {
  const factor = { air: meta.airKgPerCbm || 167, sea: meta.seaKgPerCbm || 1000, road: meta.roadKgPerCbm || 333 }[rate.mode];
  let chargeable;
  if (rate.unit === 'kg') chargeable = Math.max(weightKg, volumeCbm * factor);
  else chargeable = Math.max(volumeCbm, weightKg / factor);
  const freight = chargeable * rate.price;
  return { chargeable, freight, total: Math.max(freight, rate.min_charge || 0), minApplied: freight < (rate.min_charge || 0) };
}

function Estimator({ rates, meta }) {
  const [rateId, setRateId] = useState(rates[0]?.id ?? '');
  const [weight, setWeight] = useState('');
  const [cbm, setCbm] = useState('');
  const [dims, setDims] = useState({ l: '', w: '', h: '', qty: '1' });
  const [showDims, setShowDims] = useState(false);

  useEffect(() => {
    if (!rates.some((r) => r.id === Number(rateId))) setRateId(rates[0]?.id ?? '');
  }, [rates, rateId]);

  const rate = rates.find((r) => r.id === Number(rateId));
  const w = Math.max(0, parseFloat(weight) || 0);
  const v = Math.max(0, parseFloat(cbm) || 0);
  const result = rate && (w > 0 || v > 0) ? estimate(rate, w, v, meta) : null;

  const applyDims = () => {
    const { l, w: wd, h, qty } = dims;
    const total = ((parseFloat(l) || 0) * (parseFloat(wd) || 0) * (parseFloat(h) || 0) * (parseInt(qty, 10) || 1)) / 1_000_000;
    setCbm(total ? String(Math.round(total * 1000) / 1000) : '');
    setShowDims(false);
  };

  if (!rates.length) return null;

  return (
    <div className="estimator">
      <div className="estimator-head">
        <Icon name="calculator" />
        <h3>Quick cost estimator</h3>
      </div>
      <div className="form-grid">
        <label className="field is-full">
          <span>Route &amp; mode</span>
          <select value={rateId} onChange={(e) => setRateId(e.target.value)}>
            {rates.map((r) => (
              <option key={r.id} value={r.id}>
                {r.origin} → {r.destination} ({MODE_LABELS[r.mode]})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Total weight (kg)</span>
          <input type="number" inputMode="decimal" min="0" step="any" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 250" />
        </label>
        <label className="field">
          <span>Total volume (CBM)</span>
          <input type="number" inputMode="decimal" min="0" step="any" value={cbm} onChange={(e) => setCbm(e.target.value)} placeholder="e.g. 1.2" />
        </label>
      </div>
      <button type="button" className="link-btn" onClick={() => setShowDims((s) => !s)} aria-expanded={showDims}>
        {showDims ? 'Hide dimension calculator' : "Don't know the CBM? Calculate from carton size"}
      </button>
      {showDims && (
        <div className="dims-grid">
          {[
            ['l', 'Length (cm)'],
            ['w', 'Width (cm)'],
            ['h', 'Height (cm)'],
            ['qty', 'Cartons'],
          ].map(([k, label]) => (
            <label key={k} className="field">
              <span>{label}</span>
              <input type="number" inputMode="decimal" min="0" step="any" value={dims[k]} onChange={(e) => setDims({ ...dims, [k]: e.target.value })} />
            </label>
          ))}
          <button type="button" className="btn btn-outline" onClick={applyDims}>
            Use volume
          </button>
        </div>
      )}
      <div className="estimate-result" aria-live="polite">
        {result ? (
          <>
            <span className="estimate-label">Estimated freight</span>
            <strong className="estimate-total">{formatMoney(result.total, rate.currency)}</strong>
            <span className="estimate-detail">
              Chargeable: {result.chargeable.toLocaleString(undefined, { maximumFractionDigits: 3 })} {rate.unit === 'kg' ? 'kg' : 'CBM'} ×{' '}
              {formatMoney(rate.price, rate.currency)}
              {result.minApplied && ` · minimum charge applied`}
            </span>
          </>
        ) : (
          <span className="estimate-label">Enter weight or volume to see an estimate.</span>
        )}
      </div>
    </div>
  );
}

function Rates({ meta, rates }) {
  const modes = useMemo(() => ['all', ...['sea', 'air', 'road'].filter((m) => rates.some((r) => r.mode === m))], [rates]);
  const [mode, setMode] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = rates.filter((r) => {
    if (mode !== 'all' && r.mode !== mode) return false;
    const q = query.trim().toLowerCase();
    return !q || `${r.origin} ${r.destination}`.toLowerCase().includes(q);
  });

  return (
    <section className="section rates is-alt" id="rates">
      <div className="container">
        <SectionHeader eyebrow={meta.eyebrow} heading={meta.heading} subheading={meta.subheading} />
        <div className="rates-layout">
          <div className="rates-table-wrap">
            <div className="rates-toolbar">
              <div className="tabs" role="tablist" aria-label="Freight mode">
                {modes.map((m) => (
                  <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? 'is-active' : ''} onClick={() => setMode(m)}>
                    {m === 'all' ? 'All' : MODE_LABELS[m]}
                  </button>
                ))}
              </div>
              <label className="search">
                <Icon name="search" size={18} />
                <input type="search" placeholder="Search city or country" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search routes" />
              </label>
            </div>
            <table className="rates-table">
              <thead>
                <tr>
                  <th scope="col">Route</th>
                  <th scope="col">Mode</th>
                  <th scope="col">Rate</th>
                  <th scope="col">Min. charge</th>
                  <th scope="col">Transit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Route">
                      <span className="route">
                        {r.origin} <Icon name="arrow" size={14} /> {r.destination}
                      </span>
                      {r.notes && <small className="route-note">{r.notes}</small>}
                    </td>
                    <td data-label="Mode">
                      <span className={`mode-pill mode-${r.mode}`}>
                        <Icon name={r.mode === 'sea' ? 'ship' : r.mode === 'air' ? 'plane' : 'truck'} size={14} />
                        {MODE_LABELS[r.mode]}
                      </span>
                    </td>
                    <td data-label="Rate">
                      <strong>{formatMoney(r.price, r.currency)}</strong> <span className="muted">{UNIT_LABELS[r.unit]}</span>
                    </td>
                    <td data-label="Min. charge">{r.min_charge ? formatMoney(r.min_charge, r.currency) : '—'}</td>
                    <td data-label="Transit">{r.transit_time || '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">
                      No routes match your search. Contact us for a custom quote.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Estimator rates={rates} meta={meta} />
        </div>
        {meta.disclaimer && <p className="disclaimer">{meta.disclaimer}</p>}
      </div>
    </section>
  );
}

function Faqs({ meta, faqs }) {
  return (
    <section className="section faqs" id="faqs">
      <div className="container faq-layout">
        <SectionHeader {...meta} center={false} />
        <div className="faq-list">
          {faqs.map((f) => (
            <details key={f.id} className="faq-item">
              <summary>
                <span>{f.question}</span>
                <Icon name="chevron" size={20} className="faq-chevron" />
              </summary>
              <div className="faq-answer">
                <Paragraphs text={f.answer} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm({ services, successMessage }) {
  const empty = { name: '', email: '', phone: '', company: '', service: '', message: '', website: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [formError, setFormError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrors({});
    setFormError('');
    try {
      await api.post('/api/contact', form);
      setStatus('sent');
      setForm(empty);
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.message);
      setStatus('idle');
    }
  };

  if (status === 'sent') {
    return (
      <div className="form-success" role="status">
        <span className="success-icon">
          <Icon name="check" size={28} strokeWidth={2.5} />
        </span>
        <p>{successMessage || 'Thank you! We will be in touch shortly.'}</p>
        <button type="button" className="btn btn-outline" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  const field = (name, label, props = {}) => (
    <label className={`field${props.full ? ' is-full' : ''}${errors[name] ? ' has-error' : ''}`}>
      <span>
        {label}
        {props.required && <em aria-hidden="true"> *</em>}
      </span>
      {props.as === 'textarea' ? (
        <textarea rows={5} value={form[name]} onChange={set(name)} required={props.required} aria-invalid={!!errors[name]} maxLength={5000} />
      ) : (
        <input type={props.type || 'text'} value={form[name]} onChange={set(name)} required={props.required} autoComplete={props.autoComplete} aria-invalid={!!errors[name]} />
      )}
      {errors[name] && <small className="field-error">{errors[name]}</small>}
    </label>
  );

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        {field('name', 'Full name', { required: true, autoComplete: 'name' })}
        {field('email', 'Email', { required: true, type: 'email', autoComplete: 'email' })}
        {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel' })}
        {field('company', 'Company', { autoComplete: 'organization' })}
        <label className="field is-full">
          <span>Service needed</span>
          <select value={form.service} onChange={set('service')}>
            <option value="">Select a service (optional)</option>
            {services.map((s) => (
              <option key={s.id} value={s.title}>
                {s.title}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </label>
        {field('message', 'Tell us about your cargo', { required: true, as: 'textarea', full: true })}
        {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
        <div className="hp" aria-hidden="true">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
          </label>
        </div>
      </div>
      {formError && !Object.keys(errors).length && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-lg" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}

function Contact({ meta, site, services }) {
  const waNumber = site.whatsapp?.replace(/[^\d]/g, '');
  return (
    <section className="section contact" id="contact">
      <div className="container contact-grid">
        <div className="contact-info">
          <SectionHeader eyebrow={meta.eyebrow} heading={meta.heading} subheading={meta.subheading} center={false} />
          <ul className="contact-list">
            {site.phone && (
              <li>
                <span className="contact-icon"><Icon name="phone" size={20} /></span>
                <div>
                  <small>Call us</small>
                  <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`}>{site.phone}</a>
                </div>
              </li>
            )}
            {waNumber && (
              <li>
                <span className="contact-icon"><Icon name="whatsapp" size={20} /></span>
                <div>
                  <small>WhatsApp</small>
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">{site.whatsapp}</a>
                </div>
              </li>
            )}
            {site.email && (
              <li>
                <span className="contact-icon"><Icon name="mail" size={20} /></span>
                <div>
                  <small>Email</small>
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </div>
              </li>
            )}
            {site.address && (
              <li>
                <span className="contact-icon"><Icon name="pin" size={20} /></span>
                <div>
                  <small>Visit us</small>
                  <address>{site.address}</address>
                </div>
              </li>
            )}
            {site.hours && (
              <li>
                <span className="contact-icon"><Icon name="clock" size={20} /></span>
                <div>
                  <small>Working hours</small>
                  <span>{site.hours}</span>
                </div>
              </li>
            )}
          </ul>
          {site.mapEmbedUrl && (
            <iframe className="map" title="Office location map" src={site.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          )}
        </div>
        <div className="contact-card">
          <ContactForm services={services} successMessage={meta.successMessage} />
        </div>
      </div>
    </section>
  );
}

const SOCIALS = [
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['linkedin', 'LinkedIn'],
  ['x', 'X'],
  ['tiktok', 'TikTok'],
];

export function Footer({ content }) {
  const { site } = content;
  const items = navItems(content);
  const socials = SOCIALS.filter(([k]) => site.socials?.[k]);
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo site={site} light />
          {site.footerNote && <p>{site.footerNote}</p>}
          {socials.length > 0 && (
            <ul className="socials">
              {socials.map(([k, label]) => (
                <li key={k}>
                  <a href={site.socials[k]} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <Icon name={k} size={18} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav className="footer-col" aria-label="Footer">
          <h3>Explore</h3>
          <ul>
            {items.map((it) => (
              <li key={it.id}>
                <a href={`/#${it.id}`} onClick={linkHandler}>{it.label}</a>
              </li>
            ))}
            {content.sections?.visibility?.contact !== false && (
              <li>
                <a href="/#contact" onClick={linkHandler}>Contact us</a>
              </li>
            )}
          </ul>
        </nav>
        <div className="footer-col">
          <h3>Get in touch</h3>
          <ul>
            {site.phone && <li><a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`}>{site.phone}</a></li>}
            {site.email && <li><a href={`mailto:${site.email}`}>{site.email}</a></li>}
            {site.address && <li><address>{site.address}</address></li>}
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} {site.companyName}. All rights reserved.</p>
        <nav aria-label="Legal" className="legal-links">
          <a href="/terms" onClick={linkHandler}>Terms &amp; Conditions</a>
          <a href="/privacy" onClick={linkHandler}>Privacy Policy</a>
        </nav>
      </div>
    </footer>
  );
}

export function Site({ content, notFound }) {
  const v = content.sections?.visibility || {};
  const s = content.sections || {};
  useScrollToHashOnMount();

  if (notFound) {
    return (
      <>
        <Header content={content} solid />
        <main className="section not-found">
          <div className="container narrow">
            <h1>Page not found</h1>
            <p className="lead">The page you are looking for does not exist or has moved.</p>
            <a href="/" onClick={linkHandler} className="btn btn-primary">Back to home</a>
          </div>
        </main>
        <Footer content={content} />
      </>
    );
  }

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header content={content} />
      <main id="main">
        <Hero hero={content.hero} />
        {v.branding !== false && <Branding branding={content.branding} site={content.site} />}
        {v.about !== false && <About about={content.about} />}
        {v.services !== false && content.services.length > 0 && <Services meta={s.services} services={content.services} />}
        {v.rates !== false && content.rates.length > 0 && <Rates meta={s.rates} rates={content.rates} />}
        {v.faqs !== false && content.faqs.length > 0 && <Faqs meta={s.faqs} faqs={content.faqs} />}
        {v.contact !== false && <Contact meta={s.contact} site={content.site} services={content.services} />}
      </main>
      <Footer content={content} />
      {content.site.whatsapp && (
        <a className="wa-float" href={`https://wa.me/${content.site.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
          <Icon name="whatsapp" size={26} />
        </a>
      )}
    </>
  );
}
