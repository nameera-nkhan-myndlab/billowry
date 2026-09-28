import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Pencil, Trash2, X, Users, Mail, Phone, Building2 } from 'lucide-react';
import apiClient from '@/api/client';
import type { Client } from '@/types';
import styles from './ClientsPage.module.css';

export type ClientListItem = Pick<Client, 'id' | 'name' | 'email' | 'phone' | 'company' | 'createdAt'> & {
  invoiceCount: number;
};

type ClientForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  taxId: string;
  notes: string;
};

const emptyForm: ClientForm = { name: '', email: '', phone: '', company: '', address: '', taxId: '', notes: '' };

function toPayload(f: ClientForm) {
  const n = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    name: f.name.trim(),
    email: n(f.email),
    phone: n(f.phone),
    company: n(f.company),
    address: n(f.address),
    taxId: n(f.taxId),
    notes: n(f.notes),
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/clients');
      setClients(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setError('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.email, c.company, c.phone].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [clients, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = async (id: number) => {
    setEditingId(id);
    setFormError(null);
    setModalOpen(true);
    try {
      const res = await apiClient.get(`/api/clients/${id}`);
      const c = res?.data || {};
      setForm({
        name: c.name || '',
        email: c.email || '',
        phone: c.phone || '',
        company: c.company || '',
        address: c.address || '',
        taxId: c.taxId || '',
        notes: c.notes || '',
      });
    } catch {
      setFormError('Failed to load client details.');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setFormError('Please enter a valid email.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) await apiClient.put(`/api/clients/${editingId}`, toPayload(form));
      else await apiClient.post('/api/clients', toPayload(form));
      setModalOpen(false);
      await load();
    } catch {
      setFormError('Failed to save client.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: ClientListItem) => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete ${c.name}? Their invoices will be kept.`)) return;
    try {
      await apiClient.delete(`/api/clients/${c.id}`);
      setClients((prev) => prev.filter((x) => x.id !== c.id));
    } catch {
      setError('Failed to delete client.');
    }
  };

  const set = (k: keyof ClientForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clients</h1>
          <p className={styles.subtitle}>Manage the people and companies you bill.</p>
        </div>
        <button className={styles.primaryBtn} onClick={openCreate}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search clients"
            />
          </div>
          <span className={styles.count}>{filtered.length} clients</span>
        </div>

        {loading ? (
          <div className={styles.state}>Loading clients...</div>
        ) : error ? (
          <div className={styles.stateError}>
            {error}{' '}
            <button className={styles.linkBtn} onClick={load}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>
            <Users size={32} />
            <p>No clients found.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Invoices</th>
                  <th>Added</th>
                  <th className={styles.right}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>{(c.name || '?').charAt(0).toUpperCase()}</div>
                        <div>
                          <div className={styles.name}>{c.name}</div>
                          <div className={styles.muted}>
                            {c.company ? (<><Building2 size={12} /> {c.company}</>) : '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.muted}>{c.email ? (<><Mail size={12} /> {c.email}</>) : 'No email'}</div>
                      <div className={styles.muted}>{c.phone ? (<><Phone size={12} /> {c.phone}</>) : ''}</div>
                    </td>
                    <td>
                      <Link href={`/invoices?clientId=${c.id}`} className={styles.pill}>
                        {c.invoiceCount ?? 0}
                      </Link>
                    </td>
                    <td className={styles.muted}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className={styles.right}>
                      <button className={styles.iconBtn} aria-label={`Edit ${c.name}`} onClick={() => openEdit(c.id)}>
                        <Pencil size={15} />
                      </button>
                      <button className={styles.iconBtnDanger} aria-label={`Delete ${c.name}`} onClick={() => remove(c)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={styles.backdrop} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} role="dialog" aria-label="Client form" onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Edit Client' : 'New Client'}</h2>
              <button className={styles.iconBtn} aria-label="Close" onClick={() => setModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submit} className={styles.form}>
              <label>Name *<input value={form.name} onChange={set('name')} maxLength={255} /></label>
              <div className={styles.row}>
                <label>Email<input value={form.email} onChange={set('email')} maxLength={255} /></label>
                <label>Phone<input value={form.phone} onChange={set('phone')} maxLength={50} /></label>
              </div>
              <div className={styles.row}>
                <label>Company<input value={form.company} onChange={set('company')} maxLength={255} /></label>
                <label>Tax ID<input value={form.taxId} onChange={set('taxId')} maxLength={100} /></label>
              </div>
              <label>Address<textarea rows={2} value={form.address} onChange={set('address')} /></label>
              <label>Notes<textarea rows={2} value={form.notes} onChange={set('notes')} /></label>
              {formError && <div className={styles.formError}>{formError}</div>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}