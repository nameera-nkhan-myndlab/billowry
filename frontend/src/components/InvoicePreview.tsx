import React from 'react';
import type { InvoiceDetailData } from '@/pages/invoices/[id]';
import styles from './InvoicePreview.module.css';

export function formatMoney(value: unknown, currency: string) {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(isNaN(n) ? 0 : n);
  } catch {
    return `${currency} ${(isNaN(n) ? 0 : n).toFixed(2)}`;
  }
}

function formatDate(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function InvoicePreview({ invoice }: { invoice: InvoiceDetailData }) {
  const items = [...(invoice.items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const c = invoice.client;
  return (
    <article className={styles.sheet} data-testid="invoice-preview">
      <header className={styles.top}>
        <div>
          <div className={styles.brand}>Billowry</div>
          <div className={styles.muted}>Invoice #{invoice.invoiceNumber}</div>
        </div>
        <span className={`${styles.badge} ${styles[invoice.status] || ''}`}>{invoice.status}</span>
      </header>
      <section className={styles.meta}>
        <div>
          <div className={styles.label}>Bill to</div>
          {c ? (
            <>
              <div className={styles.strong}>{c.name}</div>
              {c.company && <div>{c.company}</div>}
              {c.address && <div className={styles.pre}>{c.address}</div>}
              {c.email && <div className={styles.muted}>{c.email}</div>}
              {c.phone && <div className={styles.muted}>{c.phone}</div>}
              {c.taxId && <div className={styles.muted}>Tax ID: {c.taxId}</div>}
            </>
          ) : (
            <div className={styles.muted}>No client</div>
          )}
        </div>
        <div className={styles.dates}>
          <div><span className={styles.label}>Issued</span> {formatDate(invoice.issueDate)}</div>
          <div><span className={styles.label}>Due</span> {formatDate(invoice.dueDate)}</div>
          <div><span className={styles.label}>Currency</span> {invoice.currency}</div>
        </div>
      </section>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Description</th><th className={styles.r}>Qty</th><th className={styles.r}>Unit price</th><th className={styles.r}>Amount</th></tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4} className={styles.muted}>No line items</td></tr>
            ) : items.map((it) => (
              <tr key={it.id}>
                <td>{it.description}</td>
                <td className={styles.r}>{Number(it.quantity)}</td>
                <td className={styles.r}>{formatMoney(it.unitPrice, invoice.currency)}</td>
                <td className={styles.r}>{formatMoney(it.amount, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className={styles.totals}>
        <div><span>Subtotal</span><span>{formatMoney(invoice.subtotal, invoice.currency)}</span></div>
        <div><span>Tax ({Number(invoice.taxRate)}%)</span><span>{formatMoney(invoice.taxAmount, invoice.currency)}</span></div>
        <div><span>Discount</span><span>-{formatMoney(invoice.discount, invoice.currency)}</span></div>
        <div className={styles.grand}><span>Total</span><span data-testid="invoice-total">{formatMoney(invoice.total, invoice.currency)}</span></div>
      </section>
      {(invoice.notes || invoice.terms) && (
        <footer className={styles.foot}>
          {invoice.notes && <div><div className={styles.label}>Notes</div><p className={styles.pre}>{invoice.notes}</p></div>}
          {invoice.terms && <div><div className={styles.label}>Terms</div><p className={styles.pre}>{invoice.terms}</p></div>}
        </footer>
      )}
    </article>
  );
}