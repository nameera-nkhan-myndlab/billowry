import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const push = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({ query: { id: '1' }, isReady: true, push }),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) => <span data-href={href} {...rest}>{children}</span>,
}));
jest.mock('@/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() },
}));

import apiClient from '@/api/client';
import EditClient from '@/pages/clients/[id]/edit';

const mockClient = {
  id: 1,
  name: 'Acme Corp',
  email: 'billing@acme.com',
  phone: '555-0100',
  company: 'Acme',
  address: '1 Main St',
  taxId: 'TX-1',
  notes: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  invoices: [],
};

describe('EditClient page', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads and renders client values', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockClient });
    render(<EditClient />);
    expect(await screen.findByDisplayValue('Acme Corp')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/clients/1');
  });

  it('submits updates and navigates to clients', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockClient });
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { ...mockClient, name: 'Acme Inc' } });
    render(<EditClient />);
    const nameInput = await screen.findByLabelText(/Name/, { selector: '#client-name' });
    fireEvent.change(nameInput, { target: { value: 'Acme Inc' } });
    fireEvent.click(screen.getByText('Save changes'));
    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/api/clients/1', expect.objectContaining({ name: 'Acme Inc', notes: null })));
    expect(push).toHaveBeenCalledWith('/clients');
  });

  it('shows validation error when name is empty', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockClient });
    render(<EditClient />);
    const nameInput = await screen.findByDisplayValue('Acme Corp');
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Save changes'));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(apiClient.put).not.toHaveBeenCalled();
  });

  it('shows not found error on 404', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue({ response: { status: 404 } });
    render(<EditClient />);
    expect(await screen.findByText('Client not found.')).toBeInTheDocument();
  });
});