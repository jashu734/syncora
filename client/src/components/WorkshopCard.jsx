import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, Users, ArrowRight } from 'lucide-react';

export function WorkshopCard({ workshop }) {
  const {
    id,
    title,
    description,
    instructor,
    location,
    startsAt,
    capacity,
    seatsLeft
  } = workshop;

  const isSoldOut = seatsLeft <= 0;
  const isLimited = seatsLeft > 0 && seatsLeft <= Math.ceil(capacity * 0.3);

  const formattedDate = new Date(startsAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div className="workshop-card" data-testid={`workshop-card-${id}`}>
      <div className="workshop-card-body">
        <div className="workshop-card-header">
          <h3 className="workshop-card-title">{title}</h3>
          <div>
            {isSoldOut ? (
              <span className="badge badge-danger">Sold Out</span>
            ) : isLimited ? (
              <span className="badge badge-warning">{seatsLeft} Seats Left</span>
            ) : (
              <span className="badge badge-success">{seatsLeft} Seats Available</span>
            )}
          </div>
        </div>

        <p className="workshop-card-desc">{description}</p>

        <div className="workshop-meta-list">
          <div className="workshop-meta-item">
            <User size={15} />
            <span>{instructor}</span>
          </div>
          <div className="workshop-meta-item">
            <MapPin size={15} />
            <span>{location}</span>
          </div>
          <div className="workshop-meta-item">
            <Calendar size={15} />
            <span>{formattedDate}</span>
          </div>
          <div className="workshop-meta-item">
            <Users size={15} />
            <span>
              Capacity: {capacity} seats &bull; Remaining: {seatsLeft}
            </span>
          </div>
        </div>

        <div className="workshop-card-footer">
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            ID #{id}
          </span>
          <Link
            to={`/workshops/${id}`}
            className={`btn btn-sm ${isSoldOut ? 'btn-secondary' : 'btn-primary'}`}
          >
            <span>{isSoldOut ? 'View Details' : 'Book Seat'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default WorkshopCard;
