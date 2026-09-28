import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { RecentInvoice } from '@/pages/index';
import { formatDate, formatMoney } from './format';
import styles from './RecentInvoicesTable.module.css';

export default function RecentInvoicesTable({ invoices }: { invoices: RecentInvoice[] }) {
  const router = useRouter();
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Recent Invoices</h2>
        <Link href="/invoices" className={styles.link}>View all</Link>
      </div>
      {invoices.length === 0 ? (
        <div className={styles.empty}>No invoices yet.</div>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>Invoice</th><th>Client</th><th>Date</th><th>Status</th><th className={styles.right}>Total</th></tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)} data-testid={`row-${inv.id}`}>
                  <td className={styles.bold}>{inv.invoiceNumber}</td>
                  <td>{inv.clientName || <span className={styles.muted}>No client</span>}</td>
                  <td>{formatDate(inv.issueDate)}</td>
                  <td><span className={`${styles.badge} ${styles[inv.status] || ''}`}>{inv.status}</span></td>
                  <td className={`${styles.right} ${styles.bold}`}>{formatMoney(inv.total, inv.currency || 'USD')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}