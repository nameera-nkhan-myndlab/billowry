import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewClient from '@/pages/clients/new';
import apiClient from '@/api/client';

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }));
jest.mock('next/head', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock('@/api/client', () => ({ __esModule: true, default: { post: jest.fn() } }));

const mockedPost = (apiClient as any).post as jest.Mock;

describe('NewClient page', () => {
  beforeEach(() => { push.mockReset(); mockedPost.mockReset(); });

  it('renders the form', () => {
    render(<NewClient />);
    expect(screen.getByRole('heading', { name: 'New Client' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
  });

  it('shows validation error when name is empty', async () => {
    render(<NewClient />);
    fireEvent.click(screen.getByRole('button', { name: 'Create Client' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('submits and redirects on success', async () => {
    mockedPost.mockResolvedValue({
      data: {
        id: 7, name: 'Acme Corp', email: 'billing@acme.com', phone: null, company: 'Acme',
        address: null, taxId: null, notes: null,
        createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
      },
    });
    render(<NewClient />);
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'billing@acme.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Client' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/clients'));
    expect(mockedPost).toHaveBeenCalledWith('/api/clients', expect.objectContaining({ name: 'Acme Corp', email: 'billing@acme.com' }));
  });

  it('shows API error on failure', async () => {
    mockedPost.mockRejectedValue({ response: { data: { error: 'Name is required' } } });
    render(<NewClient />);
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Client' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Name is required');
    expect(push).not.toHaveBeenCalled();
  });
});