import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorMessage({
  error,
  title = 'An error occurred',
  onRetry = null
}) {
  const message = error?.message || (typeof error === 'string' ? error : 'Unable to fetch data.');

  return (
    <div className="alert alert-danger" role="alert">
      <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{title}</strong>
        <span>{message}</span>
        {onRetry && (
          <div style={{ marginTop: '0.75rem' }}>
            <button onClick={onRetry} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
