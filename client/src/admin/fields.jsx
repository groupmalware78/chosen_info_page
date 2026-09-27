import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { AIcon } from './AIcon.jsx';

export const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

// ---------- Path helpers for nested form values ("hero.primaryCta.label") ----------

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj, path, value) {
  const [head, ...rest] = path.split('.');
  const copy = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  copy[head] = rest.length ? setPath(copy[head], rest.join('.'), value) : value;
  return copy;
}

// ---------- Primitive inputs ----------

export function Field({ label, help, error, children, full, htmlFor }) {
  return (
    <div className={`a-field${full ? ' is-full' : ''}${error ? ' has-error' : ''}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <small className="a-error">{error}</small> : help ? <small className="a-help">{help}</small> : null}
    </div>
  );
}

export function TextInput({ value, onChange, multiline, rows = 4, ...props }) {
  const Tag = multiline ? 'textarea' : 'input';
  return <Tag className="a-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={multiline ? rows : undefined} {...props} />;
}

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="a-password">
      <TextInput {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="a-icon-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
      >
        <AIcon name={visible ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="a-toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="a-toggle-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function ColorInput({ value, onChange, id }) {
  const [text, setText] = useState(value || '');
  useEffect(() => setText(value || ''), [value]);
  return (
    <div className="a-color">
      <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} aria-label="Pick colour" />
      <input
        id={id}
        className="a-input"
        value={text}
        maxLength={7}
        onChange={(e) => {
          setText(e.target.value);
          if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value.toLowerCase());
        }}
        onBlur={() => setText(value || '')}
      />
    </div>
  );
}

// ---------- Image field with upload & media library ----------

export function MediaPicker({ onSelect, onClose }) {
  const { toast } = useAdmin();
  const [files, setFiles] = useState(null);
  useEffect(() => {
    api.get('/api/admin/uploads').then(setFiles).catch((e) => toast(e.message, 'error'));
  }, [toast]);
  return (
    <Modal title="Media library" onClose={onClose} wide>
      {!files ? (
        <p className="a-muted">Loading…</p>
      ) : files.length === 0 ? (
        <p className="a-muted">No images uploaded yet.</p>
      ) : (
        <div className="a-media-grid">
          {files.map((f) => (
            <button key={f.name} type="button" className="a-media-item" onClick={() => onSelect(f.url)}>
              <img src={f.url} alt={f.name} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

export function ImageInput({ value, onChange, id }) {
  const { toast } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const fileRef = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await api.upload('/api/admin/uploads', file);
      onChange(res.url);
      toast('Image uploaded');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="a-image">
      <div className="a-image-preview">{value ? <img src={value} alt="" /> : <AIcon name="image" size={28} />}</div>
      <div className="a-image-body">
        <TextInput id={id} value={value} onChange={onChange} placeholder="/uploads/… or https://…" />
        <div className="a-row">
          <button type="button" className="a-btn a-btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : 'Upload'}
          </button>
          <button type="button" className="a-btn a-btn-sm a-btn-ghost" onClick={() => setPicking(true)}>
            Library
          </button>
          {value && (
            <button type="button" className="a-btn a-btn-sm a-btn-ghost" onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => upload(e.target.files?.[0])} />
      </div>
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onSelect={(url) => {
            onChange(url);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

// ---------- Schema-driven form ----------
// Field def: { name, label, type, help, placeholder, options, fields, max, itemLabel, full }
// Types: text | textarea | markdown | number | link | image | toggle | select | color | list | stringList | group

function ListField({ def, value, onChange, errors, errorPrefix }) {
  const items = Array.isArray(value) ? value : [];
  const isStrings = def.type === 'stringList';
  const blank = isStrings ? '' : Object.fromEntries(def.fields.map((f) => [f.name, '']));
  const update = (i, v) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  const move = (i, d) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="a-list">
      {items.map((item, i) => (
        <div key={i} className="a-list-item">
          <div className="a-list-body">
            {isStrings ? (
              <TextInput value={item} onChange={(v) => update(i, v)} aria-label={`${def.itemLabel || 'Item'} ${i + 1}`} />
            ) : (
              <div className="a-grid">
                {def.fields.map((f) => (
                  <SchemaField
                    key={f.name}
                    def={f}
                    value={item?.[f.name]}
                    onChange={(v) => update(i, { ...item, [f.name]: v })}
                    errors={errors}
                    errorKey={`${errorPrefix}.${i}.${f.name}`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="a-list-actions">
            <button type="button" className="a-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
              <AIcon name="up" size={16} />
            </button>
            <button type="button" className="a-icon-btn" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">
              <AIcon name="down" size={16} />
            </button>
            <button type="button" className="a-icon-btn is-danger" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="Remove">
              <AIcon name="trash" size={16} />
            </button>
          </div>
        </div>
      ))}
      {(!def.max || items.length < def.max) && (
        <button type="button" className="a-btn a-btn-sm a-btn-ghost" onClick={() => onChange([...items, blank])}>
          <AIcon name="plus" size={16} /> Add {def.itemLabel || 'item'}
        </button>
      )}
    </div>
  );
}

export function SchemaField({ def, value, onChange, errors = {}, errorKey }) {
  const id = useId();
  const key = errorKey || def.name;
  const error = errors[key];
  const common = { id, value, onChange, placeholder: def.placeholder };
  let control;
  switch (def.type) {
    case 'textarea':
      control = <TextInput {...common} multiline rows={def.rows || 4} />;
      break;
    case 'markdown':
      control = <TextInput {...common} multiline rows={def.rows || 18} className="a-input a-mono" />;
      break;
    case 'number':
      control = <TextInput {...common} type="number" step="any" onChange={(v) => onChange(v === '' ? '' : Number(v))} />;
      break;
    case 'image':
      control = <ImageInput {...common} />;
      break;
    case 'toggle':
      return (
        <div className={`a-field${def.full ? ' is-full' : ''}`}>
          <Toggle checked={value} onChange={onChange} label={def.label} />
          {def.help && <small className="a-help">{def.help}</small>}
        </div>
      );
    case 'select':
      control = (
        <select id={id} className="a-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {def.options.map((o) => {
            const [v, l] = Array.isArray(o) ? o : [o, o];
            return (
              <option key={v} value={v}>
                {l}
              </option>
            );
          })}
        </select>
      );
      break;
    case 'color':
      control = <ColorInput {...common} />;
      break;
    case 'list':
    case 'stringList':
      return (
        <Field label={def.label} help={def.help} error={error} full>
          <ListField def={def} value={value} onChange={onChange} errors={errors} errorPrefix={key} />
        </Field>
      );
    case 'group':
      return (
        <div className="a-field is-full">
          {def.label && <span className="a-group-label">{def.label}</span>}
          <div className="a-grid a-subgrid">
            {def.fields.map((f) => (
              <SchemaField
                key={f.name}
                def={f}
                value={value?.[f.name]}
                onChange={(v) => onChange({ ...(value || {}), [f.name]: v })}
                errors={errors}
                errorKey={`${key}.${f.name}`}
              />
            ))}
          </div>
        </div>
      );
    default:
      control = <TextInput {...common} type={def.inputType || 'text'} maxLength={def.maxLength} />;
  }
  return (
    <Field label={def.label} help={def.help} error={error} full={def.full || ['textarea', 'markdown', 'image'].includes(def.type)} htmlFor={id}>
      {control}
    </Field>
  );
}

export function SchemaForm({ fieldsets, value, onChange, errors }) {
  return fieldsets.map((fs, i) => (
    <section key={i} className="a-card">
      {(fs.legend || fs.description) && (
        <header className="a-card-head">
          {fs.legend && <h2>{fs.legend}</h2>}
          {fs.description && <p className="a-muted">{fs.description}</p>}
        </header>
      )}
      <div className="a-grid">
        {fs.fields.map((def) => (
          <SchemaField
            key={def.name}
            def={def}
            value={getPath(value, def.name)}
            onChange={(v) => onChange(setPath(value, def.name, v))}
            errors={errors}
          />
        ))}
      </div>
    </section>
  ));
}

// ---------- Modal ----------

export function Modal({ title, children, onClose, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const prevFocus = document.activeElement;
    ref.current?.querySelector('input, textarea, select, button')?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="a-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`a-modal${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header className="a-modal-head">
          <h2>{title}</h2>
          <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Close">
            <AIcon name="close" size={18} />
          </button>
        </header>
        <div className="a-modal-body">{children}</div>
        {footer && <footer className="a-modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

/** Warn before leaving the page with unsaved edits. */
export function useUnsavedWarning(dirty) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
}
