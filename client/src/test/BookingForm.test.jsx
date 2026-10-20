import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import BookingForm from '../components/BookingForm.jsx';

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

const mockActiveWorkshop = {
  id: 1,
  title: 'Concurrency Masterclass',
  capacity: 5,
  seatsLeft: 5
};

const mockSoldOutWorkshop = {
  id: 2,
  title: 'Full Masterclass',
  capacity: 5,
  seatsLeft: 0
};

describe('BookingForm Component', () => {
  it('renders student name and email input fields', () => {
    renderWithClient(<BookingForm workshop={mockActiveWorkshop} />);

    expect(screen.getByLabelText(/Student Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/College Email Address/i)).toBeInTheDocument();
    expect(screen.getByTestId('submit-booking-button')).toBeInTheDocument();
  });

  it('displays client-side validation errors when submitting blank inputs', async () => {
    renderWithClient(<BookingForm workshop={mockActiveWorkshop} />);

    const submitBtn = screen.getByTestId('submit-booking-button');
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Student name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Email address is required/i)).toBeInTheDocument();
  });

  it('validates invalid email format', async () => {
    renderWithClient(<BookingForm workshop={mockActiveWorkshop} />);

    const nameInput = screen.getByLabelText(/Student Full Name/i);
    const emailInput = screen.getByLabelText(/College Email Address/i);

    fireEvent.change(nameInput, { target: { value: 'Alex Morgan' } });
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });

    fireEvent.click(screen.getByTestId('submit-booking-button'));

    expect(await screen.findByText(/Please provide a valid email address/i)).toBeInTheDocument();
  });

  it('disables inputs and shows sold-out state when seatsLeft is 0', () => {
    renderWithClient(<BookingForm workshop={mockSoldOutWorkshop} />);

    expect(screen.getByTestId('booking-soldout-alert')).toBeInTheDocument();
    expect(screen.getByLabelText(/Student Full Name/i)).toBeDisabled();
    expect(screen.getByLabelText(/College Email Address/i)).toBeDisabled();
    expect(screen.getByTestId('submit-booking-button')).toBeDisabled();
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
  });
});
