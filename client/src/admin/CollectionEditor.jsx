import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { AIcon } from './AIcon.jsx';
import { Modal, SchemaField, useAdmin } from './fields.jsx';
import { PageHead, SectionSettings } from './ContentEditor.jsx';

function truncate(s, n) {
  s = String(s ?? '');
  return n && s.length > n ? `${s.slice(0, n)}…` : s;
}

function ItemForm({ config, item, onClose, onSaved, collection }) {
  const { toast } = useAdmin();
  const [draft, setDraft] = useState(item);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isNew = !item.id;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const { id, sort_order, ...body } = draft;
      const saved = isNew
        ? await api.post(`/api/admin/collections/${collection}`, body)
        : await api.put(`/api/admin/collections/${collection}/${id}`, { ...body, sort_order });
      toast(isNew ? `${config.itemName[0].toUpperCase()}${config.itemName.slice(1)} added` : 'Changes published');
      onSaved(saved);
    } catch (err) {
      setErrors(err.fields || {});
      toast(err.fields ? 'Please fix the highlighted fields' : err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isNew ? `Add ${config.itemName}` : `Edit ${config.itemName}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="a-btn a-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="item-form" className="a-btn a-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isNew ? `Add ${config.itemName}` : 'Save'}
          </button>
        </>
      }
    >
      <form id="item-form" onSubmit={submit} className="a-grid">
        {config.fields.map((def) => (
          <div key={def.name} className={def.full || def.type === 'textarea' ? 'a-span-full' : undefined}>
            <SchemaField def={def} value={draft[def.name]} onChange={(v) => setDraft({ ...draft, [def.name]: v })} errors={errors} />
            {def.iconPreview && (
              <span className="a-icon-preview">
                <AIcon name={draft[def.name]} size={28} />
              </span>
            )}
          </div>
        ))}
      </form>
    </Modal>
  );
}

export function CollectionEditor({ collection, config }) {
  const { toast } = useAdmin();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    api.get(`/api/admin/collections/${collection}`).then(setItems).catch((e) => toast(e.message, 'error'));
  }, [collection, toast]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  const persistOrder = async (next) => {
    setItems(next);
    try {
      await api.post(`/api/admin/collections/${collection}/reorder`, { ids: next.map((i) => i.id) });
    } catch (e) {
      toast(e.message, 'error');
      load();
    }
  };

  const move = (idx, d) => {
    const next = [...items];
    [next[idx], next[idx + d]] = [next[idx + d], next[idx]];
    persistOrder(next);
  };

  const togglePublished = async (item) => {
    const { id, ...body } = item;
    try {
      const saved = await api.put(`/api/admin/collections/${collection}/${id}`, { ...body, published: !item.published });
      setItems((list) => list.map((i) => (i.id === id ? saved : i)));
      toast(saved.published ? 'Published' : 'Hidden from site');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete this ${config.itemName}? This cannot be undone.`)) return;
    try {
      await api.del(`/api/admin/collections/${collection}/${item.id}`);
      setItems((list) => list.filter((i) => i.id !== item.id));
      toast('Deleted');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const duplicate = (item) => {
    const { id, sort_order, ...rest } = item;
    setEditing({ ...rest, published: 0 });
  };

  return (
    <>
      <PageHead
        title={config.title}
        description={config.description}
        actions={
          <button type="button" className="a-btn a-btn-primary" onClick={() => setEditing({ ...config.blank })}>
            <AIcon name="plus" size={18} /> Add {config.itemName}
          </button>
        }
      />

      <section className="a-card a-card-flush">
        {!items ? (
          <p className="a-empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="a-empty">No {config.itemName}s yet. Add your first one.</p>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th className="a-col-order" aria-label="Order" />
                  {config.columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th>Status</th>
                  <th className="a-col-actions" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className={item.published ? '' : 'is-hidden'}>
                    <td className="a-col-order">
                      <div className="a-order">
                        <button type="button" className="a-icon-btn" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up">
                          <AIcon name="up" size={15} />
                        </button>
                        <button type="button" className="a-icon-btn" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} aria-label="Move down">
                          <AIcon name="down" size={15} />
                        </button>
                      </div>
                    </td>
                    {config.columns.map((c) => (
                      <td key={c.key} className={c.primary ? 'a-cell-primary' : 'a-muted'}>
                        {c.primary ? (
                          <button type="button" className="a-link" onClick={() => setEditing(item)}>
                            {c.render ? c.render(item) : truncate(item[c.key], c.truncate)}
                          </button>
                        ) : c.render ? (
                          c.render(item)
                        ) : (
                          truncate(item[c.key], c.truncate) || '—'
                        )}
                      </td>
                    ))}
                    <td>
                      <button type="button" className={`a-badge ${item.published ? 'is-success' : ''}`} onClick={() => togglePublished(item)} title="Toggle visibility">
                        {item.published ? 'Published' : 'Hidden'}
                      </button>
                    </td>
                    <td className="a-col-actions">
                      <div className="a-row">
                        <button type="button" className="a-icon-btn" onClick={() => setEditing(item)} aria-label="Edit">
                          <AIcon name="edit" size={16} />
                        </button>
                        <button type="button" className="a-icon-btn" onClick={() => duplicate(item)} aria-label="Duplicate">
                          <AIcon name="copy" size={16} />
                        </button>
                        <button type="button" className="a-icon-btn is-danger" onClick={() => remove(item)} aria-label="Delete">
                          <AIcon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {config.section && <SectionSettings legend="Section heading & settings" fields={config.section.fields} />}

      {editing && (
        <ItemForm
          config={config}
          collection={collection}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((list) => (list.some((i) => i.id === saved.id) ? list.map((i) => (i.id === saved.id ? saved : i)) : [...list, saved]));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
