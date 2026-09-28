import { computeTotals, validateInvoice, validateClient, HttpError } from '../../lib/validation';

describe('validation', () => {
  it('computes totals', () => {
    const t = computeTotals([{ description: 'a', quantity: 2, unitPrice: 50, position: 0 }], 10, 5);
    expect(t.subtotal).toBe(100);
    expect(t.taxAmount).toBe(10);
    expect(t.total).toBe(105);
    expect(t.lines[0].amount).toBe(100);
  });
  it('rejects client without name', () => {
    expect(() => validateClient({ email: 'x@y.com' })).toThrow(HttpError);
  });
  it('rejects invoice without issueDate', () => {
    expect(() => validateInvoice({ items: [] }, false)).toThrow('issueDate is required');
  });
  it('rejects invalid status on strict update', () => {
    expect(() =>
      validateInvoice({ invoiceNumber: 'INV-1', currency: 'USD', taxRate: 0, discount: 0, status: 'bogus', issueDate: '2025-01-01', items: [] }, true)
    ).toThrow(HttpError);
  });
});