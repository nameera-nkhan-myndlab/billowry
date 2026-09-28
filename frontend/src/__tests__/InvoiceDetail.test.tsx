import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import InvoiceDetail from '@/pages/invoices/[id]';
import apiClient from '@/api/client';

const push = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({ query: { id: '1' }, push }),
}));
jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mocked = apiClient as unknown as { get: jest.Mock; patch: jest.Mock; delete: jest.Mock };

const invoice = {
  client: { address: '1 Main St', company: 'Acme', email: 'a@acme.com', id: 2, name: 'Jane Doe', phone: '555', taxId: 'TX1' },
  clientId: 2,
  createdAt: '2024-01-01T00:00:00Z',
  currency: 'USD',
  discount: 10,
  dueDate: '2024-02-01T00:00:00Z',
  id: 1,
  invoiceNumber: 'INV-0001',
  issueDate: '2024-01-01T00:00:00Z',
  items: [{ amount: 200, description: 'Design work', id: 5, position: 0, quantity: 2, unitPrice: 100 }],
  notes: 'Thanks',
  status: 'sent',
  subtotal: 200,
  taxAmount: 20,
  taxRate: 10,
  terms: 'Net 30',
  total: 210,
  updatedAt: '2024-01-01T00:00:00Z',
};

beforeEach(() => jest.clearAllMocks());

describe('InvoiceDetail page', () => {
  it('renders invoice data', async () => {
    mocked.get.mockResolvedValue({ data: invoice });
    render(<InvoiceDetail />);
    expect(await screen.findByText('Invoice INV-0001')).toBeInTheDocument();
    expect(screen.getByText('Design work')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByTestId('invoice-total')).toHaveTextContent('$210.00');
    expect(mocked.get).toHaveBeenCalledWith('/api/invoices/1');
  });

  it('shows error when not found', async () => {
    mocked.get.mockRejectedValue({ response: { status: 404 } });
    render(<InvoiceDetail />);
    expect(await screen.findByText('Invoice not found.')).toBeInTheDocument();
  });

  it('updates status via PATCH', async () => {
    mocked.get.mockResolvedValue({ data: invoice });
    mocked.patch.mockResolvedValue({ data: { id: 1, invoiceNumber: 'INV-0001', status: 'paid', updatedAt: '2024-01-05T00:00:00Z' } });
    render(<InvoiceDetail />);
    const select = await screen.findByLabelText('Status', { selector: 'select' });
    fireEvent.change(select, { target: { value: 'paid' } });
    await waitFor(() => expect(mocked.patch).toHaveBeenCalledWith('/api/invoices/1/status', { status: 'paid' }));
    await waitFor(() => expect((select as HTMLSelectElement).value).toBe('paid'));
  });

  it('deletes and navigates back', async () => {
    mocked.get.mockResolvedValue({ data: invoice });
    mocked.delete.mockResolvedValue({ data: { id: 1, success: true } });
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<InvoiceDetail />);
    fireEvent.click(await screen.findByText('Delete'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/invoices'));
    expect(mocked.delete).toHaveBeenCalledWith('/api/invoices/1');
  });

  it('print button calls window.print', async () => {
    mocked.get.mockResolvedValue({ data: invoice });
    const spy = jest.spyOn(window, 'print').mockImplementation(() => {});
    render(<InvoiceDetail />);
    fireEvent.click(await screen.findByText('Print'));
    expect(spy).toHaveBeenCalled();
  });
});