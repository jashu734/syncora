import React, { useState } from 'react';
import { useMyBookingsQuery } from '../features/workshops/workshops.queries.js';
import { useCancelBookingMutation } from '../features/workshops/workshops.mutations.js';
import { Ticket, Search, Calendar, MapPin, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function MyBookingsPage() {
  const [inputEmail, setInputEmail] = useState('');
  const [queriedEmail, setQueriedEmail] = useState('');
  const [feedback, setFeedback] = useState(null);

  const { data: bookings, isLoading, error, refetch } = useMyBookingsQuery(queriedEmail);
  const cancelMutation = useCancelBookingMutation(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputEmail.trim()) {
      setQueriedEmail(inputEmail.trim().toLowerCase());
      setFeedback(null);
    }
  };

  const handleCancel = (bookingId, workshopTitle) => {
    if (!window.confirm(`Cancel registration for "${workshopTitle}"? Your seat will be returned to the general availability pool.`)) {
      return;
    }

    setFeedback(null);
    cancelMutation.mutate(bookingId, {
      onSuccess: () => {
        setFeedback({
          type: 'success',
          message: `Successfully cancelled registration for "${workshopTitle}". One seat was restored.`
        });
        refetch();
      },
      onError: (err) => {
        setFeedback({
          type: 'error',
          message: err.message || 'Failed to cancel registration.'
        });
      }
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          My Registered Workshops
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Look up your active workshop bookings using your college email address.
        </p>
      </div>

      {/* Academic Disclaimer Banner */}
      <div className="alert alert-warning" style={{ fontSize: '0.825rem', marginBottom: '2rem' }}>
        <AlertCircle size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Academic MVP Notice:</strong> Email lookup is provided for fast exploration in this academic project. It does NOT constitute secure authentication. Production deployment requires proper JWT/SSO authorization.
        </div>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <input
          type="email"
          className="form-input"
          style={{ flex: 1 }}
          placeholder="Enter your college email address (e.g. student@college.edu)"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
          <Search size={16} />
          <span>Find Bookings</span>
        </button>
      </form>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Bookings Display */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={24} className="spinner" style={{ margin: '0 auto 0.5rem' }} />
          <span>Searching database for registered bookings...</span>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <span>Failed to query bookings: {error.message}</span>
        </div>
      ) : queriedEmail && bookings && bookings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            Active Registrations for {queriedEmail} ({bookings.length})
          </h2>
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="details-card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Booking ID #{booking.id}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.25rem 0 0.5rem' }}>
                  {booking.workshop?.title || 'Workshop'}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} color="var(--color-accent)" />
                    <span>{booking.workshop?.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} color="var(--color-accent)" />
                    <span>{new Date(booking.workshop?.startsAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleCancel(booking.id, booking.workshop?.title)}
                  className="btn btn-danger btn-sm"
                  disabled={cancelMutation.isPending}
                  title="Cancel booking and restore seat"
                >
                  <Trash2 size={14} />
                  <span>Cancel Reservation</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : queriedEmail && bookings && bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
          <Ticket size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem' }}>No Bookings Found</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            No registered workshop bookings were found for {queriedEmail}.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default MyBookingsPage;
