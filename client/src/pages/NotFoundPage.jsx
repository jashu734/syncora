import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem', border: '1px solid var(--color-surface-border)' }}>
        <AlertCircle size={48} color="var(--color-warning)" />
      </div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto 2rem' }}>
        The page or workshop resource you requested does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        <Home size={16} />
        <span>Return to Workshops</span>
      </Link>
    </div>
  );
}

export default NotFoundPage;
