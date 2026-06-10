import { query } from '../config/database.js';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

/**
 * ✅ Fungsi helper untuk memastikan poster_url menghasilkan link lengkap yang valid
 */
const addPosterUrl = (movie) => {
  if (!movie) return movie;

  let finalUrl = null;

  // 1. Jika poster_url di DB sudah berupa link lengkap (http/https), gunakan langsung
  if (movie.poster_url && (movie.poster_url.startsWith('http://') || movie.poster_url.startsWith('https://'))) {
    finalUrl = movie.poster_url;
  } 
  // 2. Jika tidak, gabungkan base URL TMDB dengan poster_path (atau poster_url yang masih berupa path pendek)
  else {
    const path = movie.poster_path || movie.poster_url;
    finalUrl = path ? `${TMDB_IMAGE_BASE}${path}` : null;
  }

  return {
    ...movie,
    poster_url: finalUrl
  };
};

/**
 * Helper untuk mengekstrak baris data dari database secara aman (Support PostgreSQL & SQLite)
 */
const extractRows = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result; // Pola SQLite umum
  if (result.rows && Array.isArray(result.rows)) return result.rows; // Pola PostgreSQL
  return [];
};

/**
 * Parse pagination from request query params
 */
export const parsePagination = (queryParams) => {
  const page = Math.max(1, parseInt(queryParams.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
};

/**
 * Get movies with pagination and optional search
 */
export const getMovies = async ({ page, limit, offset, search }) => {
  let moviesRes, totalRes;

  if (search) {
    const q = `%${search}%`;
    moviesRes = await query(`
      SELECT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path, poster_url
      FROM movies
      WHERE title ILIKE $1 OR genres ILIKE $1 OR actors ILIKE $1
      ORDER BY imdb_rating DESC NULLS LAST LIMIT $2 OFFSET $3
    `, [q, limit, offset]);

    totalRes = await query(`
      SELECT COUNT(*) as count FROM movies
      WHERE title ILIKE $1 OR genres ILIKE $1 OR actors ILIKE $1
    `, [q]);
  } else {
    moviesRes = await query(`
      SELECT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path, poster_url
      FROM movies
      ORDER BY imdb_rating DESC NULLS LAST LIMIT $1 OFFSET $2
    `, [limit, offset]);

    totalRes = await query('SELECT COUNT(*) as count FROM movies');
  }

  const rows = extractRows(moviesRes);
  const totalRows = extractRows(totalRes);
  const total = parseInt(totalRows[0]?.count || 0, 10);

  const moviesWithImages = rows.map(addPosterUrl);

  return {
    movies: moviesWithImages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
};

/**
 * 🛠️ SMART FIX (Auto-Fallback): Mencari berdasarkan ID Utama, jika zong, otomatis cari berdasarkan MOVIE_ID
 */
export const getMovieById = async (id) => {
  const cleanId = parseInt(id, 10);
  if (isNaN(cleanId)) return null;

  // STRATEGI 1: Cari dulu di kolom 'id' (Primary Key database kamu)
  let movieRes = await query(`
    SELECT id, movie_id, title, genres, actors, overview, imdb_rating, premiere, runtime, language, year, poster_path, poster_url
    FROM movies WHERE id = $1
  `, [cleanId]);

  let rows = extractRows(movieRes);

  // STRATEGI 2: Kalau di kolom 'id' ga ada, otomatis cari di kolom 'movie_id' (ID dari TMDB)
  if (rows.length === 0) {
    movieRes = await query(`
      SELECT id, movie_id, title, genres, actors, overview, imdb_rating, premiere, runtime, language, year, poster_path, poster_url
      FROM movies WHERE movie_id = $1
    `, [cleanId]);
    rows = extractRows(movieRes);
  }

  if (rows.length === 0) {
    return null; // Kalau di kedua tempat tetep ga ada, baru return null (404)
  }

  return addPosterUrl(rows[0]);
};

/**
 * Find a movie by title (prioritize exact match, then partial)
 */
export const findMovieByTitle = async (searchTitle) => {
  const movieRes = await query(`
    SELECT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path, poster_url
    FROM movies
    WHERE title ILIKE $1
    ORDER BY 
      CASE WHEN LOWER(title) = LOWER($2) THEN 0 ELSE 1 END,
      imdb_rating DESC NULLS LAST
    LIMIT 1
  `, [`%${searchTitle}%`, searchTitle]);

  const rows = extractRows(movieRes);
  if (rows.length === 0) {
    return null;
  }

  return addPosterUrl(rows[0]);
};

/**
 * Get top movies for a single genre
 */
export const getTopByGenre = async (genre, limit = 10) => {
  const moviesRes = await query(`
    SELECT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path, poster_url
    FROM movies
    WHERE genres ILIKE $1
    ORDER BY imdb_rating DESC NULLS LAST
    LIMIT $2
  `, [`%${genre}%`, limit]);

  return extractRows(moviesRes).map(addPosterUrl);
};

/**
 * Get movies matching multiple genres
 */
export const getByMultipleGenres = async (genreArray, limit = 10) => {
  const placeholders = genreArray.map((_, i) => `$${i + 1}`).join(', ');
  const params = genreArray.map(g => `%${g}%`);
  params.push(parseInt(limit));

  const moviesRes = await query(`
    SELECT DISTINCT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path, poster_url
    FROM movies
    WHERE genres ILIKE ANY(ARRAY[${placeholders}])
    ORDER BY imdb_rating DESC NULLS LAST
    LIMIT $${params.length}
  `, params);

  return extractRows(moviesRes).map(addPosterUrl);
};

/**
 * Get user recommendations dengan poster_url yang sudah berbentuk link
 */
export const getUserRecommendations = async (userId, limit = 10) => {
  const prefsRes = await query('SELECT genre FROM user_preferences WHERE user_id = $1', [userId]);
  const prefsRows = extractRows(prefsRes);

  if (prefsRows.length === 0) {
    return { error: 'User belum memiliki preferensi genre.', status: 400 };
  }

  const preferredGenres = prefsRows.map(p => p.genre);
  const placeholders = preferredGenres.map((_, i) => `$${i + 1}`).join(', ');
  const params = preferredGenres.map(g => `%${g}%`);
  params.push(limit);

  const moviesRes = await query(`
    SELECT DISTINCT m.id, m.movie_id, m.title, m.genres, m.actors, m.overview, m.imdb_rating, m.year, m.poster_path, m.poster_url
    FROM movies m
    WHERE m.genres ILIKE ANY(ARRAY[${placeholders}])
    ORDER BY m.imdb_rating DESC NULLS LAST
    LIMIT $${params.length}
  `, params);

  const recommendations = extractRows(moviesRes).map(addPosterUrl);

  return {
    user_id: userId,
    user_preferences: preferredGenres,
    recommendations: recommendations,
    total: recommendations.length
  };
};

/**
 * Ambil rincian satu film berdasarkan TMDB MOVIE_ID
 */
export const getMovieByTmdbId = async (tmdbId) => {
  const cleanId = parseInt(tmdbId, 10);
  if (isNaN(cleanId)) return null;

  const movieRes = await query(`
    SELECT id, movie_id, title, genres, actors, overview, imdb_rating, premiere, runtime, language, year, poster_path, poster_url
    FROM movies WHERE movie_id = $1
  `, [cleanId]);

  const rows = extractRows(movieRes);

  if (rows.length === 0) {
    return null;
  }

  return addPosterUrl(rows[0]);
};