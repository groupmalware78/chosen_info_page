import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { AIcon } from './AIcon.jsx';
import { useAdmin } from './fields.jsx';
import { PageHead } from './ContentEditor.jsx';

export function formatDate(sqlDate) {
  const d = new Date(`${sqlDate.replace(' ', 'T')}Z`);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function Messages() {
  const { toast, refreshStats } = useAdmin();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(() => {
    api
      .get(`/api/admin/messages?page=${page}&filter=${filter}`)
      .then(setData)
      .catch((e) => toast(e.message, 'error'));
  }, [page, filter, toast]);

  useEffect(load, [load]);

  const setRead = async (m, is_read) => {
    await api.patch(`/api/admin/messages/${m.id}`, { is_read });
    setData((d) => ({ ...d, items: d.items.map((i) => (i.id === m.id ? { ...i, is_read: is_read ? 1 : 0 } : i)) }));
    refreshStats();
  };

  const open = (m) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.is_read) setRead(m, true).catch(() => {});
  };

  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    try {
      await api.del(`/api/admin/messages/${m.id}`);
      toast('Message deleted');
      load();
      refreshStats();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHead
        title="Enquiries"
        description="Messages sent through the contact form."
        actions={
          <a className="a-btn a-btn-ghost" href="/api/admin/messages.csv" download>
            <AIcon name="download" size={18} /> Export CSV
          </a>
        }
      />
      <div className="a-tabs" role="tablist">
        {[
          ['all', 'All'],
          ['unread', 'Unread'],
        ].map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={filter === k}
            className={filter === k ? 'is-active' : ''}
            onClick={() => {
              setFilter(k);
              setPage(1);
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <section className="a-card a-card-flush">
        {!data ? (
          <p className="a-empty">Loading…</p>
        ) : data.items.length === 0 ? (
          <p className="a-empty">No messages {filter === 'unread' ? 'unread' : 'yet'}.</p>
        ) : (
          <ul className="a-messages">
            {data.items.map((m) => (
              <li key={m.id} className={`a-message${m.is_read ? '' : ' is-unread'}${openId === m.id ? ' is-open' : ''}`}>
                <button type="button" className="a-message-head" onClick={() => open(m)} aria-expanded={openId === m.id}>
                  <span className="a-dot" aria-label={m.is_read ? 'Read' : 'Unread'} />
                  <span className="a-message-from">
                    <strong>{m.name}</strong>
                    <span className="a-muted">{m.email}</span>
                  </span>
                  <span className="a-message-snippet a-muted">{m.service ? `[${m.service}] ` : ''}{m.message}</span>
                  <time className="a-muted">{formatDate(m.created_at)}</time>
                </button>
                {openId === m.id && (
                  <div className="a-message-body">
                    <dl className="a-meta">
                      {m.phone && (
                        <>
                          <dt>Phone</dt>
                          <dd><a href={`tel:${m.phone}`}>{m.phone}</a></dd>
                        </>
                      )}
                      {m.company && (
                        <>
                          <dt>Company</dt>
                          <dd>{m.company}</dd>
                        </>
                      )}
                      {m.service && (
                        <>
                          <dt>Service</dt>
                          <dd>{m.service}</dd>
                        </>
                      )}
                    </dl>
                    <p className="a-pre">{m.message}</p>
                    <div className="a-row">
                      <a className="a-btn a-btn-primary a-btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: Your enquiry')}`}>
                        <AIcon name="mail" size={16} /> Reply
                      </a>
                      <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={() => setRead(m, !m.is_read)}>
                        Mark as {m.is_read ? 'unread' : 'read'}
                      </button>
                      <button type="button" className="a-btn a-btn-danger a-btn-sm" onClick={() => remove(m)}>
                        <AIcon name="trash" size={16} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {data && data.pages > 1 && (
        <nav className="a-pager" aria-label="Pagination">
          <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span className="a-muted">
            Page {data.page} of {data.pages}
          </span>
          <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </nav>
      )}
    </>
  );
}
