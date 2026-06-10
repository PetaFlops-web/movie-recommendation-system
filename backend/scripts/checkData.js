import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
} else {
  console.error('❌ DATABASE_URL tidak ditemukan!');
  process.exit(1);
}

async function checkData() {
  try {
    console.log('🔍 Mengecek isi database...\n');
    
    // Cek semua kolom
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'movies'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Kolom di tabel movies:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Cek jumlah data
    const count = await pool.query('SELECT COUNT(*) FROM movies');
    console.log(`\n📊 Total movies: ${count.rows[0].count}`);
    
    // Cek sample data
    const sample = await pool.query('SELECT * FROM movies LIMIT 3');
    if (sample.rows.length > 0) {
      console.log('\n📽️ Sample data:');
      sample.rows.forEach(movie => {
        console.log('\n' + JSON.stringify(movie, null, 2));
      });
    } else {
      console.log('\n⚠️ Tabel movies KOSONG!');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();