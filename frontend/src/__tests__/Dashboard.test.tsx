import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '@/pages/index';
import apiClient from '@/api/client';

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/api/client', () => ({ __esModule: true, default: { get: jest.fn() } }));

const mockStats = {
  draftCount: 1,
  overdueCount: 1,
  paidCount: 2,
  sentCount: 1,
  totalClients: 3,
  totalInvoices: 5,
  totalOutstanding: 1500,
  totalPaid: 4200,
  recentInvoices: [
    { clientName: 'Acme Corp', currency: 'USD', id: 7, invoiceNumber: 'INV-0007', issueDate: '2024-05-01T00:00:00Z', status: 'sent', total: 1500 },
  ],
};

describe('Dashboard page', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders stats from API', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockStats });
    render(<Dashboard />);
    expect(await screen.findByText('INV-0007')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Total Invoices')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/dashboard/stats');
  });

  it('navigates to invoice detail on row click', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockStats });
    render(<Dashboard />);
    fireEvent.click(await screen.findByTestId('row-7'));
    expect(push).toHaveBeenCalledWith('/invoices/7');
  });

  it('shows error and retries', async () => {
    (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce({ data: mockStats });
    render(<Dashboard />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load');
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(screen.getByText('INV-0007')).toBeInTheDocument());
  });
});