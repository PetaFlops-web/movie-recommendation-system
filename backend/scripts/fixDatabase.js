import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prioritize DATABASE_URL
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
    // Tidak perlu SSL untuk Railway internal
  });
  console.log('🔗 Using DATABASE_URL (Railway)');
} else {
  console.error('❌ DATABASE_URL tidak ditemukan!');
  console.log('💡 Set DATABASE_URL di file .env atau environment variable');
  process.exit(1);
}

// Fungsi untuk parse CSV dengan benar
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function fixDatabase() {
  try {
    console.log('🔧 Memperbaiki struktur database...\n');
    
    // STEP 1: Tambah kolom yang hilang
    console.log('➕ Menambah kolom yang hilang...');
    
    await pool.query('ALTER TABLE movies ADD COLUMN IF NOT EXISTS premiere VARCHAR(100)');
    console.log('  ✅ Kolom premiere ditambahkan');
    
    await pool.query('ALTER TABLE movies ADD COLUMN IF NOT EXISTS runtime INTEGER');
    console.log('  ✅ Kolom runtime ditambahkan');
    
    await pool.query('ALTER TABLE movies ADD COLUMN IF NOT EXISTS language VARCHAR(100)');
    console.log('Kolom language ditambahkan');
    
    // STEP 2: Update data dari CSV
    console.log('\n📥 Update data dari CSV...');
    
    const csvPath = path.join(__dirname, '../python_service/model/df_processed.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1);
    
    let updateCount = 0;
    
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;
      
      const parts = parseCSVLine(line);
      if (parts.length < 9) continue;
      
      const title = parts[0]?.replace(/^"|"$/g, '') || '';
      const premiere = parts[2]?.replace(/^"|"$/g, '') || null;
      const runtimeStr = parts[3]?.replace(/^"|"$/g, '') || '';
      const language = parts[5]?.replace(/^"|"$/g, '') || null;
      
      const runtime = runtimeStr ? parseInt(runtimeStr) : null;
      const movie_id = i + 1;
      
      if (title && (premiere || runtime || language)) {
        try {
          await pool.query(
            `UPDATE movies 
             SET premiere = $1, runtime = $2, language = $3
             WHERE movie_id = $4`,
            [premiere, runtime, language, movie_id]
          );
          updateCount++;
        } catch (err) {
          // Skip error
        }
      }
    }
    
    console.log(`  ✅ Update ${updateCount} baris data`);
    
    // STEP 3: Cek hasil
    console.log('\n📊 Cek hasil...');
    const check = await pool.query(`
      SELECT movie_id, title, premiere, runtime, language, year 
      FROM movies 
      WHERE premiere IS NOT NULL 
      LIMIT 5
    `);
    
    console.log('\n📽️ Sample data setelah update:');
    check.rows.forEach(movie => {
      console.log(`   - ${movie.title}`);
      console.log(`     Premiere: ${movie.premiere}`);
      console.log(`     Runtime: ${movie.runtime} min`);
      console.log(`     Language: ${movie.language}`);
      console.log(`     Year: ${movie.year}\n`);
    });
    
    console.log('🎉 Database berhasil diperbaiki!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixDatabase();