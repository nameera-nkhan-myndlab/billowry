import React from 'react';
import { Printer } from 'lucide-react';
import styles from './InvoiceActions.module.css';

export default function PrintButton() {
  return (
    <button type="button" className={styles.btn} onClick={() => typeof window !== 'undefined' && window.print()}>
      <Printer size={16} /> Print
    </button>
  );
}