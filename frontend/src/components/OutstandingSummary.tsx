import React from 'react';
import type { DashboardStats } from '@/pages/index';
import { formatMoney } from './format';
import styles from './OutstandingSummary.module.css';

export default function OutstandingSummary({ stats }: { stats: DashboardStats }) {
  const rows = [
    { label: 'Draft', count: stats.draftCount ?? 0, color: '#94a3b8' },
    { label: 'Sent', count: stats.sentCount ?? 0, color: '#3B82F6' },
    { label: 'Paid', count: stats.paidCount ?? 0, color: '#10B981' },
    { label: 'Overdue', count: stats.overdueCount ?? 0, color: '#F97316' },
  ];
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Outstanding Summary</h2>
      <div className={styles.amount} data-testid="outstanding-amount">{formatMoney(stats.totalOutstanding)}</div>
      <div className={styles.caption}>awaiting payment</div>
      <ul className={styles.list}>
        {rows.map((r) => (
          <li key={r.label} className={styles.row}>
            <div className={styles.rowHead}><span>{r.label}</span><span className={styles.count}>{r.count}</span></div>
            <div className={styles.bar}><div className={styles.fill} style={{ width: `${(r.count / total) * 100}%`, background: r.color }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}