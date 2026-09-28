import React from 'react';
import { Trash2 } from 'lucide-react';
import StatusSelector from './StatusSelector';
import PrintButton from './PrintButton';
import styles from './InvoiceActions.module.css';

interface Props {
  status: string;
  disabled?: boolean;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}

export default function InvoiceActions({ status, disabled, onStatusChange, onDelete }: Props) {
  return (
    <div className={styles.actions}>
      <StatusSelector value={status} disabled={disabled} onChange={onStatusChange} />
      <PrintButton />
      <button type="button" className={`${styles.btn} ${styles.danger}`} disabled={disabled} onClick={onDelete}>
        <Trash2 size={16} /> Delete
      </button>
    </div>
  );
}