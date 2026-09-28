import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import apiClient from '@/api/client';
import type { Invoice, InvoiceItem, Client } from '@/types';
import InvoicePreview from '@/components/InvoicePreview';
import InvoiceActions from '@/components/InvoiceActions';
import styles from './InvoiceDetail.module.css';

export type InvoiceDetailData = Omit<Invoice, 'createdAt' | 'updatedAt' | 'issueDate' | 'dueDate'> & {
  issueDate: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: Pick<Client, 'id' | 'name' | 'email' | 'phone' | 'company' | 'address' | 'taxId'> | null;
  items: Pick<InvoiceItem, 'id' | 'description' | 'quantity' | 'unitPrice' | 'amount' | 'position'>[];
};

export default function InvoiceDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<InvoiceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id || Array.isArray(id)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/invoices/${id}`);
      setInvoice(res?.data ?? null);
    } catch (e: any) {
      setError(e?.response?.status === 404 ? 'Invoice not found.' : 'Failed to load invoice.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (status: string) => {
    if (!invoice) return;
    setBusy(true);
    try {
      const res = await apiClient.patch(`/api/invoices/${invoice.id}/status`, { status });
      const d = res?.data;
      setInvoice({ ...invoice, status: d?.status ?? status, updatedAt: d?.updatedAt ?? invoice.updatedAt } as InvoiceDetailData);
    } catch {
      setError('Failed to update status.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this invoice?')) return;
    setBusy(true);
    try {
      await apiClient.delete(`/api/invoices/${invoice.id}`);
      router.push('/invoices');
    } catch {
      setError('Failed to delete invoice.');
      setBusy(false);
    }
  };

  if (loading) return <div className={styles.state} role="status">Loading invoice…</div>;
  if (error && !invoice)
    return (
      <div className={styles.state}>
        <p className={styles.error}>{error}</p>
        <Link href="/invoices" className={styles.back}>← Back to invoices</Link>
      </div>
    );
  if (!invoice) return <div className={styles.state}>No invoice data.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/invoices" className={styles.back}>← Back to invoices</Link>
          <h1 className={styles.title}>Invoice {invoice.invoiceNumber}</h1>
        </div>
        <InvoiceActions
          status={invoice.status}
          disabled={busy}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <InvoicePreview invoice={invoice} />
    </div>
  );
}