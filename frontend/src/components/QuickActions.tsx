import React from 'react';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import styles from './QuickActions.module.css';

export default function QuickActions() {
  return (
    <div className={styles.row}>
      <Link href="/clients" className={styles.secondary}><Users size={16} /> Clients</Link>
      <Link href="/invoices?new=1" className={styles.primary}><Plus size={16} /> New Invoice</Link>
    </div>
  );
}