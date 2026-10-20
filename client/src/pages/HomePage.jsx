import React from 'react';
import { useWorkshopsQuery } from '../features/workshops/workshops.queries.js';
import WorkshopCard from '../components/WorkshopCard.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { ShieldCheck, Cpu, Database, RefreshCw, Zap } from 'lucide-react';

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

      {/* Architectural Guarantees Callout */}
      <section className="architecture-callout">
        <div className="callout-header">
          <ShieldCheck size={22} color="var(--color-primary)" />
          <span>Engineered Against Overselling & Data Corruption</span>
        </div>
        <div className="callout-grid">
          <div className="callout-card">
            <div className="callout-card-title">
              <Cpu size={16} color="var(--color-accent)" />
              <span>Conditional Atomic Decrement</span>
            </div>
            <p className="callout-card-desc">
              Executes <code>UPDATE "Workshop" SET "seatsLeft" = "seatsLeft" - 1 WHERE id = $1 AND "seatsLeft" &gt; 0</code> inside PostgreSQL to eliminate race conditions.
            </p>
          </div>

          <div className="callout-card">
            <div className="callout-card-title">
              <Database size={16} color="var(--color-accent)" />
              <span>Strict Transaction Boundaries</span>
            </div>
            <p className="callout-card-desc">
              Seat updates and booking creations execute in one transaction. If a duplicate booking or database failure occurs, seats are automatically restored by rollback.
            </p>
          </div>

          <div className="callout-card">
            <div className="callout-card-title">
              <ShieldCheck size={16} color="var(--color-accent)" />
              <span>Compound Unique Constraint</span>
            </div>
            <p className="callout-card-desc">
              PostgreSQL enforces <code>@@unique([workshopId, studentEmail])</code>, guaranteeing a student can never book the same workshop twice even under simultaneous clicks.
            </p>
          </div>
        </div>
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
