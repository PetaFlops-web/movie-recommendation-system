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
import profileRoutes from './routes/profile.routes.js';
import socialRoutes from './routes/social.routes.js';

const app = express();

app.use(helmet());

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
  : [];

app.use(cors({

  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.some(allowed => origin === allowed || origin.endsWith(allowed.replace('https://', '.')))) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    callback(null, true); // Still allow but log warning — set to callback(new Error('CORS')) to block
  },

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

initDB()
  .then(() => console.log('Database connection pool ready'))
  .catch(err => console.error('DB Initialization failed:', err));

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/health', healthRoutes);


app.use('/api/users', profileRoutes);   // Profile: GET/PUT /api/users/:userId/profile
app.use('/api', socialRoutes);          // Social: POST/GET /api/movies/:id/comments, /like, /share



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
        detail: 'GET /api/movies/:id (returns movie detail + Top 10 recommendations)',
        trending: 'GET /api/movies/trending?page=1&limit=10 (top trending by highest rating)'
      },
      users: {
        profile: 'GET /api/users/:userId/profile | PUT /api/users/:userId/profile'
      },
      social: {
        comments: 'GET/POST /api/movies/:movieId/comments',
        like: 'POST /api/movies/:movieId/like',
        likes: 'GET /api/movies/:movieId/likes',
        share: 'POST /api/movies/:movieId/share'
      },
      health: 'GET /api/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: `${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, _next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;