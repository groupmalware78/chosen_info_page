import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { navigate, usePath } from '../lib/router.js';
import { AIcon } from './AIcon.jsx';
import { AdminContext, Field, TextInput } from './fields.jsx';
import { collections, contactSectionFields, pages, sectionsPage } from './schema.js';
import { ContentEditor, PageHead, SectionSettings } from './ContentEditor.jsx';
import { CollectionEditor } from './CollectionEditor.jsx';
import { ThemeEditor } from './ThemeEditor.jsx';
import { Messages } from './Messages.jsx';
import { Media } from './Media.jsx';
import { Account } from './Account.jsx';
import { Dashboard } from './Dashboard.jsx';
import '../styles/admin.css';

const NAV = [
  {
    group: 'Overview',
    items: [
      ['', 'Dashboard', 'dashboard'],
      ['messages', 'Enquiries', 'inbox'],
    ],
  },
  {
    group: 'Page content',
    items: [
      ['hero', 'Hero', 'hero'],
      ['branding', 'Our brand', 'star'],
      ['about', 'Who we are', 'users'],
      ['services', 'Services', 'box'],
      ['rates', 'Rates', 'tag'],
      ['faqs', 'FAQs', 'help'],
      ['contact', 'Contact section', 'mail'],
    ],
  },
  {
    group: 'Settings',
    items: [
      ['site', 'Company & SEO', 'settings'],
      ['sections', 'Page sections', 'layout'],
      ['legal', 'Terms & Privacy', 'file'],
      ['theme', 'Theme', 'palette'],
      ['media', 'Media library', 'image'],
      ['account', 'Account', 'user'],
    ],
  },
];

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { user } = await api.post('/api/admin/auth/login', form);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin a-login">
      <form className="a-login-card" onSubmit={submit}>
        <div className="a-login-brand">
          <span className="a-brand-mark">
            <AIcon name="container" size={22} />
          </span>
          <div>
            <strong>Chosen Logistics</strong>
            <small>Content manager</small>
          </div>
        </div>
        <h1>Sign in</h1>
        <div className="a-stack">
          <Field label="Email" htmlFor="l-email">
            <TextInput id="l-email" type="email" autoComplete="username" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required autoFocus />
          </Field>
          <Field label="Password" htmlFor="l-pass">
            <TextInput id="l-pass" type="password" autoComplete="current-password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
          </Field>
          {error && (
            <p className="a-alert" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="a-btn a-btn-primary a-btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        <a href="/" className="a-login-back">
          ← Back to website
        </a>
      </form>
    </div>
  );
}

function Toasts({ toasts }) {
  return (
    <div className="a-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`a-toast is-${t.type}`}>
          <AIcon name={t.type === 'error' ? 'close' : 'check'} size={16} />
          {t.message}
        </div>
      ))}
    </div>
  );
}

function ContactPage() {
  return (
    <>
      <PageHead title="Contact section" description="Heading and messages for the contact form. Phone, email, address and map are edited under Company & SEO." />
      <SectionSettings legend="Section content" fields={contactSectionFields} />
    </>
  );
}

function SectionsPage() {
  return (
    <>
      <PageHead title={sectionsPage.title} description={sectionsPage.description} />
      {sectionsPage.fieldsets.map((fs) => (
        <SectionSettings key={fs.legend} {...fs} />
      ))}
    </>
  );
}

function renderPage(slug) {
  if (!slug) return <Dashboard />;
  if (pages[slug]) return <ContentEditor key={slug} page={pages[slug]} />;
  if (collections[slug]) return <CollectionEditor key={slug} collection={slug} config={collections[slug]} />;
  switch (slug) {
    case 'contact':
      return <ContactPage />;
    case 'sections':
      return <SectionsPage />;
    case 'theme':
      return <ThemeEditor />;
    case 'messages':
      return <Messages />;
    case 'media':
      return <Media />;
    case 'account':
      return <Account />;
    default:
      return <PageHead title="Not found" description="This admin page does not exist." />;
  }
}

export default function Admin() {
  const path = usePath();
  const slug = path.replace(/^\/admin\/?/, '').replace(/\/$/, '');
  const [user, setUser] = useState(undefined);
  const [content, setContentState] = useState(null);
  const [stats, setStats] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastId = useRef(0);

  const toast = useCallback((message, type = 'success') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'error' ? 6000 : 3000);
  }, []);

  const refreshStats = useCallback(() => {
    api.get('/api/admin/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.classList.add('admin-mode');
    api
      .get('/api/admin/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null));
    // Session expired mid-edit: drop back to the login screen.
    const onUnauthorized = () => setUser(null);
    window.addEventListener('admin:unauthorized', onUnauthorized);
    return () => {
      document.body.classList.remove('admin-mode');
      window.removeEventListener('admin:unauthorized', onUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .get('/api/admin/content')
      .then(setContentState)
      .catch((e) => toast(e.message, 'error'));
    refreshStats();
  }, [user, toast, refreshStats]);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
    if (user && slug === '') refreshStats();
  }, [slug, user, refreshStats]);

  const ctx = useMemo(
    () => ({
      user,
      content,
      stats,
      toast,
      refreshStats,
      setContent: (key, value) => setContentState((c) => ({ ...c, [key]: value })),
    }),
    [user, content, stats, toast, refreshStats],
  );

  const logout = async () => {
    await api.post('/api/admin/auth/logout').catch(() => {});
    setUser(null);
    setContentState(null);
    navigate('/admin');
  };

  if (user === undefined) {
    return (
      <div className="admin page-state">
        <span className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <AdminContext.Provider value={ctx}>
        <Login onLogin={setUser} />
        <Toasts toasts={toasts} />
      </AdminContext.Provider>
    );
  }

  const link = (to) => (e) => {
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    navigate(to);
  };

  return (
    <AdminContext.Provider value={ctx}>
      <div className="admin a-shell">
        <aside className={`a-sidebar${menuOpen ? ' is-open' : ''}`}>
          <div className="a-sidebar-head">
            <span className="a-brand-mark">
              <AIcon name="container" size={20} />
            </span>
            <div>
              <strong>{content?.site?.shortName || 'Chosen Logistics'}</strong>
              <small>Content manager</small>
            </div>
          </div>
          <nav className="a-nav" aria-label="Admin">
            {NAV.map((g) => (
              <div key={g.group} className="a-nav-group">
                <p>{g.group}</p>
                {g.items.map(([s, label, icon]) => {
                  const to = s ? `/admin/${s}` : '/admin';
                  return (
                    <a key={s} href={to} onClick={link(to)} className={slug === s ? 'is-active' : ''} aria-current={slug === s ? 'page' : undefined}>
                      <AIcon name={icon} size={18} />
                      <span>{label}</span>
                      {s === 'messages' && stats?.unread > 0 && <span className="a-count">{stats.unread}</span>}
                    </a>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="a-sidebar-foot">
            <a href="/" target="_blank" rel="noopener" className="a-btn a-btn-ghost a-btn-sm a-btn-block">
              <AIcon name="external" size={16} /> View site
            </a>
            <button type="button" className="a-btn a-btn-ghost a-btn-sm a-btn-block" onClick={logout}>
              <AIcon name="logout" size={16} /> Sign out
            </button>
          </div>
        </aside>
        {menuOpen && <div className="a-scrim" onClick={() => setMenuOpen(false)} />}
        <div className="a-main">
          <header className="a-topbar">
            <button type="button" className="a-icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <AIcon name="menu" />
            </button>
            <strong>Content manager</strong>
          </header>
          <main className="a-content">{content ? renderPage(slug) : <p className="a-empty">Loading content…</p>}</main>
        </div>
      </div>
      <Toasts toasts={toasts} />
    </AdminContext.Provider>
  );
}
