import { getDb, isSupabase } from './db';
import { HttpError, ClientInput, InvoiceInput, computeTotals, round2 } from './validation';

const n = (v: any) => (v === null || v === undefined ? 0 : round2(Number(v)));
const iso = (v: any) => (v ? new Date(v).toISOString() : null);
const now = () => new Date().toISOString();

function sbCheck(res: { data: any; error: any }) {
  if (res.error) {
    if (res.error.code === '23505') throw new HttpError(409, 'A record with that unique value already exists');
    throw new HttpError(500, res.error.message || 'Database error');
  }
  return res.data;
}

function sqliteUnique(e: any): never {
  if (String(e?.message || '').includes('UNIQUE')) throw new HttpError(409, 'A record with that unique value already exists');
  throw e;
}

function mapClient(r: any) {
  return {
    id: Number(r.id),
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
    id: Number(r.id),
    description: r.description,
    quantity: n(r.quantity),
    unitPrice: n(r.unitPrice),
    amount: n(r.amount),
    position: Number(r.position),
  };
}

function mapInvoice(r: any, items: any[]) {
  return {
    id: Number(r.id),
    invoiceNumber: r.invoiceNumber,
    clientId: r.clientId === null || r.clientId === undefined ? null : Number(r.clientId),
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

function summary(r: any, clientName?: string | null) {
  return {
    id: Number(r.id),
    invoiceNumber: r.invoiceNumber,
    clientId: r.clientId === null || r.clientId === undefined ? null : Number(r.clientId),
    clientName: clientName ?? null,
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
  const q = (search || '').trim();
  if (isSupabase()) {
    let query = db.from('clients').select('id,name,email,phone,company,createdAt,invoices(id)').order('name');
    if (q) {
      const safe = q.replace(/[,%()]/g, ' ');
      query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,company.ilike.%${safe}%`);
    }
    const rows = sbCheck(await query) || [];
    return rows.map((r: any) => ({
      id: Number(r.id), name: r.name, email: r.email ?? null, phone: r.phone ?? null,
      company: r.company ?? null, createdAt: iso(r.createdAt), invoiceCount: (r.invoices || []).length,
    }));
  }
  const like = `%${q}%`;
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.email, c.phone, c.company, c.createdAt,
        (SELECT COUNT(*) FROM invoices i WHERE i.clientId = c.id) AS invoiceCount
       FROM clients c
       WHERE (? = '' OR c.name LIKE ? OR IFNULL(c.email,'') LIKE ? OR IFNULL(c.company,'') LIKE ?)
       ORDER BY c.name`
    )
    .all(q, like, like, like);
  return rows.map((r: any) => ({
    id: r.id, name: r.name, email: r.email ?? null, phone: r.phone ?? null,
    company: r.company ?? null, createdAt: iso(r.createdAt), invoiceCount: Number(r.invoiceCount),
  }));
}

export async function createClient(input: ClientInput) {
  const db = getDb();
  const ts = now();
  if (isSupabase()) {
    const row = sbCheck(await db.from('clients').insert({ ...input, createdAt: ts, updatedAt: ts }).select().single());
    return mapClient(row);
  }
  try {
    const r = db
      .prepare('INSERT INTO clients (name,email,phone,company,address,taxId,notes,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(input.name, input.email, input.phone, input.company, input.address, input.taxId, input.notes, ts, ts);
    return mapClient(db.prepare('SELECT * FROM clients WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    sqliteUnique(e);
  }
}

export async function getClient(id: number) {
  const db = getDb();
  let client: any;
  let invoices: any[];
  if (isSupabase()) {
    client = sbCheck(await db.from('clients').select('*').eq('id', id).maybeSingle());
    if (!client) throw new HttpError(404, 'Client not found');
    invoices = sbCheck(await db.from('invoices').select('id,invoiceNumber,status,issueDate,dueDate,currency,total').eq('clientId', id).order('issueDate', { ascending: false })) || [];
  } else {
    client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) throw new HttpError(404, 'Client not found');
    invoices = db.prepare('SELECT id,invoiceNumber,status,issueDate,dueDate,currency,total FROM invoices WHERE clientId = ? ORDER BY issueDate DESC').all(id);
  }
  return {
    ...mapClient(client),
    invoices: invoices.map((r) => ({
      id: Number(r.id), invoiceNumber: r.invoiceNumber, status: r.status, issueDate: iso(r.issueDate),
      dueDate: iso(r.dueDate), currency: r.currency, total: n(r.total),
    })),
  };
}

export async function updateClient(id: number, input: ClientInput) {
  const db = getDb();
  const ts = now();
  if (isSupabase()) {
    const row = sbCheck(await db.from('clients').update({ ...input, updatedAt: ts }).eq('id', id).select().maybeSingle());
    if (!row) throw new HttpError(404, 'Client not found');
    return mapClient(row);
  }
  try {
    const r = db
      .prepare('UPDATE clients SET name=?,email=?,phone=?,company=?,address=?,taxId=?,notes=?,updatedAt=? WHERE id=?')
      .run(input.name, input.email, input.phone, input.company, input.address, input.taxId, input.notes, ts, id);
    if (r.changes === 0) throw new HttpError(404, 'Client not found');
    return mapClient(db.prepare('SELECT * FROM clients WHERE id = ?').get(id));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    sqliteUnique(e);
  }
}

export async function deleteClient(id: number) {
  const db = getDb();
  if (isSupabase()) {
    const rows = sbCheck(await db.from('clients').delete().eq('id', id).select('id')) || [];
    if (rows.length === 0) throw new HttpError(404, 'Client not found');
    return { id, success: true };
  }
  const tx = db.transaction(() => {
    db.prepare('UPDATE invoices SET clientId = NULL WHERE clientId = ?').run(id);
    return db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  });
  const r = tx();
  if (r.changes === 0) throw new HttpError(404, 'Client not found');
  return { id, success: true };
}

/* ---------------- Invoices ---------------- */

export async function listInvoices(filters: { status?: string; clientId?: number }) {
  const db = getDb();
  if (isSupabase()) {
    let q = db.from('invoices').select('id,invoiceNumber,clientId,status,issueDate,dueDate,currency,total,clients(name)').order('issueDate', { ascending: false });
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.clientId) q = q.eq('clientId', filters.clientId);
    const rows = sbCheck(await q) || [];
    return rows.map((r: any) => summary(r, r.clients?.name ?? null));
  }
  const rows = db
    .prepare(
      `SELECT i.*, c.name AS clientName FROM invoices i LEFT JOIN clients c ON c.id = i.clientId
       WHERE (? IS NULL OR i.status = ?) AND (? IS NULL OR i.clientId = ?)
       ORDER BY i.issueDate DESC, i.id DESC`
    )
    .all(filters.status ?? null, filters.status ?? null, filters.clientId ?? null, filters.clientId ?? null);
  return rows.map((r: any) => summary(r, r.clientName));
}

async function ensureClient(clientId: number | null) {
  if (clientId === null) return;
  const db = getDb();
  if (isSupabase()) {
    const row = sbCheck(await db.from('clients').select('id').eq('id', clientId).maybeSingle());
    if (!row) throw new HttpError(400, 'clientId does not reference an existing client');
  } else if (!db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId)) {
    throw new HttpError(400, 'clientId does not reference an existing client');
  }
}

export async function nextInvoiceNumber() {
  const db = getDb();
  let nums: string[];
  if (isSupabase()) {
    nums = (sbCheck(await db.from('invoices').select('invoiceNumber')) || []).map((r: any) => r.invoiceNumber);
  } else {
    nums = db.prepare('SELECT invoiceNumber FROM invoices').all().map((r: any) => r.invoiceNumber);
  }
  let max = 0;
  for (const s of nums) {
    const m = /(\d+)\s*$/.exec(s || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return { invoiceNumber: `INV-${String(max + 1).padStart(4, '0')}` };
}

async function fetchInvoiceRaw(id: number) {
  const db = getDb();
  if (isSupabase()) {
    const inv = sbCheck(await db.from('invoices').select('*').eq('id', id).maybeSingle());
    if (!inv) return null;
    const items = sbCheck(await db.from('invoice_items').select('*').eq('invoiceId', id).order('position')) || [];
    return { inv, items };
  }
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!inv) return null;
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoiceId = ? ORDER BY position').all(id);
  return { inv, items };
}

export async function createInvoice(input: InvoiceInput) {
  await ensureClient(input.clientId);
  const invoiceNumber = input.invoiceNumber || (await nextInvoiceNumber()).invoiceNumber;
  const { lines, subtotal, taxAmount, total } = computeTotals(input.items, input.taxRate, input.discount);
  const ts = now();
  const record = {
    invoiceNumber, clientId: input.clientId, status: input.status, issueDate: input.issueDate, dueDate: input.dueDate,
    currency: input.currency, subtotal, taxRate: round2(input.taxRate), taxAmount, discount: round2(input.discount), total,
    notes: input.notes, terms: input.terms, createdAt: ts, updatedAt: ts,
  };
  const db = getDb();
  let id: number;
  if (isSupabase()) {
    const row = sbCheck(await db.from('invoices').insert(record).select('id').single());
    id = Number(row.id);
    if (lines.length) {
      const res = await db.from('invoice_items').insert(lines.map((l) => ({ invoiceId: id, ...l })));
      if (res.error) {
        await db.from('invoices').delete().eq('id', id);
        sbCheck(res);
      }
    }
  } else {
    try {
      id = db.transaction(() => {
        const r = db
          .prepare(
            `INSERT INTO invoices (invoiceNumber,clientId,status,issueDate,dueDate,currency,subtotal,taxRate,taxAmount,discount,total,notes,terms,createdAt,updatedAt)
             VALUES (@invoiceNumber,@clientId,@status,@issueDate,@dueDate,@currency,@subtotal,@taxRate,@taxAmount,@discount,@total,@notes,@terms,@createdAt,@updatedAt)`
          )
          .run(record);
        const newId = Number(r.lastInsertRowid);
        const ins = db.prepare('INSERT INTO invoice_items (invoiceId,description,quantity,unitPrice,amount,position) VALUES (?,?,?,?,?,?)');
        for (const l of lines) ins.run(newId, l.description, l.quantity, l.unitPrice, l.amount, l.position);
        return newId;
      })();
    } catch (e) {
      sqliteUnique(e);
    }
  }
  const raw = await fetchInvoiceRaw(id!);
  return mapInvoice(raw!.inv, raw!.items);
}

export async function getInvoice(id: number) {
  const raw = await fetchInvoiceRaw(id);
  if (!raw) throw new HttpError(404, 'Invoice not found');
  const db = getDb();
  let client: any = null;
  if (raw.inv.clientId !== null && raw.inv.clientId !== undefined) {
    if (isSupabase()) {
      client = sbCheck(await db.from('clients').select('id,name,email,phone,company,address,taxId').eq('id', raw.inv.clientId).maybeSingle());
    } else {
      client = db.prepare('SELECT id,name,email,phone,company,address,taxId FROM clients WHERE id = ?').get(raw.inv.clientId);
    }
  }
  return {
    ...mapInvoice(raw.inv, raw.items),
    client: client
      ? {
          id: Number(client.id), name: client.name, email: client.email ?? null, phone: client.phone ?? null,
          company: client.company ?? null, address: client.address ?? null, taxId: client.taxId ?? null,
        }
      : null,
  };
}

export async function updateInvoice(id: number, input: InvoiceInput) {
  const existing = await fetchInvoiceRaw(id);
  if (!existing) throw new HttpError(404, 'Invoice not found');
  await ensureClient(input.clientId);
  const { lines, subtotal, taxAmount, total } = computeTotals(input.items, input.taxRate, input.discount);
  const record = {
    invoiceNumber: input.invoiceNumber as string, clientId: input.clientId, status: input.status, issueDate: input.issueDate,
    dueDate: input.dueDate, currency: input.currency, subtotal, taxRate: round2(input.taxRate), taxAmount,
    discount: round2(input.discount), total, notes: input.notes, terms: input.terms, updatedAt: now(),
  };
  const db = getDb();
  if (isSupabase()) {
    sbCheck(await db.from('invoices').update(record).eq('id', id));
    sbCheck(await db.from('invoice_items').delete().eq('invoiceId', id));
    if (lines.length) sbCheck(await db.from('invoice_items').insert(lines.map((l) => ({ invoiceId: id, ...l }))));
  } else {
    try {
      db.transaction(() => {
        db.prepare(
          `UPDATE invoices SET invoiceNumber=@invoiceNumber, clientId=@clientId, status=@status, issueDate=@issueDate, dueDate=@dueDate,
           currency=@currency, subtotal=@subtotal, taxRate=@taxRate, taxAmount=@taxAmount, discount=@discount, total=@total,
           notes=@notes, terms=@terms, updatedAt=@updatedAt WHERE id=@id`
        ).run({ ...record, id });
        db.prepare('DELETE FROM invoice_items WHERE invoiceId = ?').run(id);
        const ins = db.prepare('INSERT INTO invoice_items (invoiceId,description,quantity,unitPrice,amount,position) VALUES (?,?,?,?,?,?)');
        for (const l of lines) ins.run(id, l.description, l.quantity, l.unitPrice, l.amount, l.position);
      })();
    } catch (e) {
      sqliteUnique(e);
    }
  }
  const raw = await fetchInvoiceRaw(id);
  return mapInvoice(raw!.inv, raw!.items);
}

export async function updateInvoiceStatus(id: number, status: string) {
  const db = getDb();
  const ts = now();
  let row: any;
  if (isSupabase()) {
    row = sbCheck(await db.from('invoices').update({ status, updatedAt: ts }).eq('id', id).select('id,invoiceNumber,status,updatedAt').maybeSingle());
  } else {
    const r = db.prepare('UPDATE invoices SET status = ?, updatedAt = ? WHERE id = ?').run(status, ts, id);
    if (r.changes > 0) row = db.prepare('SELECT id,invoiceNumber,status,updatedAt FROM invoices WHERE id = ?').get(id);
  }
  if (!row) throw new HttpError(404, 'Invoice not found');
  return { id: Number(row.id), invoiceNumber: row.invoiceNumber, status: row.status, updatedAt: iso(row.updatedAt) };
}

export async function deleteInvoice(id: number) {
  const db = getDb();
  if (isSupabase()) {
    const rows = sbCheck(await db.from('invoices').delete().eq('id', id).select('id')) || [];
    if (rows.length === 0) throw new HttpError(404, 'Invoice not found');
    return { id, success: true };
  }
  const r = db.transaction(() => {
    db.prepare('DELETE FROM invoice_items WHERE invoiceId = ?').run(id);
    return db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  })();
  if (r.changes === 0) throw new HttpError(404, 'Invoice not found');
  return { id, success: true };
}

/* ---------------- Dashboard ---------------- */

export async function dashboardStats() {
  const db = getDb();
  let invoices: any[];
  let totalClients: number;
  if (isSupabase()) {
    invoices = sbCheck(await db.from('invoices').select('id,invoiceNumber,clientId,status,issueDate,dueDate,currency,total,createdAt,clients(name)')) || [];
    const c = await db.from('clients').select('id', { count: 'exact', head: true });
    sbCheck(c);
    totalClients = c.count || 0;
    invoices = invoices.map((r: any) => ({ ...r, clientName: r.clients?.name ?? null }));
  } else {
    invoices = db.prepare('SELECT i.*, c.name AS clientName FROM invoices i LEFT JOIN clients c ON c.id = i.clientId').all();
    totalClients = Number(db.prepare('SELECT COUNT(*) AS c FROM clients').get().c);
  }
  const count = (s: string) => invoices.filter((i) => i.status === s).length;
  const sum = (pred: (i: any) => boolean) => round2(invoices.filter(pred).reduce((a, i) => a + Number(i.total || 0), 0));
  const recent = [...invoices]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime() || Number(b.id) - Number(a.id))
    .slice(0, 5)
    .map((r) => ({
      id: Number(r.id), invoiceNumber: r.invoiceNumber, clientName: r.clientName ?? null, status: r.status,
      issueDate: iso(r.issueDate), currency: r.currency, total: n(r.total),
    }));
  return {
    totalInvoices: invoices.length,
    totalClients,
    draftCount: count('draft'),
    sentCount: count('sent'),
    paidCount: count('paid'),
    overdueCount: count('overdue'),
    totalOutstanding: sum((i) => i.status === 'sent' || i.status === 'overdue'),
    totalPaid: sum((i) => i.status === 'paid'),
    recentInvoices: recent,
  };
}