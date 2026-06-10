import 'dotenv/config';
import app from './app.js';

const PORT = parseInt(process.env.PORT) || 3000;

// Start server - Railway requires listening on the PORT env var
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

server.on('error', (e) => {
  console.error('❌ Server Listen Error:', e);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});