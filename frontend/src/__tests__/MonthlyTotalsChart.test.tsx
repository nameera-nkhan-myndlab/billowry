import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonthlyTotalsChart from '@/components/MonthlyTotalsChart';

describe('MonthlyTotalsChart', () => {
  it('renders legend and bars for each month', () => {
    const data = [
      { month: '2024-01', paid: 100, outstanding: 50 },
      { month: '2024-02', paid: 0, outstanding: 20 },
    ];
    const { container } = render(<MonthlyTotalsChart data={data} />);
    expect(screen.getByText('Last 12 months')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Outstanding')).toBeInTheDocument();
    expect(container.querySelectorAll('rect')).toHaveLength(4);
    expect(container.querySelector('rect')).toHaveAttribute('fill', '#00D5D8');
  });

  it('shows empty state when no data', () => {
    render(<MonthlyTotalsChart data={[]} />);
    expect(screen.getByText('No data yet.')).toBeInTheDocument();
  });
});
