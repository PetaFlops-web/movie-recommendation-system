import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

// Declare pool here so it can be assigned inside the environment blocks below
let pool; 

// === DETECT ENVIRONMENT & INITIALIZE POOL ===
if (process.env.DATABASE_URL) {
  // ✅ PRODUCTION (Neon.tech / Railway / Koyeb)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for platforms like Neon.tech/Railway
    }
  });
  console.log('🔗 Using DATABASE_URL (Production mode)');
} else {
  // ✅ LOCAL DEVELOPMENT
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
  });
  console.log('💻 Using local DB config (Development mode)');
}

// === INIT DATABASE ===
export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // Table for tracking user-movie interactions (watched/rated)
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

    // Table for storing recommendations
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

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
      CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies USING gin(to_tsvector('english', genres));
      CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(imdb_rating DESC);
      CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year DESC);
      CREATE INDEX IF NOT EXISTS idx_user_movies_user ON user_movies(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_movies_movie ON user_movies(movie_id);
      CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
      CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(recommendation_type);
    `);

    console.log("✅ PostgreSQL & tables initialized successfully");
  } catch (err) {
    console.error("❌ DB Init Error:", err);
  }
};

export const query = (text, params) => pool.query(text, params);

export { pool };