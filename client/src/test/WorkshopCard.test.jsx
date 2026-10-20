import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import WorkshopCard from '../components/WorkshopCard.jsx';

const mockAvailableWorkshop = {
  id: 1,
  title: 'Distributed Systems Masterclass',
  description: 'Deep dive into consensus and concurrency control.',
  instructor: 'Dr. Evelyn Vance',
  location: 'Lab 304',
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  capacity: 10,
  seatsLeft: 7
};

const mockSoldOutWorkshop = {
  ...mockAvailableWorkshop,
  id: 2,
  title: 'Sold Out Workshop',
  capacity: 5,
  seatsLeft: 0
};

describe('WorkshopCard Component', () => {
  it('renders workshop details correctly', () => {
    render(
      <BrowserRouter>
        <WorkshopCard workshop={mockAvailableWorkshop} />
      </BrowserRouter>
    );

    expect(screen.getByText('Distributed Systems Masterclass')).toBeInTheDocument();
    expect(screen.getByText('Dr. Evelyn Vance')).toBeInTheDocument();
    expect(screen.getByText('Lab 304')).toBeInTheDocument();
    expect(screen.getByText('7 Seats Available')).toBeInTheDocument();
  });

  it('renders Sold Out badge when no seats remain', () => {
    render(
      <BrowserRouter>
        <WorkshopCard workshop={mockSoldOutWorkshop} />
      </BrowserRouter>
    );

    expect(screen.getByText('Sold Out')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });
});
