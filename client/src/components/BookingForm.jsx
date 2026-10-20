import React, { useState } from 'react';
import { useCreateBookingMutation } from '../features/workshops/workshops.mutations.js';
import { CheckCircle2, AlertTriangle, AlertCircle, Send, Loader2 } from 'lucide-react';

export function BookingForm({ workshop }) {
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [clientErrors, setClientErrors] = useState({});
  const [successInfo, setSuccessInfo] = useState(null);

  const mutation = useCreateBookingMutation(workshop.id);

  const isSoldOut = workshop.seatsLeft <= 0;

  const validate = () => {
    const errors = {};
    if (!studentName.trim()) {
      errors.studentName = 'Student name is required.';
    } else if (studentName.trim().length < 2) {
      errors.studentName = 'Name must be at least 2 characters.';
    }

    if (!studentEmail.trim()) {
      errors.studentEmail = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim())) {
      errors.studentEmail = 'Please provide a valid email address.';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessInfo(null);

    if (!validate()) {
      return;
    }

    mutation.mutate(
      {
        studentName: studentName.trim(),
        studentEmail: studentEmail.trim()
      },
      {
        onSuccess: (data) => {
          setSuccessInfo(data);
          setStudentName('');
          setStudentEmail('');
          setClientErrors({});
        }
      }
    );
  };

  const errorObj = mutation.error;
  const isDuplicate = errorObj?.code === 'ALREADY_BOOKED';
  const isBackendSoldOut = errorObj?.code === 'SOLD_OUT';

  return (
    <div className="details-card booking-panel" data-testid="booking-form-card">
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Reserve Your Seat
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
        Protected by atomic row-level reservation and ACID transactions.
      </p>

      {/* Success Notification */}
      {successInfo && (
        <div className="alert alert-success" role="status" data-testid="booking-success-alert">
          <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Seat Confirmed!</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Booking #{successInfo.id} created for {successInfo.studentName}. A seat has been safely reserved in PostgreSQL.
            </p>
          </div>
        </div>
      )}

      {/* Duplicate Booking Alert */}
      {isDuplicate && (
        <div className="alert alert-warning" role="alert" data-testid="booking-duplicate-alert">
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Already Registered</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {errorObj.message || 'You have already booked a seat for this workshop.'}
            </p>
          </div>
        </div>
      )}

      {/* Sold Out Alert */}
      {(isSoldOut || isBackendSoldOut) && (
        <div className="alert alert-danger" role="alert" data-testid="booking-soldout-alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Workshop Sold Out</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
              All {workshop.capacity} seats have been reserved. No remaining slots are available.
            </p>
          </div>
        </div>
      )}

      {/* Generic Error */}
      {errorObj && !isDuplicate && !isBackendSoldOut && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Booking Failed</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {errorObj.message || 'An error occurred while reserving your seat.'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="studentName" className="form-label">
            Student Full Name
          </label>
          <input
            id="studentName"
            type="text"
            className="form-input"
            placeholder="e.g. Maya Lin"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            disabled={mutation.isPending || isSoldOut}
          />
          {clientErrors.studentName && (
            <span className="form-error-text">{clientErrors.studentName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="studentEmail" className="form-label">
            College Email Address
          </label>
          <input
            id="studentEmail"
            type="email"
            className="form-input"
            placeholder="e.g. maya@college.edu"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            disabled={mutation.isPending || isSoldOut}
          />
          {clientErrors.studentEmail && (
            <span className="form-error-text">{clientErrors.studentEmail}</span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem' }}
          disabled={mutation.isPending || isSoldOut}
          data-testid="submit-booking-button"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} className="spinner" style={{ width: '16px', height: '16px' }} />
              <span>Reserving Seat Atomically...</span>
            </>
          ) : isSoldOut ? (
            <span>Sold Out</span>
          ) : (
            <>
              <Send size={16} />
              <span>Confirm Reservation</span>
            </>
          )}
        </button>
      </form>

      <div style={{ marginTop: '1.25rem', padding: '0.85rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-surface-border-subtle)', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
        🔒 <strong>Concurrency Guarantee:</strong> Seats are decremented using conditional atomic database updates (<code>seatsLeft &gt; 0</code>). Overselling is mathematically prevented even under millisecond-level parallel requests.
      </div>
    </div>
  );
}

export default BookingForm;
