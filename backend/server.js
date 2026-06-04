console.log('===> server.js is executing...');

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';
import app from './app.js';

console.log('===> All imports loaded successfully.');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT) || 3000;
console.log(`===> Target PORT configured as: ${PORT}`);

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
  console.log(`===> Attempting to bind to PORT ${PORT} (Auto Host)...`);
  try {
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
  } catch (error) {
    console.error('❌ Fatal Error during app.listen:', error);
  }
}

console.log(`===> START_PYTHON_SERVICE value: ${process.env.START_PYTHON_SERVICE}`);

// Main execution
if (process.env.START_PYTHON_SERVICE === 'true') {
  startPythonService();
  
  // Wait for Python service to initialize
  setTimeout(() => {
    console.log('🚀 Starting Node.js server...');
    startServer();
  }, 3000);
} else {
  console.log('⚠️  Python ML Service disabled (START_PYTHON_SERVICE is not true)');
  startServer();
}