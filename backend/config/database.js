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

