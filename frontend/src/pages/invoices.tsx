import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import apiClient from '@/api/client';
import type { Invoice } from '@/types';
import InvoiceFilters from '@/components/InvoiceFilters';
import InvoiceTable, { InvoiceListRow } from '@/components/InvoiceTable';
import NewInvoiceButton from '@/components/NewInvoiceButton';
import styles from './invoices.module.css';

export type { Invoice };

export default function Invoices() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/invoices', { params: status ? { status } : {} });
      setInvoices(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (i) =>
        (i.invoiceNumber || '').toLowerCase().includes(q) ||
        (i.clientName || '').toLowerCase().includes(q)
    );
  }, [invoices, search]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>Create, track and manage all your invoices.</p>
        </div>
        <NewInvoiceButton />
      </div>
      <div className={styles.card}>
        <InvoiceFilters
          search={search}
          status={status}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
        />
        {loading ? (
          <div className={styles.state}>Loading invoices…</div>
        ) : error ? (
          <div className={styles.error}>
            {error}{' '}
            <button className={styles.retry} onClick={load}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>No invoices found.</div>
        ) : (
          <InvoiceTable invoices={filtered} onRowClick={(id) => router.push(`/invoices/${id}`)} />
        )}
      </div>
    </div>
  );
}