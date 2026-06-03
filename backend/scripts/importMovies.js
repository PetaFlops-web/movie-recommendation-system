const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { query, initDB } = require('../config/database');

const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, '..', 'model', 'movies.csv');

async function importMovies() {
  try {
    await initDB();
    if (!fs.existsSync(CSV_PATH)) {
      console.error(`❌ CSV tidak ditemukan: ${CSV_PATH}`);
      process.exit(1);
    }

    console.log(`📥 Reading CSV from: ${CSV_PATH}`);
    const movies = [];
    let rowNum = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          rowNum++;
          
          // Generate unique movie_id dari kombinasi Title + Row Number
          const titleSlug = (row.Title || '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
          const movie_id = parseInt(`${rowNum}${titleSlug.length}${row.Year || '2020'}`.substring(0, 10)) || rowNum * 1000;

          const movie = {
            movie_id: movie_id,
            title: row.Title || `Untitled Movie ${rowNum}`,
            genres: row.Genre || 'Unknown',
            actors: row.Real_Actor || '',
            overview: row.Overview || '',
            imdb_rating: parseFloat(row['IMDB Score']) || null,
            premiere: row.Premiere || '',
            runtime: row.Runtime || '',
            language: row.Language || '',
            year: row.Year || ''
          };

          if (movie.title && movie.title !== 'Untitled Movie') {
            movies.push(movie);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`✅ Parsed ${movies.length} movies. Inserting to PostgreSQL...`);

    const client = await require('../config/database').pool.connect();
    try {
      await client.query('BEGIN');

      // Buat tabel movies dengan struktur yang sesuai CSV Anda
      await client.query(`
        CREATE TABLE IF NOT EXISTS movies (
          id SERIAL PRIMARY KEY,
          movie_id INTEGER UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          genres TEXT,
          actors TEXT,
          overview TEXT,
          imdb_rating DECIMAL(3,1),
          premiere VARCHAR(100),
          runtime VARCHAR(50),
          language VARCHAR(50),
          year VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const insertSQL = `
        INSERT INTO movies (movie_id, title, genres, actors, overview, imdb_rating, premiere, runtime, language, year)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (movie_id) DO UPDATE SET
          title = EXCLUDED.title,
          genres = EXCLUDED.genres,
          actors = EXCLUDED.actors,
          overview = EXCLUDED.overview,
          imdb_rating = EXCLUDED.imdb_rating,
          premiere = EXCLUDED.premiere,
          runtime = EXCLUDED.runtime,
          language = EXCLUDED.language,
          year = EXCLUDED.year
      `;

      for (const m of movies) {
        await client.query(insertSQL, [
          m.movie_id, m.title, m.genres, m.actors, m.overview, 
          m.imdb_rating, m.premiere, m.runtime, m.language, m.year
        ]);
      }

      await client.query('COMMIT');
      console.log(`🎉 Successfully imported ${movies.length} movies!`);
      
      // Tampilkan sample data
      const sample = await client.query('SELECT movie_id, title, genres, imdb_rating FROM movies LIMIT 3');
      console.log('\n📋 Sample data:');
      sample.rows.forEach(row => {
        console.log(`  - [${row.movie_id}] ${row.title} (${row.genres}) - Rating: ${row.imdb_rating}`);
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Import failed:', err);
    } finally {
      client.release();
      await require('../config/database').pool.end();
    }
  } catch (err) {
    console.error('💥 Fatal:', err);
    process.exit(1);
  }
}

importMovies();