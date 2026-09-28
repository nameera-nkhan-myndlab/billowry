import React, { useState } from 'react';
import styles from './ClientForm.module.css';

export interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  taxId: string;
  notes: string;
}

export interface ClientFormPayload {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  taxId: string | null;
  notes: string | null;
}

interface Props {
  initialValues?: Partial<ClientFormValues>;
  submitLabel?: string;
  onSubmit: (payload: ClientFormPayload) => Promise<void> | void;
  onCancel?: () => void;
  serverError?: string | null;
}

const empty: ClientFormValues = {
  name: '', email: '', phone: '', company: '', address: '', taxId: '', notes: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ClientForm({ initialValues, submitLabel = 'Save', onSubmit, onCancel, serverError }: Props) {
  const [values, setValues] = useState<ClientFormValues>({ ...empty, ...initialValues });
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof ClientFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  const validate = () => {
    const errs: Partial<Record<keyof ClientFormValues, string>> = {};
    if (!values.name.trim()) errs.name = 'Name is required';
    else if (values.name.length > 255) errs.name = 'Name must be 255 characters or less';
    if (values.email.trim() && !EMAIL_RE.test(values.email.trim())) errs.email = 'Enter a valid email';
    if (values.phone.length > 50) errs.phone = 'Phone must be 50 characters or less';
    if (values.taxId.length > 100) errs.taxId = 'Tax ID must be 100 characters or less';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const n = (s: string) => (s.trim() ? s.trim() : null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        email: n(values.email),
        phone: n(values.phone),
        company: n(values.company),
        address: n(values.address),
        taxId: n(values.taxId),
        notes: n(values.notes),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const input = (k: keyof ClientFormValues, label: string, opts: { required?: boolean; type?: string } = {}) => (
    <div className={styles.field}>
      <label htmlFor={`client-${k}`} className={styles.label}>
        {label}{opts.required && <span className={styles.required}>*</span>}
      </label>
      <input
        id={`client-${k}`}
        type={opts.type || 'text'}
        className={`${styles.input} ${errors[k] ? styles.inputError : ''}`}
        value={values[k]}
        onChange={set(k)}
      />
      {errors[k] && <span className={styles.errorText}>{errors[k]}</span>}
    </div>
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {serverError && <div className={styles.formError} role="alert">{serverError}</div>}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Contact</h2>
        <div className={styles.grid}>
          {input('name', 'Name', { required: true })}
          {input('company', 'Company')}
          {input('email', 'Email', { type: 'email' })}
          {input('phone', 'Phone')}
        </div>
      </div>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Billing</h2>
        <div className={styles.grid}>
          {input('taxId', 'Tax ID')}
          <div className={`${styles.field} ${styles.full}`}>
            <label htmlFor="client-address" className={styles.label}>Address</label>
            <textarea id="client-address" className={styles.textarea} value={values.address} onChange={set('address')} />
          </div>
          <div className={`${styles.field} ${styles.full}`}>
            <label htmlFor="client-notes" className={styles.label}>Notes</label>
            <textarea id="client-notes" className={styles.textarea} value={values.notes} onChange={set('notes')} />
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}