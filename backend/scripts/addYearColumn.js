import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  console.log('🔗 Using DATABASE_URL (Railway)');
} else {
  console.error('❌ DATABASE_URL tidak ditemukan!');
  process.exit(1);
}

async function addYearColumn() {
  try {
    console.log('➕ Menambah kolom year...');
    
    await pool.query('ALTER TABLE movies ADD COLUMN IF NOT EXISTS year INTEGER');
    console.log('✅ Kolom year ditambahkan');
    
    // Cek semua kolom
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'movies'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Kolom di tabel movies:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Sample data
    const sample = await pool.query(`
      SELECT movie_id, title, genres, imdb_rating, year, premiere, runtime, language
      FROM movies 
      LIMIT 3
    `);
    
    console.log('\n📽️ Sample data:');
    sample.rows.forEach(movie => {
      console.log(`  - ${movie.title} (${movie.year})`);
      console.log(`    Genre: ${movie.genres}`);
      console.log(`    Rating: ${movie.imdb_rating}`);
      console.log(`    Premiere: ${movie.premiere}`);
      console.log(`    Runtime: ${movie.runtime} min`);
      console.log(`    Language: ${movie.language}\n`);
    });
    
    console.log('🎉 Database siap!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addYearColumn();