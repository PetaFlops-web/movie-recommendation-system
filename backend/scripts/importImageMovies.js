import "dotenv/config";
import { pool } from "../config/database.js"

// 1. Fungsi khusus untuk menembak API TMDB berdasarkan judul
async function getPosterFromTMDB(title) {
  try {
    const url = `${process.env.TMDB_BASE_URL}/search/movie?api_key=${process.env.API_KEY_TMDB}&query=${encodeURIComponent(title)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Gagal fetch TMDB untuk: ${title}`);
    }

    const data = await response.json();

    // Mengambil hasil pertama yang paling relevan
    if (data.results && data.results.length > 0) {
      return data.results[0].poster_path; 
    }

    return null; 
  } catch (error) {
    console.error(`Error TMDB untuk "${title}":`, error.message);
    return null;
  }
}

// 2. Fungsi utama untuk sinkronisasi Database lokal dengan TMDB
async function syncPostersToDB() {
  console.log("🚀 Memulai proses sinkronisasi poster...");
  
  try {
    // A. Ambil data dari DB yang poster_path-nya masih kosong
    const { rows: moviesMissingPosters } = await pool.query(
      "SELECT id, title FROM movies WHERE poster_path IS NULL"
    );
    
    if (moviesMissingPosters.length === 0) {
      console.log("✅ Semua film sudah memiliki poster.");
      return;
    }

    console.log(`🔍 Ditemukan ${moviesMissingPosters.length} film yang butuh poster.`);

    // B. Perulangan untuk setiap film
    for (const movie of moviesMissingPosters) {
      const posterPath = await getPosterFromTMDB(movie.title);

      if (posterPath) {
        // C. Update Database
        await pool.query(
          "UPDATE movies SET poster_path = $1 WHERE id = $2", 
          [posterPath, movie.id]
        );
        console.log(`✅ Update berhasil: "${movie.title}"`);
      } else {
        console.log(`❌ Poster tidak ditemukan: "${movie.title}"`);
      }
      
      // Jeda untuk menghindari Rate Limiting API TMDB
      await new Promise(resolve => setTimeout(resolve, 500)); 
    }

    console.log("🏁 Proses sinkronisasi selesai!");
  } catch (error) {
    console.error('❌ Terjadi kesalahan pada proses sinkronisasi:', error);
  } finally {
    // Menutup koneksi pool jika ini adalah script sekali jalan
    await pool.end();
  }
}

// Jalankan fungsi
syncPostersToDB();