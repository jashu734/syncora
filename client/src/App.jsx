import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import WorkshopDetailsPage from './pages/WorkshopDetailsPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Shared QueryClient instance for caching and state management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/workshops/:id" element={<WorkshopDetailsPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <footer className="footer">
            <div className="footer-container">
              <div>
                <strong>Syncora &bull; Concurrency-Safe Workshop Booking System</strong>
                <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                  Demonstrating PostgreSQL ACID transactions, atomic conditional updates, and race condition defenses.
                </p>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Academic Full-Stack Demonstration &bull; Express, Prisma & React
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
