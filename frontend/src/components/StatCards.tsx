import React from 'react';
import { FileText, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import type { DashboardStats } from '@/pages/index';
import { formatMoney } from './format';
import styles from './StatCards.module.css';

export default function StatCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: 'Total Invoices', value: String(stats.totalInvoices ?? 0), icon: FileText, color: '#3B82F6' },
    { label: 'Total Clients', value: String(stats.totalClients ?? 0), icon: Users, color: '#8B5CF6' },
    { label: 'Total Paid', value: formatMoney(stats.totalPaid), icon: CheckCircle, color: '#10B981' },
    { label: 'Outstanding', value: formatMoney(stats.totalOutstanding), icon: AlertTriangle, color: '#F97316' },
  ];
  return (
    <div className={styles.grid}>
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className={styles.card} style={{ borderLeftColor: c.color }}>
            <div>
              <div className={styles.label}>{c.label}</div>
              <div className={styles.value}>{c.value}</div>
            </div>
            <div className={styles.icon} style={{ background: `${c.color}1a`, color: c.color }}>
              <Icon size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
}