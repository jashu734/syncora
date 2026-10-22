import React from 'react';
import { useWorkshopsQuery } from '../features/workshops/workshops.queries.js';
import WorkshopCard from '../components/WorkshopCard.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { RefreshCw, Zap } from 'lucide-react';

export function HomePage() {
  const { data: workshops, isLoading, error, refetch, isFetching } = useWorkshopsQuery();

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Zap size={14} />
          <span>Production-Minded Web Systems</span>
        </div>
        <h1 className="hero-title">
          Campus Workshops with <span>Concurrency Safety</span>
        </h1>
        <p className="hero-subtitle">
          Discover hands-on university workshops, inspect real-time seat availability, and experience race-condition-proof reservations powered by PostgreSQL transactions.
        </p>
      </section>

      {/* Workshop Listing Section */}
      <section>
        <div className="section-header">
          <div>
            <h2 className="section-title">Available Workshops</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Live availability updated continuously via TanStack Query
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="btn btn-secondary btn-sm"
            disabled={isFetching}
            title="Refresh availability"
          >
            <RefreshCw size={14} className={isFetching ? 'spinner' : ''} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {isLoading ? (
          <LoadingState message="Connecting to PostgreSQL and fetching workshops..." />
        ) : error ? (
          <ErrorMessage
            title="Unable to load workshops"
            error={error}
            onRetry={() => refetch()}
          />
        ) : workshops && workshops.length > 0 ? (
          <div className="workshops-grid">
            {workshops.map((workshop) => (
              <WorkshopCard key={workshop.id} workshop={workshop} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              No workshops are currently scheduled. Check back soon!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
