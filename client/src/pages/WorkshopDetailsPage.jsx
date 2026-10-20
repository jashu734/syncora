import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkshopQuery } from '../features/workshops/workshops.queries.js';
import BookingForm from '../components/BookingForm.jsx';
import BookingList from '../components/BookingList.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { ArrowLeft, Calendar, MapPin, User, Users, ShieldAlert } from 'lucide-react';

export function WorkshopDetailsPage() {
  const { id } = useParams();
  const workshopId = Number(id);

  const { data: workshop, isLoading, error, refetch } = useWorkshopQuery(workshopId);

  if (isLoading) {
    return <LoadingState message="Loading workshop details and seat status..." />;
  }

  if (error || !workshop) {
    return (
      <div>
        <Link to="/" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Workshops</span>
        </Link>
        <ErrorMessage
          title="Workshop not found"
          error={error || 'The requested workshop could not be located.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isSoldOut = workshop.seatsLeft <= 0;
  const formattedDate = new Date(workshop.startsAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div>
      <Link to="/" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>Back to Workshops</span>
      </Link>

      <div className="details-layout">
        {/* Left Column: Workshop Information */}
        <div>
          <div className="details-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                Workshop #{workshop.id}
              </span>
              <div>
                {isSoldOut ? (
                  <span className="badge badge-danger">Sold Out</span>
                ) : (
                  <span className="badge badge-success">
                    {workshop.seatsLeft} of {workshop.capacity} Seats Available
                  </span>
                )}
              </div>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '1rem' }}>
              {workshop.title}
            </h1>

            <div className="workshop-meta-list" style={{ marginBottom: '1.75rem' }}>
              <div className="workshop-meta-item">
                <User size={18} />
                <span><strong>Instructor:</strong> {workshop.instructor}</span>
              </div>
              <div className="workshop-meta-item">
                <MapPin size={18} />
                <span><strong>Location:</strong> {workshop.location}</span>
              </div>
              <div className="workshop-meta-item">
                <Calendar size={18} />
                <span><strong>Schedule:</strong> {formattedDate}</span>
              </div>
              <div className="workshop-meta-item">
                <Users size={18} />
                <span>
                  <strong>Capacity:</strong> {workshop.capacity} maximum attendees &bull; <strong>Remaining:</strong> {workshop.seatsLeft}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-surface-border-subtle)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Workshop Overview
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                {workshop.description}
              </p>
            </div>
          </div>

          {/* Active Registrations & Live Cancellation Table */}
          <BookingList workshopId={workshop.id} />
        </div>

        {/* Right Column: Real-time Booking Form */}
        <div>
          <BookingForm workshop={workshop} />
        </div>
      </div>
    </div>
  );
}

export default WorkshopDetailsPage;
