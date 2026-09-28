import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Users, Pencil, Trash2, X, Mail, Phone, Building2 } from 'lucide-react';
import apiClient from '@/api/client';
import type { Client } from '@/types';
import ClientFormDrawer, { ClientFormValues } from '@/components/ClientFormDrawer';
import styles from './clients.module.css';

export type ClientListItem = Pick<Client, 'id' | 'name' | 'email' | 'phone' | 'company' | 'createdAt'> & {
  invoiceCount: number;
};

type ClientDetail = Client & {
  invoices: {
    id: number;
    invoiceNumber: string;
    status: string;
    issueDate: string;
    dueDate?: string | null;
    currency: string;
    total: number;
  }[];
};

function formatDate(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

function money(v: number, c: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: c || 'USD' }).format(Number(v) || 0);
  } catch {
    return `${c} ${(Number(v) || 0).toFixed(2)}`;
  }
}

export default function Clients() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClientDetail | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await apiClient.get(`/api/clients/${id}`);
      setDetail(res.data);
    } catch {
      setError('Failed to load client details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (c: ClientDetail) => {
    setEditing(c);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ClientFormValues) => {
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const res = await apiClient.put(`/api/clients/${editing.id}`, values);
        if (detail && detail.id === editing.id) setDetail({ ...detail, ...res.data });
      } else {
        await apiClient.post('/api/clients', values);
      }
      setFormOpen(false);
      await load();
    } catch {
      setFormError('Could not save client. Please check the fields and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this client? Their invoices will be kept.')) return;
    try {
      await apiClient.delete(`/api/clients/${id}`);
      setDetail(null);
      await load();
    } catch {
      setError('Failed to delete client.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clients</h1>
          <p className={styles.subtitle}>Manage your clients and billing contacts.</p>
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
              className={styles.search}
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
          <div className={styles.stateError} role="alert">
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
                  <th>Company</th>
                  <th>Phone</th>
                  <th className={styles.right}>Invoices</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => openDetail(c.id)} className={styles.row}>
                    <td>
                      <div className={styles.nameCell}>
                        <span className={styles.avatar}>{(c.name || '?').charAt(0).toUpperCase()}</span>
                        <div>
                          <div className={styles.name}>{c.name}</div>
                          <div className={styles.muted}>{c.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.company || <span className={styles.muted}>—</span>}</td>
                    <td>{c.phone || <span className={styles.muted}>—</span>}</td>
                    <td className={styles.right}><span className={styles.pill}>{c.invoiceCount ?? 0}</span></td>
                    <td>{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(detail || detailLoading) && (
        <div className={styles.backdrop} onClick={() => setDetail(null)}>
          <aside className={styles.drawer} onClick={(e) => e.stopPropagation()} aria-label="Client details">
            {detailLoading || !detail ? (
              <div className={styles.state}>Loading...</div>
            ) : (
              <>
                <div className={styles.drawerHeader}>
                  <span className={styles.avatarLg}>{detail.name.charAt(0).toUpperCase()}</span>
                  <div className={styles.drawerTitleWrap}>
                    <h2 className={styles.drawerTitle}>{detail.name}</h2>
                    <div className={styles.drawerSub}>{detail.company || 'Individual'}</div>
                  </div>
                  <button className={styles.iconBtn} onClick={() => setDetail(null)} aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
                <div className={styles.drawerBody}>
                  <div className={styles.actions}>
                    <button className={styles.outlineBtn} onClick={() => openEdit(detail)}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button className={styles.dangerBtn} onClick={() => handleDelete(detail.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                  <dl className={styles.info}>
                    <div><dt><Mail size={14} /> Email</dt><dd>{detail.email || '—'}</dd></div>
                    <div><dt><Phone size={14} /> Phone</dt><dd>{detail.phone || '—'}</dd></div>
                    <div><dt><Building2 size={14} /> Company</dt><dd>{detail.company || '—'}</dd></div>
                    <div><dt>Tax ID</dt><dd>{detail.taxId || '—'}</dd></div>
                    <div><dt>Address</dt><dd className={styles.pre}>{detail.address || '—'}</dd></div>
                    <div><dt>Notes</dt><dd className={styles.pre}>{detail.notes || '—'}</dd></div>
                  </dl>
                  <h3 className={styles.sectionTitle}>Invoices</h3>
                  {(detail.invoices || []).length === 0 ? (
                    <p className={styles.muted}>No invoices for this client yet.</p>
                  ) : (
                    <ul className={styles.invList}>
                      {detail.invoices.map((inv) => (
                        <li key={inv.id}>
                          <Link href={`/invoices/${inv.id}`} className={styles.invLink}>
                            <span className={styles.name}>{inv.invoiceNumber}</span>
                            <span className={`${styles.status} ${styles['s_' + inv.status] || ''}`}>{inv.status}</span>
                            <span className={styles.muted}>{formatDate(inv.issueDate)}</span>
                            <span className={styles.amount}>{money(inv.total, inv.currency)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      <ClientFormDrawer
        open={formOpen}
        initial={editing}
        saving={saving}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
