import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiClient from '@/api/client';
import type { Client } from '@/types';
import ClientForm, { ClientFormPayload } from '@/components/ClientForm';
import styles from './new.module.css';

export default function NewClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: ClientFormPayload) => {
    setError(null);
    try {
      const res = await apiClient.post<Client>('/api/clients', payload);
      if (!res?.data?.id) throw new Error('Unexpected response');
      router.push('/clients');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to create client. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Failed to create client. Please try again.');
    }
  };

  return (
    <div className={styles.page}>
      <Head><title>New Client · Billowry</title></Head>
      <div className={styles.header}>
        <Link href="/clients" className={styles.back}>← Back to clients</Link>
        <h1 className={styles.title}>New Client</h1>
        <p className={styles.subtitle}>Add a client to your billing directory.</p>
      </div>
      <ClientForm
        submitLabel="Create Client"
        serverError={error}
        onSubmit={handleSubmit}
        onCancel={() => { router.push('/clients'); }}
      />
    </div>
  );
}