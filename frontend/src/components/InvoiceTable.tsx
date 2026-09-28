import React from 'react';
import StatusBadge from './StatusBadge';
import styles from './InvoiceTable.module.css';

export interface InvoiceListRow {
  id: number;
  invoiceNumber: string;
  clientId?: number | null;
  clientName?: string | null;
  currency: string;
  dueDate?: string | null;
  issueDate: string;
  status: string;
  total: number;
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtMoney(v: number, c: string) {
  const n = Number(v) || 0;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: c || 'USD' }).format(n);
  } catch {
    return `${c} ${n.toFixed(2)}`;
  }
}

export default function InvoiceTable({ invoices, onRowClick }: { invoices: InvoiceListRow[]; onRowClick: (id: number) => void }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Invoice</th><th>Client</th><th>Issued</th><th>Due</th><th>Status</th>
            <th className={styles.right}>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} onClick={() => onRowClick(inv.id)} className={styles.row} data-testid="invoice-row">
              <td className={styles.num}>{inv.invoiceNumber}</td>
              <td>{inv.clientName || <span className={styles.muted}>No client</span>}</td>
              <td>{fmtDate(inv.issueDate)}</td>
              <td>{fmtDate(inv.dueDate)}</td>
              <td><StatusBadge status={inv.status} /></td>
              <td className={`${styles.right} ${styles.total}`}>{fmtMoney(inv.total, inv.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}