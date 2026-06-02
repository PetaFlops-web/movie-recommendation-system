require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import konfigurasi & routes
const { initDB } = require('./config/database');
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const mlService = require('./services/mlService');

const app = express();

// === 🔒 SECURITY & CORS MIDDLEWARE ===
app.use(helmet()); // Melindungi header HTTP dari vulnerability umum

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// === 📦 BODY PARSING ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === 📝 LOGGING ===
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Format ringkas untuk development
} else {
  app.use(morgan('combined')); // Format lengkap untuk production
}

// === 🗄️ DATABASE INITIALIZATION ===
// Membuat tabel otomatis saat server startup (jika belum ada)
initDB()
  .then(() => console.log('✅ Database connection pool ready'))
  .catch(err => console.error('❌ DB Initialization failed:', err));

// === 🛣️ ROUTES MOUNTING ===
// Autentikasi & Preferensi User
app.use('/api/auth', authRoutes);

// Film, Pencarian, Detail & Top 10 Rekomendasi (Content-Based)
app.use('/api/movies', movieRoutes);

// === 🏠 ROOT ENDPOINT ===
app.get('/', (req, res) => {
  res.json({
    message: '🎬 Smart Movie Recommendation System API',
    project: 'PJK-GM059 | IBM SkillsBuild Capstone',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        preferences: 'POST /api/auth/preferences | GET /api/auth/preferences'
      },
      movies: {
        list: 'GET /api/movies?page=1&limit=20&search=action',
        detail: 'GET /api/movies/:id (returns movie detail + Top 10 recommendations)'
      },
      health: 'GET /api/health'
    }
  });
});

// === 🏥 HEALTH CHECK ===
app.get('/api/health', async (req, res) => {
  try {
    const mlStatus = await mlService.healthCheck();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Smart Movie Recommendation Backend',
      database: 'PostgreSQL',
      ml_service: mlStatus,
      team: 'PJK-GM059'
    });
  } catch (err) {
    // Tetap return 200 agar monitoring tidak panic, tapi kasih tau status ML
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Smart Movie Recommendation Backend',
      database: 'PostgreSQL',
      ml_service: { status: 'unreachable', note: 'Python ML service might be down' },
      team: 'PJK-GM059'
    });
  }
});

// ===  404 HANDLER ===
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: `${req.method} ${req.originalUrl}`
  });
});

// === 💥 GLOBAL ERROR HANDLER ===
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;