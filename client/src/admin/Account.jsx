import { useState } from 'react';
import { api } from '../lib/api.js';
import { Field, TextInput, useAdmin } from './fields.jsx';
import { PageHead } from './ContentEditor.jsx';

export function Account() {
  const { user, toast } = useAdmin();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return setErrors({ confirm: 'Passwords do not match' });
    setSaving(true);
    setErrors({});
    try {
      await api.post('/api/admin/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast('Password updated. Other sessions were signed out.');
    } catch (err) {
      setErrors(err.fields || {});
      if (!err.fields) toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (v) => setForm({ ...form, [k]: v });

  return (
    <>
      <PageHead title="Account" description={`Signed in as ${user.email}`} />
      <form className="a-card a-narrow" onSubmit={submit}>
        <header className="a-card-head">
          <h2>Change password</h2>
        </header>
        <div className="a-stack">
          <Field label="Current password" error={errors.currentPassword} htmlFor="pw-cur">
            <TextInput id="pw-cur" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} required />
          </Field>
          <Field label="New password" help="At least 10 characters." error={errors.newPassword} htmlFor="pw-new">
            <TextInput id="pw-new" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} required minLength={10} />
          </Field>
          <Field label="Confirm new password" error={errors.confirm} htmlFor="pw-conf">
            <TextInput id="pw-conf" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} required />
          </Field>
          <div>
            <button type="submit" className="a-btn a-btn-primary" disabled={saving}>
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
