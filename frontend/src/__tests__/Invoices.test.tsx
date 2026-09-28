import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Invoices from '@/pages/invoices';
import apiClient from '@/api/client';

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/api/client', () => ({ __esModule: true, default: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

const rows = [
  { clientId: 1, clientName: 'Acme Corp', currency: 'USD', dueDate: '2024-02-01T00:00:00Z', id: 1, invoiceNumber: 'INV-0001', issueDate: '2024-01-01T00:00:00Z', status: 'paid', total: 1200 },
  { clientId: null, clientName: null, currency: 'USD', dueDate: null, id: 2, invoiceNumber: 'INV-0002', issueDate: '2024-01-05T00:00:00Z', status: 'draft', total: 300 },
];

describe('Invoices page', () => {
  beforeEach(() => { mockGet.mockReset(); push.mockReset(); });

  it('renders invoices from API', async () => {
    mockGet.mockResolvedValue({ data: rows });
    render(<Invoices />);
    expect(await screen.findByText('INV-0001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('No client')).toBeInTheDocument();
  });

  it('filters by search and navigates on row click', async () => {
    mockGet.mockResolvedValue({ data: rows });
    render(<Invoices />);
    await screen.findByText('INV-0001');
    fireEvent.change(screen.getByLabelText('Search invoices'), { target: { value: 'acme' } });
    expect(screen.queryByText('INV-0002')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('INV-0001'));
    expect(push).toHaveBeenCalledWith('/invoices/1');
  });

  it('refetches with status filter', async () => {
    mockGet.mockResolvedValue({ data: rows });
    render(<Invoices />);
    await screen.findByText('INV-0001');
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'paid' } });
    await waitFor(() => expect(mockGet).toHaveBeenLastCalledWith('/api/invoices', { params: { status: 'paid' } }));
  });

  it('shows error state', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    render(<Invoices />);
    expect(await screen.findByText(/Failed to load invoices/)).toBeInTheDocument();
  });
});