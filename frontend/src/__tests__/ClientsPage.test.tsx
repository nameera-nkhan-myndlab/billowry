import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Clients from '@/pages/clients';
import apiClient from '@/api/client';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mocked = apiClient as unknown as {
  get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock;
};

const list = [
  { id: 1, name: 'Acme Corp', email: 'billing@acme.com', phone: '555-0100', company: 'Acme', createdAt: '2024-01-01T00:00:00Z', invoiceCount: 3 },
];

beforeEach(() => {
  jest.resetAllMocks();
  mocked.get.mockResolvedValue({ data: list });
});

test('renders client list', async () => {
  render(<Clients />);
  expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
  expect(mocked.get).toHaveBeenCalledWith('/api/clients');
});

test('shows error state', async () => {
  mocked.get.mockRejectedValueOnce(new Error('x'));
  render(<Clients />);
  expect(await screen.findByText(/Failed to load clients/)).toBeInTheDocument();
});

test('creates a client via form', async () => {
  mocked.post.mockResolvedValue({
    data: { id: 2, name: 'Globex', email: null, phone: null, company: null, address: null, taxId: null, notes: null, createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
  });
  render(<Clients />);
  await screen.findByText('Acme Corp');
  fireEvent.click(screen.getByText('Add Client'));
  fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Globex' } });
  fireEvent.click(screen.getByText('Save Client'));
  await waitFor(() =>
    expect(mocked.post).toHaveBeenCalledWith('/api/clients', expect.objectContaining({ name: 'Globex' }))
  );
});

test('validates required name', async () => {
  render(<Clients />);
  await screen.findByText('Acme Corp');
  fireEvent.click(screen.getByText('Add Client'));
  fireEvent.click(screen.getByText('Save Client'));
  expect(await screen.findByText('Name is required.')).toBeInTheDocument();
  expect(mocked.post).not.toHaveBeenCalled();
});

test('filters by search', async () => {
  render(<Clients />);
  await screen.findByText('Acme Corp');
  fireEvent.change(screen.getByLabelText('Search clients'), { target: { value: 'zzz' } });
  expect(screen.getByText('No clients found.')).toBeInTheDocument();
});