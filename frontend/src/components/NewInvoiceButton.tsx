import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import styles from './NewInvoiceButton.module.css';

export default function NewInvoiceButton() {
  return (
    <Link href="/invoices/new" className={styles.btn}>
      <Plus size={16} /> New Invoice
    </Link>
  );
}