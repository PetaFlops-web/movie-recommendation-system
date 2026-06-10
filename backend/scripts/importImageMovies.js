import "dotenv/config";
// ✅ FIX 1: Tambah import initDB
import { initDB, pool } from "../config/database.js";

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
    // ✅ FIX 2: Init DB dulu sebelum pakai pool!
    await initDB();
    
    // ✅ FIX 3: Ganti poster_path → poster_url (sesuai struktur DB kita)
    const { rows: moviesMissingPosters } = await pool.query(
      "SELECT id, title FROM movies WHERE poster_url IS NULL"
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
        // ✅ FIX 4: Update kolom poster_url, bukan poster_path
        await pool.query(
          "UPDATE movies SET poster_url = $1 WHERE id = $2", 
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
    // ✅ FIX 5: Cek pool sebelum close (biar tidak error kalau undefined)
    if (pool) {
      await pool.end();
    }
  }
}

// Jalankan fungsi
syncPostersToDB();