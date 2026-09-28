INSERT INTO clients (name, email, phone, company, address, "taxId", notes) VALUES
  ('Ava Thompson', 'ava@northwind.io', '+1 555 0101', 'Northwind Studio', '12 Harbor St, Boston, MA', 'US-88231', 'Prefers net-15'),
  ('Liam Chen', 'liam@brightpixel.co', '+1 555 0102', 'BrightPixel', '400 Market St, San Francisco, CA', NULL, NULL),
  ('Sofia Rossi', 'sofia@verdeworks.eu', '+39 02 5550 103', 'Verde Works', 'Via Roma 8, Milan', 'IT-99812', 'Invoice in EUR'),
  ('Noah Patel', 'noah@summitlabs.com', '+1 555 0104', 'Summit Labs', '77 Pine Ave, Denver, CO', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO invoices ("invoiceNumber", "clientId", status, "issueDate", "dueDate", currency, subtotal, "taxRate", "taxAmount", discount, total, notes, terms)
SELECT 'INV-0001', id, 'paid', '2025-01-05', '2025-01-20', 'USD', 2400.00, 10.00, 240.00, 0.00, 2640.00, 'Brand identity package', 'Net 15'
FROM clients WHERE email = 'ava@northwind.io'
ON CONFLICT ("invoiceNumber") DO NOTHING;

INSERT INTO invoices ("invoiceNumber", "clientId", status, "issueDate", "dueDate", currency, subtotal, "taxRate", "taxAmount", discount, total, notes, terms)
SELECT 'INV-0002', id, 'sent', '2025-02-01', '2025-03-03', 'USD', 1500.00, 8.00, 120.00, 100.00, 1520.00, 'Website maintenance', 'Net 30'
FROM clients WHERE email = 'liam@brightpixel.co'
ON CONFLICT ("invoiceNumber") DO NOTHING;

INSERT INTO invoices ("invoiceNumber", "clientId", status, "issueDate", "dueDate", currency, subtotal, "taxRate", "taxAmount", discount, total, notes, terms)
SELECT 'INV-0003', id, 'overdue', '2024-12-10', '2025-01-10', 'EUR', 900.00, 22.00, 198.00, 0.00, 1098.00, 'Consulting hours', 'Net 30'
FROM clients WHERE email = 'sofia@verdeworks.eu'
ON CONFLICT ("invoiceNumber") DO NOTHING;

INSERT INTO invoices ("invoiceNumber", "clientId", status, "issueDate", "dueDate", currency, subtotal, "taxRate", "taxAmount", discount, total, notes, terms)
SELECT 'INV-0004', id, 'draft', '2025-03-01', '2025-03-31', 'USD', 3200.00, 0.00, 0.00, 200.00, 3000.00, 'Mobile app sprint', 'Net 30'
FROM clients WHERE email = 'noah@summitlabs.com'
ON CONFLICT ("invoiceNumber") DO NOTHING;

INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", amount, position)
SELECT id, 'Logo design', 1.00, 1200.00, 1200.00, 0 FROM invoices WHERE "invoiceNumber" = 'INV-0001'
ON CONFLICT ("invoiceId", position) DO NOTHING;
INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", amount, position)
SELECT id, 'Brand guidelines', 1.00, 1200.00, 1200.00, 1 FROM invoices WHERE "invoiceNumber" = 'INV-0001'
ON CONFLICT ("invoiceId", position) DO NOTHING;
INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", amount, position)
SELECT id, 'Monthly maintenance', 3.00, 500.00, 1500.00, 0 FROM invoices WHERE "invoiceNumber" = 'INV-0002'
ON CONFLICT ("invoiceId", position) DO NOTHING;
INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", amount, position)
SELECT id, 'Consulting (hours)', 12.00, 75.00, 900.00, 0 FROM invoices WHERE "invoiceNumber" = 'INV-0003'
ON CONFLICT ("invoiceId", position) DO NOTHING;
INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", amount, position)
SELECT id, 'Sprint development', 2.00, 1600.00, 3200.00, 0 FROM invoices WHERE "invoiceNumber" = 'INV-0004'
ON CONFLICT ("invoiceId", position) DO NOTHING;