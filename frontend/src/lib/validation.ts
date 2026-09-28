import { HttpError } from './http';

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

export interface ClientInput {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  taxId: string | null;
  notes: string | null;
}

export interface ItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  position: number;
}

export interface InvoiceInput {
  invoiceNumber: string | null;
  clientId: number | null;
  status: string;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  taxRate: number;
  discount: number;
  notes: string | null;
  terms: string | null;
  items: ItemInput[];
}

function optStr(v: unknown, field: string, max?: number): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') throw new HttpError(400, `${field} must be a string`);
  const t = v.trim();
  if (!t) return null;
  if (max && t.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return t;
}

function num(v: unknown, field: string, def?: number): number {
  if ((v === undefined || v === null || v === '') && def !== undefined) return def;
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new HttpError(400, `${field} must be a number`);
  if (n < 0) throw new HttpError(400, `${field} must be non-negative`);
  return n;
}

function date(v: unknown, field: string, required: boolean): string | null {
  if (v === undefined || v === null || v === '') {
    if (required) throw new HttpError(400, `${field} is required`);
    return null;
  }
  if (typeof v !== 'string' || isNaN(Date.parse(v))) throw new HttpError(400, `${field} must be a valid date`);
  return new Date(v).toISOString();
}

export function validateStatus(v: unknown, def?: string): string {
  if ((v === undefined || v === null) && def) return def;
  if (typeof v !== 'string' || !(INVOICE_STATUSES as readonly string[]).includes(v)) {
    throw new HttpError(400, `status must be one of ${INVOICE_STATUSES.join(', ')}`);
  }
  return v;
}

export function validateClient(body: any): ClientInput {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid body');
  const name = optStr(body.name, 'name', 255);
  if (!name) throw new HttpError(400, 'name is required');
  const email = optStr(body.email, 'email', 255);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'email is invalid');
  return {
    name,
    email,
    phone: optStr(body.phone, 'phone', 50),
    company: optStr(body.company, 'company', 255),
    address: optStr(body.address, 'address'),
    taxId: optStr(body.taxId, 'taxId', 100),
    notes: optStr(body.notes, 'notes'),
  };
}

export function validateInvoice(body: any, strict: boolean): InvoiceInput {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid body');
  if (!Array.isArray(body.items)) throw new HttpError(400, 'items must be an array');
  const items: ItemInput[] = body.items.map((it: any, idx: number) => {
    const description = optStr(it?.description, `items[${idx}].description`, 500);
    if (!description) throw new HttpError(400, `items[${idx}].description is required`);
    return {
      description,
      quantity: num(it.quantity, `items[${idx}].quantity`),
      unitPrice: num(it.unitPrice, `items[${idx}].unitPrice`),
      position: it.position === undefined || it.position === null ? idx : Math.trunc(num(it.position, `items[${idx}].position`)),
    };
  });
  // ensure unique positions
  const seen = new Set<number>();
  items.forEach((it, idx) => {
    if (seen.has(it.position)) it.position = 1000 + idx;
    seen.add(it.position);
  });

  let clientId: number | null = null;
  if (body.clientId !== undefined && body.clientId !== null && body.clientId !== '') {
    const c = Number(body.clientId);
    if (!Number.isInteger(c) || c <= 0) throw new HttpError(400, 'clientId must be an integer');
    clientId = c;
  }

  const invoiceNumber = optStr(body.invoiceNumber, 'invoiceNumber', 50);
  if (strict && !invoiceNumber) throw new HttpError(400, 'invoiceNumber is required');
  const currencyRaw = optStr(body.currency, 'currency', 3);
  if (strict && !currencyRaw) throw new HttpError(400, 'currency is required');
  const taxRate = num(body.taxRate, 'taxRate', strict ? undefined : 0);
  if (taxRate > 100) throw new HttpError(400, 'taxRate must be at most 100');

  return {
    invoiceNumber,
    clientId,
    status: validateStatus(body.status, strict ? undefined : 'draft'),
    issueDate: date(body.issueDate, 'issueDate', true) as string,
    dueDate: date(body.dueDate, 'dueDate', false),
    currency: (currencyRaw || 'USD').toUpperCase(),
    taxRate,
    discount: num(body.discount, 'discount', strict ? undefined : 0),
    notes: optStr(body.notes, 'notes'),
    terms: optStr(body.terms, 'terms'),
    items,
  };
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const round2 = r2;
export { HttpError };
export { parseId } from './http';

export function computeTotals(items: ItemInput[], taxRate: number, discount: number) {
  const lines = items.map((it) => ({ ...it, amount: r2(it.quantity * it.unitPrice) }));
  const subtotal = r2(lines.reduce((s, l) => s + l.amount, 0));
  const taxAmount = r2((subtotal * taxRate) / 100);
  const total = Math.max(0, r2(subtotal + taxAmount - discount));
  return { lines, subtotal, taxAmount, total };
}