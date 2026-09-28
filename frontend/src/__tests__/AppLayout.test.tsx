import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AppLayout, { NAV_ITEMS } from '../components/layout/AppLayout';

jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/invoices' }) }));

describe('AppLayout', () => {
  it('renders brand, nav links and children', () => {
    render(<AppLayout><p>Page body</p></AppLayout>);
    expect(screen.getAllByText('Billowry').length).toBeGreaterThan(0);
    NAV_ITEMS.forEach((i) => expect(screen.getAllByText(i.label).length).toBeGreaterThan(0));
    expect(screen.getByText('Page body')).toBeInTheDocument();
  });

  it('opens and closes the mobile drawer', () => {
    render(<AppLayout><p>x</p></AppLayout>);
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close menu'));
    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument();
  });
});