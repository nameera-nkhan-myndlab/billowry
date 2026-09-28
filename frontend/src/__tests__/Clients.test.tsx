import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Clients from '@/pages/clients';
import apiClient from '@/api/client';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const api = apiClient as unknown as {
  get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock;
};

const list = [
  { id: 1, name: 'Acme Corp', email: 'billing@acme.com', phone: '555-0100', company: 'Acme', createdAt: '2024-01-10T00:00:00Z', invoiceCount: 3 },
  { id: 2, name: 'Globex', email: null, phone: null, company: null, createdAt: '2024-02-10T00:00:00Z', invoiceCount: 0 },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Clients page', () => {
  it('renders clients from the API', async () => {
    api.get.mockResolvedValueOnce({ data: list });
    render(<Clients />);
    expect(screen.getByText('Loading clients...')).toBeInTheDocument();
    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/api/clients');
  });

  it('shows error state on failure', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    render(<Clients />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load clients.');
  });

  it('filters by search', async () => {
    api.get.mockResolvedValueOnce({ data: list });
    render(<Clients />);
    await screen.findByText('Acme Corp');
    fireEvent.change(screen.getByLabelText('Search clients'), { target: { value: 'glob' } });
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('creates a client via the form', async () => {
    api.get.mockResolvedValue({ data: list });
    api.post.mockResolvedValueOnce({
      data: { id: 3, name: 'Initech', email: null, phone: null, company: null, address: null, taxId: null, notes: null, createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z' },
    });
    render(<Clients />);
    await screen.findByText('Acme Corp');
    fireEvent.click(screen.getByText('Add Client'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Initech' } });
    fireEvent.click(screen.getByText('Save Client'));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/api/clients', expect.objectContaining({ name: 'Initech', email: null }))
    );
  });

  it('validates required name', async () => {
    api.get.mockResolvedValueOnce({ data: list });
    render(<Clients />);
    await screen.findByText('Acme Corp');
    fireEvent.click(screen.getByText('Add Client'));
    fireEvent.click(screen.getByText('Save Client'));
    expect(await screen.findByText('Name is required.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('opens detail drawer with invoices on row click', async () => {
    api.get.mockResolvedValueOnce({ data: list }).mockResolvedValueOnce({
      data: {
        id: 1, name: 'Acme Corp', email: 'billing@acme.com', phone: '555-0100', company: 'Acme',
        address: '1 Road', taxId: 'TX1', notes: null, createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z',
        invoices: [{ id: 9, invoiceNumber: 'INV-0009', status: 'paid', issueDate: '2024-01-12T00:00:00Z', dueDate: null, currency: 'USD', total: 120 }],
      },
    });
    render(<Clients />);
    fireEvent.click(await screen.findByText('Acme Corp'));
    expect(await screen.findByText('INV-0009')).toBeInTheDocument();
    expect(api.get).toHaveBeenLastCalledWith('/api/clients/1');
  });
});