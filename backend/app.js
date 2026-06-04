import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import konfigurasi & routes
import { initDB } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import movieRoutes from './routes/movie.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

// === 🔒 SECURITY & CORS MIDDLEWARE ===
app.use(helmet());

// Parse allowed origins from environment
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // In development, allow all
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // In production, check whitelist
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.some(allowed => origin === allowed || origin.endsWith(allowed.replace('https://', '.')))) {
      return callback(null, true);
    }
    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    callback(null, true); // Still allow but log warning — set to callback(new Error('CORS')) to block
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// === 📦 BODY PARSING ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === 📝 LOGGING ===
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// === 🗄️ DATABASE INITIALIZATION ===
initDB()
  .then(() => console.log('✅ Database connection pool ready'))
  .catch(err => console.error('❌ DB Initialization failed:', err));

// === 🛣️ ROUTES MOUNTING ===
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/health', healthRoutes);

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

// === 🚀 RAILWAY HEALTHCHECK FIX ===
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// === 🚫 404 HANDLER ===
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: `${req.method} ${req.originalUrl}`
  });
});

// === 💥 GLOBAL ERROR HANDLER ===
app.use((err, req, res, _next) => {
  console.error('💥 Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;