jest.mock('../../lib/billowry');
import listHandler from '../../pages/api/invoices/index';
import idHandler from '../../pages/api/invoices/[id]/index';
import statusHandler from '../../pages/api/invoices/[id]/status';
import nextHandler from '../../pages/api/invoices/next-number';
import * as svc from '../../lib/billowry';
import { HttpError } from '../../lib/validation';
import { mockReq, mockRes } from './helpers';

const invoice = {
  id: 1, invoiceNumber: 'INV-0001', clientId: 1, status: 'draft', issueDate: '2025-01-01T00:00:00.000Z', dueDate: null,
  currency: 'USD', subtotal: 100, taxRate: 10, taxAmount: 10, discount: 0, total: 110, notes: null, terms: null,
  createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
  items: [{ id: 1, description: 'Work', quantity: 1, unitPrice: 100, amount: 100, position: 0 }],
};
const body = {
  invoiceNumber: 'INV-0001', clientId: 1, status: 'draft', issueDate: '2025-01-01', dueDate: null, currency: 'USD',
  taxRate: 10, discount: 0, notes: null, terms: null, items: [{ description: 'Work', quantity: 1, unitPrice: 100 }],
};

describe('invoices API', () => {
  beforeEach(() => jest.resetAllMocks());

  it('GET /api/invoices filters', async () => {
    (svc.listInvoices as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    await listHandler(mockReq('GET', { status: 'paid', clientId: '2' }), res);
    expect(res.statusCode).toBe(200);
    expect(svc.listInvoices).toHaveBeenCalledWith({ status: 'paid', clientId: 2 });
  });
  it('GET /api/invoices rejects bad status', async () => {
    const res = mockRes();
    await listHandler(mockReq('GET', { status: 'nope' }), res);
    expect(res.statusCode).toBe(400);
  });
  it('POST /api/invoices creates', async () => {
    (svc.createInvoice as jest.Mock).mockResolvedValue(invoice);
    const res = mockRes();
    await listHandler(mockReq('POST', {}, body), res);
    expect(res.statusCode).toBe(201);
    expect(res.body.total).toBe(110);
  });
  it('POST /api/invoices requires items array', async () => {
    const res = mockRes();
    await listHandler(mockReq('POST', {}, { issueDate: '2025-01-01' }), res);
    expect(res.statusCode).toBe(400);
  });
  it('GET /api/invoices/{id} returns invoice', async () => {
    (svc.getInvoice as jest.Mock).mockResolvedValue({ ...invoice, client: null });
    const res = mockRes();
    await idHandler(mockReq('GET', { id: '1' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });
  it('GET /api/invoices/{id} 404', async () => {
    (svc.getInvoice as jest.Mock).mockRejectedValue(new HttpError(404, 'Invoice not found'));
    const res = mockRes();
    await idHandler(mockReq('GET', { id: '42' }), res);
    expect(res.statusCode).toBe(404);
  });
  it('PUT /api/invoices/{id} updates', async () => {
    (svc.updateInvoice as jest.Mock).mockResolvedValue(invoice);
    const res = mockRes();
    await idHandler(mockReq('PUT', { id: '1' }, body), res);
    expect(res.statusCode).toBe(200);
  });
  it('PUT /api/invoices/{id} requires invoiceNumber', async () => {
    const res = mockRes();
    await idHandler(mockReq('PUT', { id: '1' }, { ...body, invoiceNumber: '' }), res);
    expect(res.statusCode).toBe(400);
  });
  it('PATCH /api/invoices/{id}/status updates', async () => {
    (svc.updateInvoiceStatus as jest.Mock).mockResolvedValue({ id: 1, invoiceNumber: 'INV-0001', status: 'paid', updatedAt: invoice.updatedAt });
    const res = mockRes();
    await statusHandler(mockReq('PATCH', { id: '1' }, { status: 'paid' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('paid');
  });
  it('PATCH /api/invoices/{id}/status rejects invalid', async () => {
    const res = mockRes();
    await statusHandler(mockReq('PATCH', { id: '1' }, { status: 'lost' }), res);
    expect(res.statusCode).toBe(400);
  });
  it('DELETE /api/invoices/{id} deletes', async () => {
    (svc.deleteInvoice as jest.Mock).mockResolvedValue({ id: 1, success: true });
    const res = mockRes();
    await idHandler(mockReq('DELETE', { id: '1' }), res);
    expect(res.body.success).toBe(true);
  });
  it('DELETE /api/invoices/{id} 404', async () => {
    (svc.deleteInvoice as jest.Mock).mockRejectedValue(new HttpError(404, 'Invoice not found'));
    const res = mockRes();
    await idHandler(mockReq('DELETE', { id: '9' }), res);
    expect(res.statusCode).toBe(404);
  });
  it('GET /api/invoices/next-number', async () => {
    (svc.nextInvoiceNumber as jest.Mock).mockResolvedValue({ invoiceNumber: 'INV-0005' });
    const res = mockRes();
    await nextHandler(mockReq('GET'), res);
    expect(res.body.invoiceNumber).toBe('INV-0005');
  });
  it('GET /api/invoices/next-number handles failure', async () => {
    (svc.nextInvoiceNumber as jest.Mock).mockRejectedValue(new Error('db down'));
    const res = mockRes();
    await nextHandler(mockReq('GET'), res);
    expect(res.statusCode).toBe(500);
  });
});