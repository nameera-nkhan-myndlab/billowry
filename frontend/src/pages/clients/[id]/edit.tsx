import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import apiClient from '@/api/client';
import type { Client } from '@/types';
import ClientForm, { ClientFormPayload } from '@/components/ClientForm';
import styles from './edit.module.css';

export default function EditClient() {
  const router = useRouter();
  const rawId = router.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.get(`/api/clients/${id}`);
      setClient((res?.data as Client) ?? null);
    } catch (err: any) {
      setLoadError(err?.response?.status === 404 ? 'Client not found.' : 'Failed to load client.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (router.isReady) load();
  }, [router.isReady, load]);

  const handleSubmit = async (payload: ClientFormPayload) => {
    setSaveError(null);
    try {
      await apiClient.put(`/api/clients/${id}`, payload);
      router.push('/clients');
    } catch (err: any) {
      setSaveError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to save client.');
    }
  };

  return (
    <div className={styles.page}>
      <Link href="/clients" className={styles.back}>
        <ArrowLeft size={14} /> Back to clients
      </Link>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Client</h1>
        <p className={styles.subtitle}>{client ? `Update details for ${client.name}` : 'Update client details'}</p>
      </div>

      {loading ? (
        <div className={styles.state}>Loading client…</div>
      ) : loadError ? (
        <div className={styles.state}>
          <p className={styles.error}>{loadError}</p>
          <button className={styles.retry} onClick={load}>Retry</button>
        </div>
      ) : client ? (
        <ClientForm
          key={client.id}
          initialValues={{
            name: client.name ?? '',
            email: client.email ?? '',
            phone: client.phone ?? '',
            company: client.company ?? '',
            address: client.address ?? '',
            taxId: client.taxId ?? '',
            notes: client.notes ?? '',
          }}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => router.push('/clients')}
          serverError={saveError}
        />
      ) : (
        <div className={styles.state}>No client data.</div>
      )}
    </div>
  );
}