import { AIcon } from './AIcon.jsx';
import { useAdmin } from './fields.jsx';
import { PageHead } from './ContentEditor.jsx';
import { formatDate } from './Messages.jsx';
import { navigate } from '../lib/router.js';

export function Dashboard() {
  const { stats, content } = useAdmin();
  const cards = [
    ['Unread enquiries', stats?.unread, 'inbox', '/admin/messages'],
    ['Rates published', stats?.rates, 'tag', '/admin/rates'],
    ['Services', stats?.services, 'box', '/admin/services'],
    ['FAQs', stats?.faqs, 'help', '/admin/faqs'],
  ];
  const go = (to) => (e) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <>
      <PageHead
        title={`Welcome back`}
        description={`Manage the ${content.site.companyName || 'company'} website. Changes go live as soon as you save.`}
        actions={
          <a className="a-btn a-btn-ghost" href="/" target="_blank" rel="noopener">
            <AIcon name="external" size={18} /> View site
          </a>
        }
      />
      <div className="a-stats">
        {cards.map(([label, value, icon, to]) => (
          <a key={label} href={to} onClick={go(to)} className="a-stat">
            <span className="a-stat-icon">
              <AIcon name={icon} />
            </span>
            <span>
              <strong>{value ?? '–'}</strong>
              <small>{label}</small>
            </span>
          </a>
        ))}
      </div>
      <div className="a-dash-grid">
        <section className="a-card">
          <header className="a-card-head a-row-between">
            <h2>Latest enquiries</h2>
            <a href="/admin/messages" onClick={go('/admin/messages')} className="a-link">
              View all
            </a>
          </header>
          {!stats ? (
            <p className="a-muted">Loading…</p>
          ) : stats.recent.length === 0 ? (
            <p className="a-muted">No enquiries yet. They will appear here when visitors use the contact form.</p>
          ) : (
            <ul className="a-recent">
              {stats.recent.map((m) => (
                <li key={m.id}>
                  <span className={`a-dot${m.is_read ? ' is-read' : ''}`} />
                  <div>
                    <strong>{m.name}</strong> <span className="a-muted">· {formatDate(m.created_at)}</span>
                    <p className="a-muted a-clamp">{m.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="a-card">
          <header className="a-card-head">
            <h2>Quick edits</h2>
          </header>
          <ul className="a-quick">
            {[
              ['/admin/hero', 'hero', 'Update the hero headline'],
              ['/admin/rates', 'tag', 'Adjust co-loading rates'],
              ['/admin/theme', 'palette', 'Change site colours & fonts'],
              ['/admin/legal', 'file', 'Edit terms & privacy policy'],
              ['/admin/site', 'settings', 'Contact details & SEO'],
            ].map(([to, icon, label]) => (
              <li key={to}>
                <a href={to} onClick={go(to)}>
                  <AIcon name={icon} size={18} />
                  {label}
                  <AIcon name="arrow" size={16} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
