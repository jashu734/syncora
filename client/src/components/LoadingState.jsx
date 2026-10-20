import React from 'react';

export function LoadingState({ message = 'Loading workshops and real-time availability...' }) {
  return (
    <div className="loading-box" role="status">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}

export default LoadingState;
