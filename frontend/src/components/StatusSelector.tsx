import React from 'react';
import styles from './InvoiceActions.module.css';

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

interface Props { value: string; disabled?: boolean; onChange: (status: string) => void; }

export default function StatusSelector({ value, disabled, onChange }: Props) {
  return (
    <label className={styles.selectWrap}>
      <span className={styles.srOnly}>Status</span>
      <select
        aria-label="Status"
        className={styles.select}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {INVOICE_STATUSES.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
    </label>
  );
}