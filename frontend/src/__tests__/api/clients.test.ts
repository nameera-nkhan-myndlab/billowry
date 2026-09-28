jest.mock('../../lib/billowry');
import listHandler from '../../pages/api/clients/index';
import idHandler from '../../pages/api/clients/[id]';
import * as svc from '../../lib/billowry';
import { HttpError } from '../../lib/validation';
import { mockReq, mockRes } from './helpers';

const client = {
  id: 1, name: 'Ava', email: 'ava@x.com', phone: null, company: null, address: null, taxId: null, notes: null,
  createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('clients API', () => {
  beforeEach(() => jest.resetAllMocks());

  it('GET /api/clients lists', async () => {
    (svc.listClients as jest.Mock).mockResolvedValue([{ id: 1, name: 'Ava', email: null, phone: null, company: null, createdAt: client.createdAt, invoiceCount: 2 }]);
    const res = mockRes();
    await listHandler(mockReq('GET', { search: 'av' }), res);
    expect(res.statusCode).toBe(200);
    expect(svc.listClients).toHaveBeenCalledWith('av');
    expect(res.body[0].invoiceCount).toBe(2);
  });
  it('GET /api/clients handles db failure', async () => {
    (svc.listClients as jest.Mock).mockRejectedValue(new Error('boom'));
    const res = mockRes();
    await listHandler(mockReq('GET'), res);
    expect(res.statusCode).toBe(500);
  });
  it('POST /api/clients creates', async () => {
    (svc.createClient as jest.Mock).mockResolvedValue(client);
    const res = mockRes();
    await listHandler(mockReq('POST', {}, { name: 'Ava', email: 'ava@x.com' }), res);
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(1);
  });
  it('POST /api/clients validates name', async () => {
    const res = mockRes();
    await listHandler(mockReq('POST', {}, { email: 'ava@x.com' }), res);
    expect(res.statusCode).toBe(400);
  });
  it('GET /api/clients/{id} returns client', async () => {
    (svc.getClient as jest.Mock).mockResolvedValue({ ...client, invoices: [] });
    const res = mockRes();
    await idHandler(mockReq('GET', { id: '1' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.invoices).toEqual([]);
  });
  it('GET /api/clients/{id} 404', async () => {
    (svc.getClient as jest.Mock).mockRejectedValue(new HttpError(404, 'Client not found'));
    const res = mockRes();
    await idHandler(mockReq('GET', { id: '99' }), res);
    expect(res.statusCode).toBe(404);
  });
  it('PUT /api/clients/{id} updates', async () => {
    (svc.updateClient as jest.Mock).mockResolvedValue({ ...client, name: 'Ava T' });
    const res = mockRes();
    await idHandler(mockReq('PUT', { id: '1' }, { name: 'Ava T' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Ava T');
  });
  it('PUT /api/clients/{id} rejects bad id', async () => {
    const res = mockRes();
    await idHandler(mockReq('PUT', { id: 'abc' }, { name: 'X' }), res);
    expect(res.statusCode).toBe(400);
  });
  it('DELETE /api/clients/{id} deletes', async () => {
    (svc.deleteClient as jest.Mock).mockResolvedValue({ id: 1, success: true });
    const res = mockRes();
    await idHandler(mockReq('DELETE', { id: '1' }), res);
    expect(res.body).toEqual({ id: 1, success: true });
  });
  it('DELETE /api/clients/{id} 404', async () => {
    (svc.deleteClient as jest.Mock).mockRejectedValue(new HttpError(404, 'Client not found'));
    const res = mockRes();
    await idHandler(mockReq('DELETE', { id: '5' }), res);
    expect(res.statusCode).toBe(404);
  });
});