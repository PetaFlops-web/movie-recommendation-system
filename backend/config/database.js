import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

// === 🗄️ DATABASE POOL INITIALIZATION ===
// Gunakan let agar bisa di-assign nanti
let pool;

export const initDB = async () => {
  try {
    // Cek environment: Production (Railway/Neon) atau Local
    const isProduction = process.env.DATABASE_URL && process.env.NODE_ENV !== 'development';

    if (process.env.DATABASE_URL) {
      // ✅ PRODUCTION: Pakai CONNECTION STRING + SSL
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
      });
      console.log('🔗 Using DATABASE_URL (Production mode)');
    } else {
      // ✅ DEVELOPMENT: Pakai individual env vars
      pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'smart_movie_db',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT) || 5432,
      });
      console.log('🔗 Using local DB config (Development mode)');
    }

    // Test koneksi
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected successfully');

    // === 🏗️ CREATE TABLES IF NOT EXISTS ===
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name VARCHAR(100),
        bio TEXT,
        location VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        genre VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, genre)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        poster_path VARCHAR(255),
        genres TEXT,
        actors TEXT,
        overview TEXT,
        imdb_rating DECIMAL(3,1),
        premiere DATE,
        runtime INTEGER,
        language VARCHAR(100),
        year INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_movies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
        rating DECIMAL(2,1),
        watched BOOLEAN DEFAULT false,
        watched_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, movie_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
        score DECIMAL(5,4),
        recommendation_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // === 💬 SOCIAL FEATURES TABLES ===
    
    // Comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 10),
        display_name VARCHAR(100),
        username VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Likes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movie_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, movie_id)
      )
    `);

    // Shares table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movie_shares (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
        platform VARCHAR(50) DEFAULT 'direct',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // === 📊 INDEXES FOR PERFORMANCE ===
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
      CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies USING gin(to_tsvector('english', genres));
      CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(imdb_rating DESC);
      CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year DESC);
      CREATE INDEX IF NOT EXISTS idx_user_movies_user ON user_movies(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_movies_movie ON user_movies(movie_id);
      CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
      CREATE INDEX IF NOT EXISTS idx_comments_movie ON comments(movie_id);
      CREATE INDEX IF NOT EXISTS idx_likes_movie ON movie_likes(movie_id);
    `);

    console.log("✅ All tables initialized successfully");
    return pool;
    
  } catch (err) {
    console.error("❌ DB Init Error:", err.message);
    throw err;
  }
};

// === 📦 EXPORTS ===

// Query helper (wajib pakai await)
export const query = (text, params) => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDB() first.');
  }
  return pool.query(text, params);
};

// Export pool untuk advanced usage (opsional)
export const getPool = () => pool;

// ✅ EXPORT POOL LANGSUNG AGAR BISA DI-IMPORT DI SCRIPTS
export { pool };

// Graceful shutdown
export const closeDB = async () => {
  if (pool) {
    await pool.end();
    console.log('✅ Database connection closed');
  }
};