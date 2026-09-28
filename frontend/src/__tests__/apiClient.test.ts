import apiClient, { apiClient as named, dashboardAPI, invoicesAPI, getErrorMessage } from '../api/client';

describe('api client', () => {
  it('exports same instance as default and named with empty baseURL', () => {
    expect(apiClient).toBe(named);
    expect(apiClient.defaults.baseURL).toBe('');
  });

  it('dashboardAPI.getStats hits /api/dashboard/stats', async () => {
    const data = { draftCount: 1, overdueCount: 0, paidCount: 2, sentCount: 1, totalClients: 3, totalInvoices: 4, totalOutstanding: 10, totalPaid: 20, recentInvoices: [] };
    const spy = jest.spyOn(apiClient, 'get').mockResolvedValue({ data } as any);
    await expect(dashboardAPI.getStats()).resolves.toEqual(data);
    expect(spy).toHaveBeenCalledWith('/api/dashboard/stats');
    spy.mockRestore();
  });

  it('invoicesAPI.updateStatus PATCHes status', async () => {
    const spy = jest.spyOn(apiClient, 'patch').mockResolvedValue({ data: { id: 1, invoiceNumber: 'INV-0001', status: 'paid', updatedAt: '2025-01-01' } } as any);
    const r = await invoicesAPI.updateStatus(1, 'paid');
    expect(r.status).toBe('paid');
    expect(spy).toHaveBeenCalledWith('/api/invoices/1/status', { status: 'paid' });
    spy.mockRestore();
  });

  it('getErrorMessage extracts server error', () => {
    expect(getErrorMessage({ response: { data: { error: 'Not found' } } })).toBe('Not found');
    expect(getErrorMessage({}, 'fallback')).toBe('fallback');
  });
});