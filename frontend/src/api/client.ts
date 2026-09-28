import axios from 'axios';
import type {
  DashboardStats, ClientListItem, CreateClientDto, UpdateClientDto, Client, ClientDetail,
  DeleteResult, InvoiceListItem, CreateInvoiceDto, UpdateInvoiceDto, InvoiceWithItems,
  InvoiceDetail, InvoiceStatusResult, NextInvoiceNumber,
} from '../types';

// Same-origin: all calls use /api/... paths handled by Next.js API routes.
export const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as any;
  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
}

export const dashboardAPI = {
  getStats: () => apiClient.get<DashboardStats>('/api/dashboard/stats').then((r) => r.data),
};

export const clientsAPI = {
  list: (search?: string) =>
    apiClient.get<ClientListItem[]>('/api/clients', { params: search ? { search } : {} }).then((r) => r.data ?? []),
  get: (id: number | string) => apiClient.get<ClientDetail>(`/api/clients/${id}`).then((r) => r.data),
  create: (body: CreateClientDto) => apiClient.post<Client>('/api/clients', body).then((r) => r.data),
  update: (id: number | string, body: UpdateClientDto) =>
    apiClient.put<Client>(`/api/clients/${id}`, body).then((r) => r.data),
  remove: (id: number | string) => apiClient.delete<DeleteResult>(`/api/clients/${id}`).then((r) => r.data),
};

export const invoicesAPI = {
  list: (params?: { status?: string; clientId?: number | string }) =>
    apiClient.get<InvoiceListItem[]>('/api/invoices', { params: params || {} }).then((r) => r.data ?? []),
  get: (id: number | string) => apiClient.get<InvoiceDetail>(`/api/invoices/${id}`).then((r) => r.data),
  create: (body: CreateInvoiceDto) => apiClient.post<InvoiceWithItems>('/api/invoices', body).then((r) => r.data),
  update: (id: number | string, body: UpdateInvoiceDto) =>
    apiClient.put<InvoiceWithItems>(`/api/invoices/${id}`, body).then((r) => r.data),
  updateStatus: (id: number | string, status: string) =>
    apiClient.patch<InvoiceStatusResult>(`/api/invoices/${id}/status`, { status }).then((r) => r.data),
  remove: (id: number | string) => apiClient.delete<DeleteResult>(`/api/invoices/${id}`).then((r) => r.data),
  nextNumber: () => apiClient.get<NextInvoiceNumber>('/api/invoices/next-number').then((r) => r.data),
};

export default apiClient;