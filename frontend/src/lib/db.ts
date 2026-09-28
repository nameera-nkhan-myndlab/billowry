import path from 'path';

let db: any = null;

export function getDb() {
  if (db) return db;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = require('@supabase/supabase-js');
    db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    return db;
  }

  // VMSS preview only — Supabase env vars are absent.
  const Database = require('better-sqlite3');
  db = new Database(path.join('/tmp', 'app.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      company TEXT,
      address TEXT,
      taxId TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceNumber TEXT NOT NULL UNIQUE,
      clientId INTEGER NULL REFERENCES clients(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      issueDate TEXT NOT NULL,
      dueDate TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      subtotal REAL NOT NULL DEFAULT 0,
      taxRate REAL NOT NULL DEFAULT 0,
      taxAmount REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      terms TEXT,
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unitPrice REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      UNIQUE (invoiceId, position)
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as c FROM clients').get();
  if (count.c === 0) {
    const insClient = db.prepare(
      'INSERT INTO clients (name, email, phone, company, address, taxId, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const insInv = db.prepare(
      `INSERT INTO invoices (invoiceNumber, clientId, status, issueDate, dueDate, currency, subtotal, taxRate, taxAmount, discount, total, notes, terms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insItem = db.prepare(
      'INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, amount, position) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const seed = db.transaction(() => {
      const c1 = insClient.run('Ava Thompson', 'ava@northwind.io', '+1 555 0101', 'Northwind Studio', '12 Harbor St, Boston, MA', 'US-88231', 'Prefers net-15').lastInsertRowid;
      const c2 = insClient.run('Liam Chen', 'liam@brightpixel.co', '+1 555 0102', 'BrightPixel', '400 Market St, San Francisco, CA', null, null).lastInsertRowid;
      const c3 = insClient.run('Sofia Rossi', 'sofia@verdeworks.eu', '+39 02 5550 103', 'Verde Works', 'Via Roma 8, Milan', 'IT-99812', 'Invoice in EUR').lastInsertRowid;
      const c4 = insClient.run('Noah Patel', 'noah@summitlabs.com', '+1 555 0104', 'Summit Labs', '77 Pine Ave, Denver, CO', null, null).lastInsertRowid;
      const i1 = insInv.run('INV-0001', c1, 'paid', '2025-01-05T00:00:00.000Z', '2025-01-20T00:00:00.000Z', 'USD', 2400, 10, 240, 0, 2640, 'Brand identity package', 'Net 15').lastInsertRowid;
      insItem.run(i1, 'Logo design', 1, 1200, 1200, 0);
      insItem.run(i1, 'Brand guidelines', 1, 1200, 1200, 1);
      const i2 = insInv.run('INV-0002', c2, 'sent', '2025-02-01T00:00:00.000Z', '2025-03-03T00:00:00.000Z', 'USD', 1500, 8, 120, 100, 1520, 'Website maintenance', 'Net 30').lastInsertRowid;
      insItem.run(i2, 'Monthly maintenance', 3, 500, 1500, 0);
      const i3 = insInv.run('INV-0003', c3, 'overdue', '2024-12-10T00:00:00.000Z', '2025-01-10T00:00:00.000Z', 'EUR', 900, 22, 198, 0, 1098, 'Consulting hours', 'Net 30').lastInsertRowid;
      insItem.run(i3, 'Consulting (hours)', 12, 75, 900, 0);
      const i4 = insInv.run('INV-0004', c4, 'draft', '2025-03-01T00:00:00.000Z', '2025-03-31T00:00:00.000Z', 'USD', 3200, 0, 0, 200, 3000, 'Mobile app sprint', 'Net 30').lastInsertRowid;
      insItem.run(i4, 'Sprint development', 2, 1600, 3200, 0);
    });
    seed();
  }

  return db;
}

// Every caller that does CRUD MUST branch on this.
export function isSupabase(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}