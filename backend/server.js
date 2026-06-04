import 'dotenv/config';
import app from './app.js';

const PORT = parseInt(process.env.PORT) || 3000;

// Start server - Railway requires listening on the PORT env var
const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   🎬 SMART MOVIE RECOMMENDATION SYSTEM                ║');
  console.log('║   Team: PJK-GM059                                     ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log('');
});

server.on('error', (e) => {
  console.error('❌ Server Listen Error:', e);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});