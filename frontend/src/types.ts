export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

export interface Client {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  taxId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  clientId?: number | null;
  status: InvoiceStatus | string;
  issueDate: string;
  dueDate?: string | null;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  position: number;
}

export interface RecentInvoice {
  id: number;
  invoiceNumber: string;
  clientName?: string | null;
  currency: string;
  issueDate: string;
  status: string;
  total: number;
}

export interface DashboardStats {
  draftCount: number;
  overdueCount: number;
  paidCount: number;
  sentCount: number;
  totalClients: number;
  totalInvoices: number;
  totalOutstanding: number;
  totalPaid: number;
  recentInvoices: RecentInvoice[];
}

export interface ClientListItem {
  id: number;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  invoiceCount: number;
}

export interface CreateClientDto {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  taxId?: string | null;
  notes?: string | null;
}
export type UpdateClientDto = CreateClientDto;

export interface ClientInvoiceSummary {
  id: number;
  invoiceNumber: string;
  currency: string;
  dueDate?: string | null;
  issueDate: string;
  status: string;
  total: number;
}

export interface ClientDetail extends Client {
  invoices: ClientInvoiceSummary[];
}

export interface InvoiceListItem {
  id: number;
  invoiceNumber: string;
  clientId?: number | null;
  clientName?: string | null;
  currency: string;
  dueDate?: string | null;
  issueDate: string;
  status: string;
  total: number;
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  position?: number;
}

export interface CreateInvoiceDto {
  clientId?: number | null;
  currency?: string;
  discount?: number;
  dueDate?: string | null;
  invoiceNumber?: string;
  issueDate: string;
  items: InvoiceItemInput[];
  notes?: string | null;
  status?: string;
  taxRate?: number;
  terms?: string | null;
}

export interface UpdateInvoiceDto {
  clientId?: number | null;
  currency: string;
  discount: number;
  dueDate?: string | null;
  invoiceNumber: string;
  issueDate: string;
  items: InvoiceItemInput[];
  notes?: string | null;
  status: string;
  taxRate: number;
  terms?: string | null;
}

export interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  position: number;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceLineItem[];
}

export interface InvoiceClientInfo {
  id: number;
  name: string;
  address?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
}

export interface InvoiceDetail extends InvoiceWithItems {
  client: InvoiceClientInfo | null;
}

export interface UpdateInvoiceStatusDto {
  status: string;
}

export interface InvoiceStatusResult {
  id: number;
  invoiceNumber: string;
  status: string;
  updatedAt: string;
}

export interface DeleteResult {
  id: number;
  success: boolean;
}

export interface NextInvoiceNumber {
  invoiceNumber: string;
}