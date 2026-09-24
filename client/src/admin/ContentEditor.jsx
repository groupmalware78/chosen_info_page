import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { SchemaForm, useAdmin, useUnsavedWarning } from './fields.jsx';

/** Save bar shared by editors: shows dirty state and save/discard actions. */
export function SaveBar({ dirty, saving, onSave, onReset, label = 'Save changes' }) {
  return (
    <div className={`a-savebar${dirty ? ' is-dirty' : ''}`}>
      <span className="a-muted">{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
      <div className="a-row">
        {dirty && (
          <button type="button" className="a-btn a-btn-ghost" onClick={onReset} disabled={saving}>
            Discard
          </button>
        )}
        <button type="button" className="a-btn a-btn-primary" onClick={onSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : label}
        </button>
      </div>
    </div>
  );
}

/** Hook: edit a singleton content key (site, hero, sections…) with draft/save/reset. */
export function useContentDraft(key) {
  const { content, setContent, toast } = useAdmin();
  const saved = content[key];
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  useUnsavedWarning(dirty);

  useEffect(() => setDraft(saved), [saved]);

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const next = await api.put(`/api/admin/content/${key}`, draft);
      setContent(key, next);
      toast('Changes published');
    } catch (e) {
      setErrors(e.fields || {});
      toast(e.fields ? 'Please fix the highlighted fields' : e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return { draft, setDraft, errors, saving, dirty, save, reset: () => (setDraft(saved), setErrors({})) };
}

export function PageHead({ title, description, actions }) {
  return (
    <header className="a-page-head">
      <div>
        <h1>{title}</h1>
        {description && <p className="a-muted">{description}</p>}
      </div>
      {actions && <div className="a-row">{actions}</div>}
    </header>
  );
}

export function ContentEditor({ page }) {
  const { draft, setDraft, errors, saving, dirty, save, reset } = useContentDraft(page.key);
  return (
    <>
      <PageHead title={page.title} description={page.description} />
      <SchemaForm fieldsets={page.fieldsets} value={draft} onChange={setDraft} errors={errors} />
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}

/** Edits a subset of the shared "sections" key (section headings, visibility, rate factors). */
export function SectionSettings({ legend, description, fields }) {
  const { draft, setDraft, errors, saving, dirty, save, reset } = useContentDraft('sections');
  return (
    <>
      <SchemaForm fieldsets={[{ legend, description, fields }]} value={draft} onChange={setDraft} errors={errors} />
      {dirty && <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} label="Save section settings" />}
    </>
  );
}
