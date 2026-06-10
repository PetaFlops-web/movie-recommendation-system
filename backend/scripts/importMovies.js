import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// Polyfill __dirname untuk ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  console.log('🔗 Using DATABASE_URL (Production mode)');
} else {
  console.error('❌ DATABASE_URL tidak ditemukan!');
  process.exit(1);
}

// Fungsi parse CSV yang benar (handle quotes & koma)
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

async function importMovies() {
  try {
    console.log('🎬 Mulai import movies dari CSV...');
    
    const csvPath = path.join(__dirname, '../python_service/model/df_processed.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ File CSV tidak ditemukan di:', csvPath);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1); // Skip header
    
    console.log(`📄 Menemukan ${dataLines.length} baris data`);
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const parts = parseCSVLine(line);
      if (parts.length < 9) continue;

      // Mapping CSV:
      // [0]Title, [1]Genre, [2]Premiere, [3]Runtime, [4]IMDB Score,
      // [5]Language, [6]Year, [7]Real_Actor, [8]Overview
      const title = parts[0]?.replace(/^"|"$/g, '') || '';
      const genres = parts[1]?.replace(/^"|"$/g, '') || '';
      const premiere = parts[2]?.replace(/^"|"$/g, '') || null;
      const runtimeStr = parts[3]?.replace(/^"|"$/g, '') || '';
      const imdbRatingStr = parts[4]?.replace(/^"|"$/g, '') || '';
      const language = parts[5]?.replace(/^"|"$/g, '') || null;
      const yearStr = parts[6]?.replace(/^"|"$/g, '') || '';
      const actors = parts[7]?.replace(/^"|"$/g, '') || '';
      const overview = parts[8]?.replace(/^"|"$/g, '') || '';
      
      const imdb_rating = imdbRatingStr ? parseFloat(imdbRatingStr) : null;
      const runtime = runtimeStr ? parseInt(runtimeStr) : null;
      const year = yearStr ? parseInt(yearStr) : null;
      const movie_id = i + 1;

      if (title) {
        try {
          await pool.query(
            `INSERT INTO movies (movie_id, title, genres, actors, overview, imdb_rating, year, premiere, runtime, language) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (movie_id) DO NOTHING`,
            [movie_id, title, genres, actors, overview, imdb_rating, year, premiere, runtime, language]
          );
          successCount++;
          
          if (successCount % 100 === 0) {
            console.log(`   Progress: ${successCount} movies...`);
          }
        } catch (err) {
          errorCount++;
          if (errorCount <= 3) {
            console.log(`   Error di baris ${i}: ${err.message.substring(0, 100)}`);
          }
        }
      }
    }

    console.log(`\n✅ Berhasil import ${successCount} movies!`);
    if (errorCount > 0) {
      console.log(`️ Ada ${errorCount} error`);
    }
    
    // Cek total
    const result = await pool.query('SELECT COUNT(*) FROM movies');
    console.log(`📊 Total movies di database: ${result.rows[0].count}`);
    
    // Sample data
    const sample = await pool.query('SELECT movie_id, title, genres, imdb_rating, year FROM movies LIMIT 5');
    console.log('\n️ Sample movies:');
    sample.rows.forEach(movie => {
      console.log(`   - [${movie.movie_id}] ${movie.title} (${movie.year}) | ${movie.genres} | Rating: ${movie.imdb_rating}`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importMovies();