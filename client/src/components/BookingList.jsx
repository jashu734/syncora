import React, { useState } from 'react';
import { useWorkshopBookingsQuery } from '../features/workshops/workshops.queries.js';
import { useCancelBookingMutation } from '../features/workshops/workshops.mutations.js';
import { Users, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function BookingList({ workshopId }) {
  const { data: bookings, isLoading, error } = useWorkshopBookingsQuery(workshopId);
  const cancelMutation = useCancelBookingMutation(workshopId);
  const [feedback, setFeedback] = useState(null);

  const handleCancel = (bookingId, studentName) => {
    if (!window.confirm(`Are you sure you want to cancel the booking for ${studentName}? This will restore 1 seat back to the workshop.`)) {
      return;
    }

    setFeedback(null);
    cancelMutation.mutate(bookingId, {
      onSuccess: () => {
        setFeedback({
          type: 'success',
          message: `Booking for ${studentName} successfully cancelled. 1 seat has been restored to PostgreSQL.`
        });
      },
      onError: (err) => {
        setFeedback({
          type: 'error',
          message: err.message || 'Failed to cancel booking.'
        });
      }
    });
  };

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--color-accent)" />
          Active Registrations ({bookings?.length || 0})
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Real-time attendee roster
        </span>
      </div>

      {feedback && (
        <div
          className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: '1rem' }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <Loader2 size={24} className="spinner" style={{ margin: '0 auto 0.5rem' }} />
          <span>Loading confirmed attendees...</span>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <span>Failed to load bookings list.</span>
        </div>
      ) : bookings && bookings.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Student Email</th>
                <th>Booked At</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <tr key={booking.id} data-testid={`booking-row-${booking.id}`}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {index + 1}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{booking.studentName}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                    {booking.studentEmail}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    {new Date(booking.createdAt).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleCancel(booking.id, booking.studentName)}
                      className="btn btn-danger btn-sm"
                      disabled={cancelMutation.isPending}
                      title="Cancel booking and restore seat"
                      data-testid={`cancel-booking-${booking.id}`}
                    >
                      <Trash2 size={13} />
                      <span>Cancel</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-surface-border)' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No bookings registered yet for this workshop. Be the first to reserve a seat!
          </p>
        </div>
      )}

      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        ℹ️ <em>Academic MVP Notice:</em> For academic demonstration, attendee records and cancellations are publicly visible on this page. In production, cancellations must be guarded by JWT session authentication and student ownership authorization checks.
      </div>
    </div>
  );
}

export default BookingList;
