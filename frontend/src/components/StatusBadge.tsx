import React from 'react';
import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }: { status: string }) {
  const s = (status || 'draft').toLowerCase();
  const cls = (styles as Record<string, string>)[s] || styles.draft;
  return <span className={`${styles.badge} ${cls}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
}