import React from 'react';
import { Search } from 'lucide-react';
import styles from './InvoiceFilters.module.css';

export const STATUS_OPTIONS = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

interface Props {
  search: string;
  status: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export default function InvoiceFilters({ search, status, onSearchChange, onStatusChange }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.searchWrap}>
        <Search size={16} className={styles.icon} />
        <input
          className={styles.search}
          placeholder="Search by number or client"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search invoices"
        />
      </div>
      <select
        className={styles.select}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
    </div>
  );
}