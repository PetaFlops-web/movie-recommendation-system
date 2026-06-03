const app = require('./app');
const { spawn } = require('child_process');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Start Python ML Service
function startPythonService() {
  console.log('🐍 Starting Python ML Service...');
  
  const pythonProcess = spawn('python', ['python_service/inference_server.py'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  pythonProcess.on('error', (error) => {
    console.error('❌ Failed to start Python service:', error.message);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python service exited with code ${code}`);
  });

  return pythonProcess;
}

// Start server
function startServer() {
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

  return server;
}

// Main execution
let pythonService;

if (process.env.START_PYTHON_SERVICE !== 'false') {
  pythonService = startPythonService();
  
  // Wait for Python service to initialize
  setTimeout(() => {
    console.log('🚀 Starting Node.js server...');
    startServer();
  }, 3000);
} else {
  console.log('⚠️  Python ML Service disabled (START_PYTHON_SERVICE=false)');
  startServer();
}

module.exports = app;