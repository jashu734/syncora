import express from 'express';
import cors from 'cors';
import workshopsRoutes from './routes/workshopsRoutes.js';
import bookingsRoutes from './routes/bookingsRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Cross-Origin Resource Sharing (CORS) configured for frontend dev server & local network
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, automated test suites)
        if (!origin) return callback(null, true);

        // Allow configured client URL, localhost, or any local private network IP (e.g. 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        const isLocalNetwork = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
          origin
        );

        if (origin === clientUrl || isLocalNetwork || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }

        return callback(null, false);
      },
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
