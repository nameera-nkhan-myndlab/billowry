jest.mock('../../lib/billowry');
import handler from '../../pages/api/dashboard/stats';
import * as svc from '../../lib/billowry';
import { mockReq, mockRes } from './helpers';

const stats = {
  totalInvoices: 1, totalClients: 1, draftCount: 0, sentCount: 1, paidCount: 0, overdueCount: 0,
  totalOutstanding: 100, totalPaid: 0,
  recentInvoices: [{ id: 1, invoiceNumber: 'INV-0001', clientName: 'Ava', status: 'sent', issueDate: '2025-01-01T00:00:00.000Z', currency: 'USD', total: 100 }],
};

describe('GET /api/dashboard/stats', () => {
  it('returns stats', async () => {
    (svc.dashboardStats as jest.Mock).mockResolvedValue(stats);
    const res = mockRes();
    await handler(mockReq('GET'), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.totalOutstanding).toBe(100);
  });
  it('rejects POST', async () => {
    const res = mockRes();
    await handler(mockReq('POST'), res);
    expect(res.statusCode).toBe(405);
  });
});