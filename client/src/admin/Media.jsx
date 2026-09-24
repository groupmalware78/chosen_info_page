import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { AIcon } from './AIcon.jsx';
import { useAdmin } from './fields.jsx';
import { PageHead } from './ContentEditor.jsx';

const kb = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function Media() {
  const { toast } = useAdmin();
  const [files, setFiles] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(() => {
    api.get('/api/admin/uploads').then(setFiles).catch((e) => toast(e.message, 'error'));
  }, [toast]);
  useEffect(load, [load]);

  const upload = async (list) => {
    setBusy(true);
    for (const file of list) {
      try {
        await api.upload('/api/admin/uploads', file);
      } catch (e) {
        toast(`${file.name}: ${e.message}`, 'error');
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
    load();
  };

  const remove = async (f) => {
    if (!window.confirm('Delete this image? Any section still using it will show nothing.')) return;
    try {
      await api.del(`/api/admin/uploads/${encodeURIComponent(f.name)}`);
      setFiles((l) => l.filter((x) => x.name !== f.name));
      toast('Image deleted');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const copy = async (f) => {
    try {
      await navigator.clipboard.writeText(f.url);
      toast('Image path copied');
    } catch {
      toast(f.url);
    }
  };

  return (
    <>
      <PageHead
        title="Media library"
        description="Images used across the site. JPEG, PNG, WebP or GIF, up to 5 MB each."
        actions={
          <button type="button" className="a-btn a-btn-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
            <AIcon name="plus" size={18} /> {busy ? 'Uploading…' : 'Upload images'}
          </button>
        }
      />
      <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => upload([...e.target.files])} />
      <section
        className="a-card a-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload([...e.dataTransfer.files]);
        }}
      >
        {!files ? (
          <p className="a-empty">Loading…</p>
        ) : files.length === 0 ? (
          <p className="a-empty">Drag and drop images here, or use the Upload button.</p>
        ) : (
          <div className="a-media-grid">
            {files.map((f) => (
              <figure key={f.name} className="a-media-card">
                <img src={f.url} alt={f.name} loading="lazy" />
                <figcaption>
                  <span className="a-muted">{kb(f.size)}</span>
                  <span className="a-row">
                    <button type="button" className="a-icon-btn" onClick={() => copy(f)} aria-label="Copy path">
                      <AIcon name="copy" size={16} />
                    </button>
                    <button type="button" className="a-icon-btn is-danger" onClick={() => remove(f)} aria-label="Delete">
                      <AIcon name="trash" size={16} />
                    </button>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
