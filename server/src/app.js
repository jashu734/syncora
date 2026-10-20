import express from 'express';
import cors from 'cors';
import workshopsRoutes from './routes/workshopsRoutes.js';
import bookingsRoutes from './routes/bookingsRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Cross-Origin Resource Sharing (CORS) configured for frontend dev server
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(
    cors({
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    })
  );

  // Request body parsing middleware
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    return res.status(200).json({
      status: 'ok'
    });
  });

  // REST API Routes
  app.use('/api/workshops', workshopsRoutes);
  app.use('/api/bookings', bookingsRoutes);

  // 404 Handler for undefined routes
  app.use(notFound);

  // Centralized Error Handling Pipeline
  app.use(errorHandler);

  return app;
}

export default createApp;
