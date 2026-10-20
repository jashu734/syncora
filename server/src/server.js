import 'dotenv/config';
import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[Syncora Backend] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown handling
const shutdown = () => {
  console.log('\n[Syncora Backend] Gracefully shutting down...');
  server.close(() => {
    console.log('[Syncora Backend] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
