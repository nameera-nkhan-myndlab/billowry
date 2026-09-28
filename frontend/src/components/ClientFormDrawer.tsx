import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Client } from '@/types';
import styles from './ClientFormDrawer.module.css';

export type ClientFormValues = {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  taxId: string | null;
  notes: string | null;
};

type Props = {
  open: boolean;
  initial: Partial<Client> | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (v: ClientFormValues) => void;
};

const empty = { name: '', email: '', phone: '', company: '', address: '', taxId: '', notes: '' };

export default function ClientFormDrawer({ open, initial, saving, error, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(empty);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || '',
        email: initial?.email || '',
        phone: initial?.phone || '',
        company: initial?.company || '',
        address: initial?.address || '',
        taxId: initial?.taxId || '',
        notes: initial?.notes || '',
      });
      setLocalError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setLocalError('Name is required.');
      return;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setLocalError('Enter a valid email.');
      return;
    }
    const n = (v: string) => (v.trim() ? v.trim() : null);
    onSubmit({
      name: form.name.trim(),
      email: n(form.email),
      phone: n(form.phone),
      company: n(form.company),
      address: n(form.address),
      taxId: n(form.taxId),
      notes: n(form.notes),
    });
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <form className={styles.panel} onClick={(e) => e.stopPropagation()} onSubmit={submit} aria-label="Client form">
        <div className={styles.head}>
          <h2>{initial?.id ? 'Edit Client' : 'New Client'}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close form"><X size={18} /></button>
        </div>
        <div className={styles.body}>
          <label>Name *<input value={form.name} onChange={set('name')} maxLength={255} aria-label="Name" /></label>
          <div className={styles.grid}>
            <label>Email<input value={form.email} onChange={set('email')} maxLength={255} aria-label="Email" /></label>
            <label>Phone<input value={form.phone} onChange={set('phone')} maxLength={50} aria-label="Phone" /></label>
            <label>Company<input value={form.company} onChange={set('company')} maxLength={255} aria-label="Company" /></label>
            <label>Tax ID<input value={form.taxId} onChange={set('taxId')} maxLength={100} aria-label="Tax ID" /></label>
          </div>
          <label>Address<textarea rows={3} value={form.address} onChange={set('address')} aria-label="Address" /></label>
          <label>Notes<textarea rows={3} value={form.notes} onChange={set('notes')} aria-label="Notes" /></label>
          {(localError || error) && <div className={styles.error} role="alert">{localError || error}</div>}
        </div>
        <div className={styles.foot}>
          <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.save} disabled={saving}>{saving ? 'Saving...' : 'Save Client'}</button>
        </div>
      </form>
    </div>
  );
}