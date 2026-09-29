import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/client';
import StatCards from '@/components/StatCards';
import RecentInvoicesTable from '@/components/RecentInvoicesTable';
import OutstandingSummary from '@/components/OutstandingSummary';
import QuickActions from '@/components/QuickActions';
import MonthlyTotalsChart, { type MonthlyTotal } from '@/components/MonthlyTotalsChart';
import styles from './Dashboard.module.css';

function Preview({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export interface RecentInvoice {
  clientName?: string | null;
  currency: string;
  id: number;
  invoiceNumber: string;
  issueDate: string;
  status: string;
  total: number;
}

export interface DashboardStats {
  draftCount: number;
  overdueCount: number;
  paidCount: number;
  recentInvoices: RecentInvoice[];
  sentCount: number;
  totalClients: number;
  totalInvoices: number;
  totalOutstanding: number;
  totalPaid: number;
  monthlyTotals?: MonthlyTotal[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/dashboard/stats');
      setStats(res?.data ?? null);
    } catch {
      setError('Failed to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Overview of your invoices and clients</p>
        </div>
        <QuickActions />
      </div>

      {loading && <div className={styles.state} role="status">Loading dashboard…</div>}
      {!loading && error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button className={styles.retry} onClick={load}>Retry</button>
        </div>
      )}
      {!loading && !error && stats && (
        <>
          <StatCards stats={stats} />
          <MonthlyTotalsChart data={stats.monthlyTotals ?? []} />
          <div className={styles.grid}>
            <div className={styles.main}>
              <RecentInvoicesTable invoices={stats.recentInvoices ?? []} />
            </div>
            <div className={styles.side}>
              <OutstandingSummary stats={stats} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
