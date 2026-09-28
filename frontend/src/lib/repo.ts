import { getDb, isSupabase } from './db';
import { HttpError } from './http';
import { ClientInput, InvoiceInput, computeTotals } from './validation';

const n = (v: any) => (v === null || v === undefined ? 0 : Number(v));
const iso = (v: any) => (v ? new Date(v).toISOString() : null);
const now = () => new Date().toISOString();

function sb(result: { data: any; error: any }) {
  if (result.error) {
    if (result.error.code === '23505') throw new HttpError(409, 'Duplicate value');
    throw new Error(result.error.message || 'Supabase error');
  }
  return result.data;
}

function sqliteUnique(fn: () => any) {
  try {
    return fn();
  } catch (e: any) {
    if (String(e?.message || '').includes('UNIQUE')) throw new HttpError(409, 'Duplicate value');
    throw e;
  }
}

function mapClient(r: any) {
  return {
    id: n(r.id),
    name: r.name,
    email: r.email ?? null,
    phone: r.phone ?? null,
    company: r.company ?? null,
    address: r.address ?? null,
    taxId: r.taxId ?? null,
    notes: r.notes ?? null,
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  };
}

function mapItem(r: any) {
  return {
    id: n(r.id),
    description: r.description,
    quantity: n(r.quantity),
    unitPrice: n(r.unitPrice),
    amount: n(r.amount),
    position: n(r.position),
  };
}

function mapInvoice(r: any, items: any[]) {
  return {
    id: n(r.id),
    invoiceNumber: r.invoiceNumber,
    clientId: r.clientId === null || r.clientId === undefined ? null : n(r.clientId),
    status: r.status,
    issueDate: iso(r.issueDate),
    dueDate: iso(r.dueDate),
    currency: r.currency,
    subtotal: n(r.subtotal),
    taxRate: n(r.taxRate),
    taxAmount: n(r.taxAmount),
    discount: n(r.discount),
    total: n(r.total),
    notes: r.notes ?? null,
    terms: r.terms ?? null,
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
    items: items.map(mapItem).sort((a, b) => a.position - b.position),
  };
}

function summary(r: any, clientName: string | null) {
  return {
    id: n(r.id),
    invoiceNumber: r.invoiceNumber,
    clientId: r.clientId === null || r.clientId === undefined ? null : n(r.clientId),
    clientName,
    status: r.status,
    issueDate: iso(r.issueDate),
    dueDate: iso(r.dueDate),
    currency: r.currency,
    total: n(r.total),
  };
}

/* ---------------- Clients ---------------- */

export async function listClients(search?: string) {
  const db = getDb();
  const term = (search || '').trim();
  if (isSupabase()) {
    let q = db.from('clients').select('id,name,email,phone,company,createdAt').order('name');
    if (term) {
      const safe = term.replace(/[,%()]/g, ' ');
      q = q.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,company.ilike.%${safe}%`);
    }
    const clients = sb(await q) || [];
    const invs = sb(await db.from('invoices').select('clientId')) || [];
    const counts: Record<number, number> = {};
    invs.forEach((i: any) => { if (i.clientId != null) counts[i.clientId] = (counts[i.clientId] || 0) + 1; });
    return clients.map((c: any) => ({
      id: n(c.id), name: c.name, email: c.email ?? null, phone: c.phone ?? null,
      company: c.company ?? null, createdAt: iso(c.createdAt), invoiceCount: counts[c.id] || 0,
    }));
  }
  const like = `%${term}%`;
  const rows = db.prepare(
    `SELECT c.id,c.name,c.email,c.phone,c.company,c.createdAt,COUNT(i.id) AS invoiceCount
     FROM clients c LEFT JOIN invoices i ON i.clientId=c.id
     WHERE (? = '' OR c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ?)
     GROUP BY c.id ORDER BY c.name`
  ).all(term, like, like, like);
  return rows.map((c: any) => ({
    id: n(c.id), name: c.name, email: c.email ?? null, phone: c.phone ?? null,
    company: c.company ?? null, createdAt: iso(c.createdAt), invoiceCount: n(c.invoiceCount),
  }));
}

export async function createClient(input: ClientInput) {
  const db = getDb();
  const ts = now();
  if (isSupabase()) {
    const row = sb(await db.from('clients').insert({ ...input, createdAt: ts, updatedAt: ts }).select('*').single());
    return mapClient(row);
  }
  const info = sqliteUnique(() => db.prepare(
    'INSERT INTO clients (name,email,phone,company,address,taxId,notes,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(input.name, input.email, input.phone, input.company, input.address, input.taxId, input.notes, ts, ts));
  return mapClient(db.prepare('SELECT * FROM clients WHERE id=?').get(info.lastInsertRowid));
}

async function findClientRow(id: number) {
  const db = getDb();
  if (isSupabase()) return sb(await db.from('clients').select('*').eq('id', id).maybeSingle());
  return db.prepare('SELECT * FROM clients WHERE id=?').get(id) || null;
}

export async function getClient(id: number) {
  const row = await findClientRow(id);
  if (!row) throw new HttpError(404, 'Client not found');
  const db = getDb();
  let invs: any[];
  if (isSupabase()) {
    invs = sb(await db.from('invoices').select('id,invoiceNumber,status,issueDate,dueDate,currency,total').eq('clientId', id).order('issueDate', { ascending: false })) || [];
  } else {
    invs = db.prepare('SELECT id,invoiceNumber,status,issueDate,dueDate,currency,total FROM invoices WHERE clientId=? ORDER BY issueDate DESC').all(id);
  }
  return {
    ...mapClient(row),
    invoices: invs.map((i: any) => ({
      id: n(i.id), invoiceNumber: i.invoiceNumber, status: i.status, issueDate: iso(i.issueDate),
      dueDate: iso(i.dueDate), currency: i.currency, total: n(i.total),
    })),
  };
}

export async function updateClient(id: number, input: ClientInput) {
  if (!(await findClientRow(id))) throw new HttpError(404, 'Client not found');
  const db = getDb();
  const ts = now();
  if (isSupabase()) {
    const row = sb(await db.from('clients').update({ ...input, updatedAt: ts }).eq('id', id).select('*').single());
    return mapClient(row);
  }
  sqliteUnique(() => db.prepare(
    'UPDATE clients SET name=?,email=?,phone=?,company=?,address=?,taxId=?,notes=?,updatedAt=? WHERE id=?'
  ).run(input.name, input.email, input.phone, input.company, input.address, input.taxId, input.notes, ts, id));
  return mapClient(db.prepare('SELECT * FROM clients WHERE id=?').get(id));
}

export async function deleteClient(id: number) {
  if (!(await findClientRow(id))) throw new HttpError(404, 'Client not found');
  const db = getDb();
  if (isSupabase()) {
    sb(await db.from('invoices').update({ clientId: null }).eq('clientId', id));
    sb(await db.from('clients').delete().eq('id', id));
  } else {
    db.transaction(() => {
      db.prepare('UPDATE invoices SET clientId=NULL WHERE clientId=?').run(id);
      db.prepare('DELETE FROM clients WHERE id=?').run(id);
    })();
  }
  return { id, success: true };
}

/* ---------------- Invoices ---------------- */

async function clientNameMap(): Promise<Record<number, string>> {
  const db = getDb();
  const rows = isSupabase()
    ? sb(await db.from('clients').select('id,name')) || []
    : db.prepare('SELECT id,name FROM clients').all();
  const m: Record<number, string> = {};
  rows.forEach((r: any) => { m[n(r.id)] = r.name; });
  return m;
}

export async function listInvoices(filters: { status?: string; clientId?: number }) {
  const db = getDb();
  let rows: any[];
  if (isSupabase()) {
    let q = db.from('invoices').select('id,invoiceNumber,clientId,status,issueDate,dueDate,currency,total').order('issueDate', { ascending: false }).order('id', { ascending: false });
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.clientId) q = q.eq('clientId', filters.clientId);
    rows = sb(await q) || [];
  } else {
    const where: string[] = [];
    const params: any[] = [];
    if (filters.status) { where.push('status=?'); params.push(filters.status); }
    if (filters.clientId) { where.push('clientId=?'); params.push(filters.clientId); }
    rows = db.prepare(
      `SELECT id,invoiceNumber,clientId,status,issueDate,dueDate,currency,total FROM invoices
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY issueDate DESC, id DESC`
    ).all(...params);
  }
  const names = await clientNameMap();
  return rows.map((r) => summary(r, r.clientId != null ? names[n(r.clientId)] ?? null : null));
}

async function allInvoiceNumbers(): Promise<string[]> {
  const db = getDb();
  const rows = isSupabase()
    ? sb(await db.from('invoices').select('invoiceNumber')) || []
    : db.prepare('SELECT invoiceNumber FROM invoices').all();
  return rows.map((r: any) => String(r.invoiceNumber));
}

export async function nextInvoiceNumber() {
  const nums = await allInvoiceNumbers();
  let max = 0;
  nums.forEach((s) => {
    const m = /^INV-(\d+)$/i.exec(s);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return { invoiceNumber: `INV-${String(max + 1).padStart(4, '0')}` };
}

async function assertClientExists(clientId: number | null) {
  if (clientId === null) return;
  if (!(await findClientRow(clientId))) throw new HttpError(400, 'clientId does not reference an existing client');
}

async function findInvoiceRow(id: number) {
  const db = getDb();
  if (isSupabase()) return sb(await db.from('invoices').select('*').eq('id', id).maybeSingle());
  return db.prepare('SELECT * FROM invoices WHERE id=?').get(id) || null;
}

async function loadItems(id: number) {
  const db = getDb();
  if (isSupabase()) return sb(await db.from('invoice_items').select('*').eq('invoiceId', id).order('position')) || [];
  return db.prepare('SELECT * FROM invoice_items WHERE invoiceId=? ORDER BY position').all(id);
}

function invoiceRecord(input: InvoiceInput, invoiceNumber: string) {
  const t = computeTotals(input.items, input.taxRate, input.discount);
  return {
    totals: t,
    record: {
      invoiceNumber,
      clientId: input.clientId,
      status: input.status,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: input.currency,
      subtotal: t.subtotal,
      taxRate: input.taxRate,
      taxAmount: t.taxAmount,
      discount: input.discount,
      total: t.total,
      notes: input.notes,
      terms: input.terms,
    },
  };
}

export async function createInvoice(input: InvoiceInput) {
  await assertClientExists(input.clientId);
  const invoiceNumber = input.invoiceNumber || (await nextInvoiceNumber()).invoiceNumber;
  const { record, totals } = invoiceRecord(input, invoiceNumber);
  const db = getDb();
  const ts = now();
  let id: number;
  if (isSupabase()) {
    const row = sb(await db.from('invoices').insert({ ...record, createdAt: ts, updatedAt: ts }).select('id').single());
    id = n(row.id);
    if (totals.lines.length) {
      const res = await db.from('invoice_items').insert(totals.lines.map((l) => ({
        invoiceId: id, description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, amount: l.amount, position: l.position,
      })));
      if (res.error) {
        await db.from('invoices').delete().eq('id', id);
        sb(res);
      }
    }
  } else {
    id = sqliteUnique(() => db.transaction(() => {
      const info = db.prepare(
        `INSERT INTO invoices (invoiceNumber,clientId,status,issueDate,dueDate,currency,subtotal,taxRate,taxAmount,discount,total,notes,terms,createdAt,updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).run(record.invoiceNumber, record.clientId, record.status, record.issueDate, record.dueDate, record.currency,
        record.subtotal, record.taxRate, record.taxAmount, record.discount, record.total, record.notes, record.terms, ts, ts);
      const newId = Number(info.lastInsertRowid);
      const ins = db.prepare('INSERT INTO invoice_items (invoiceId,description,quantity,unitPrice,amount,position) VALUES (?,?,?,?,?,?)');
      totals.lines.forEach((l) => ins.run(newId, l.description, l.quantity, l.unitPrice, l.amount, l.position));
      return newId;
    })());
  }
  const row = await findInvoiceRow(id);
  return mapInvoice(row, await loadItems(id));
}

export async function getInvoice(id: number) {
  const row = await findInvoiceRow(id);
  if (!row) throw new HttpError(404, 'Invoice not found');
  const items = await loadItems(id);
  let client: any = null;
  if (row.clientId != null) {
    const c = await findClientRow(n(row.clientId));
    if (c) {
      client = {
        id: n(c.id), name: c.name, email: c.email ?? null, phone: c.phone ?? null,
        company: c.company ?? null, address: c.address ?? null, taxId: c.taxId ?? null,
      };
    }
  }
  return { ...mapInvoice(row, items), client };
}

export async function updateInvoice(id: number, input: InvoiceInput) {
  if (!(await findInvoiceRow(id))) throw new HttpError(404, 'Invoice not found');
  await assertClientExists(input.clientId);
  const { record, totals } = invoiceRecord(input, input.invoiceNumber as string);
  const db = getDb();
  const ts = now();
  if (isSupabase()) {
    sb(await db.from('invoices').update({ ...record, updatedAt: ts }).eq('id', id));
    sb(await db.from('invoice_items').delete().eq('invoiceId', id));
    if (totals.lines.length) {
      sb(await db.from('invoice_items').insert(totals.lines.map((l) => ({
        invoiceId: id, description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, amount: l.amount, position: l.position,
      }))));
    }
  } else {
    sqliteUnique(() => db.transaction(() => {
      db.prepare(
        `UPDATE invoices SET invoiceNumber=?,clientId=?,status=?,issueDate=?,dueDate=?,currency=?,subtotal=?,taxRate=?,taxAmount=?,discount=?,total=?,notes=?,terms=?,updatedAt=? WHERE id=?`
      ).run(record.invoiceNumber, record.clientId, record.status, record.issueDate, record.dueDate, record.currency,
        record.subtotal, record.taxRate, record.taxAmount, record.discount, record.total, record.notes, record.terms, ts, id);
      db.prepare('DELETE FROM invoice_items WHERE invoiceId=?').run(id);
      const ins = db.prepare('INSERT INTO invoice_items (invoiceId,description,quantity,unitPrice,amount,position) VALUES (?,?,?,?,?,?)');
      totals.lines.forEach((l) => ins.run(id, l.description, l.quantity, l.unitPrice, l.amount, l.position));
    })());
  }
  const row = await findInvoiceRow(id);
  return mapInvoice(row, await loadItems(id));
}

export async function updateInvoiceStatus(id: number, status: string) {
  if (!(await findInvoiceRow(id))) throw new HttpError(404, 'Invoice not found');
  const db = getDb();
  const ts = now();
  let row: any;
  if (isSupabase()) {
    row = sb(await db.from('invoices').update({ status, updatedAt: ts }).eq('id', id).select('id,invoiceNumber,status,updatedAt').single());
  } else {
    db.prepare('UPDATE invoices SET status=?,updatedAt=? WHERE id=?').run(status, ts, id);
    row = db.prepare('SELECT id,invoiceNumber,status,updatedAt FROM invoices WHERE id=?').get(id);
  }
  return { id: n(row.id), invoiceNumber: row.invoiceNumber, status: row.status, updatedAt: iso(row.updatedAt) };
}

export async function deleteInvoice(id: number) {
  if (!(await findInvoiceRow(id))) throw new HttpError(404, 'Invoice not found');
  const db = getDb();
  if (isSupabase()) {
    sb(await db.from('invoice_items').delete().eq('invoiceId', id));
    sb(await db.from('invoices').delete().eq('id', id));
  } else {
    db.transaction(() => {
      db.prepare('DELETE FROM invoice_items WHERE invoiceId=?').run(id);
      db.prepare('DELETE FROM invoices WHERE id=?').run(id);
    })();
  }
  return { id, success: true };
}

/* ---------------- Dashboard ---------------- */

export async function dashboardStats() {
  const db = getDb();
  let invs: any[];
  let totalClients: number;
  if (isSupabase()) {
    invs = sb(await db.from('invoices').select('id,invoiceNumber,clientId,status,issueDate,currency,total')) || [];
    const res = await db.from('clients').select('id', { count: 'exact', head: true });
    if (res.error) sb(res);
    totalClients = res.count || 0;
  } else {
    invs = db.prepare('SELECT id,invoiceNumber,clientId,status,issueDate,currency,total FROM invoices').all();
    totalClients = n(db.prepare('SELECT COUNT(*) AS c FROM clients').get().c);
  }
  const names = await clientNameMap();
  const r2 = (x: number) => Math.round(x * 100) / 100;
  let totalPaid = 0, totalOutstanding = 0;
  const counts: Record<string, number> = { draft: 0, sent: 0, paid: 0, overdue: 0 };
  invs.forEach((i) => {
    if (counts[i.status] !== undefined) counts[i.status]++;
    if (i.status === 'paid') totalPaid += n(i.total);
    if (i.status === 'sent' || i.status === 'overdue') totalOutstanding += n(i.total);
  });
  const recentInvoices = [...invs]
    .sort((a, b) => (Date.parse(b.issueDate) - Date.parse(a.issueDate)) || (n(b.id) - n(a.id)))
    .slice(0, 5)
    .map((i) => ({
      id: n(i.id), invoiceNumber: i.invoiceNumber,
      clientName: i.clientId != null ? names[n(i.clientId)] ?? null : null,
      status: i.status, issueDate: iso(i.issueDate), currency: i.currency, total: n(i.total),
    }));
  return {
    totalInvoices: invs.length,
    totalClients,
    draftCount: counts.draft,
    sentCount: counts.sent,
    paidCount: counts.paid,
    overdueCount: counts.overdue,
    totalPaid: r2(totalPaid),
    totalOutstanding: r2(totalOutstanding),
    recentInvoices,
  };
}