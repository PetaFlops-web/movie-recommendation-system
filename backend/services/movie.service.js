import { query } from '../config/database.js';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';


const addPosterUrl = (movie) => {
  if (!movie) return movie;

  let finalUrl = null;

  const path = movie.poster_path

  finalUrl = path ? `${TMDB_IMAGE_BASE}${path}` : null;

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
      SELECT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path
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
      SELECT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path
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
 */
export const getMovieById = async (id) => {
  const cleanId = parseInt(id, 10);
  if (isNaN(cleanId)) return null;

  // STRATEGI 1: Cari dulu di kolom 'id' (Primary Key database kamu)
  let movieRes = await query(`
    SELECT id, movie_id, title, genres, actors, overview, imdb_rating, premiere, runtime, language, year, poster_path
    FROM movies WHERE id = $1
  `, [cleanId]);

  let rows = extractRows(movieRes);

  // STRATEGI 2: Kalau di kolom 'id' ga ada, otomatis cari di kolom 'movie_id' (ID dari TMDB)
  if (rows.length === 0) {
    movieRes = await query(`
      SELECT id, movie_id, title, genres, actors, overview, imdb_rating, premiere, runtime, language, year, poster_path
      FROM movies WHERE movie_id = $1
    `, [cleanId]);
    rows = extractRows(movieRes);
  }

  if (rows.length === 0) {
    return null;
  }

  return addPosterUrl(rows[0]);
};

/**
 * Find a movie by title (prioritize exact match, then partial)
 */
export const findMovieByTitle = async (searchTitle) => {
  const movieRes = await query(`
    SELECT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path
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
    SELECT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path
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
    SELECT DISTINCT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path
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
    SELECT DISTINCT m.id, m.movie_id, m.title, m.genres, m.actors, m.overview, m.imdb_rating, m.year, m.poster_path
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
    SELECT id, movie_id, title, genres, actors, overview, imdb_rating, premiere, runtime, language, year, poster_path
    FROM movies WHERE movie_id = $1
  `, [cleanId]);

  const rows = extractRows(movieRes);

  if (rows.length === 0) {
    return null;
  }

  return addPosterUrl(rows[0]);
};

/**
 * Get top trending movies based on highest IMDb rating
 * Supports pagination via page & limit
 */
export const getTrendingMovies = async ({ page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  const moviesRes = await query(`
    SELECT id, movie_id, title, genres, actors, overview, imdb_rating, year, poster_path
    FROM movies
    WHERE imdb_rating IS NOT NULL
    ORDER BY imdb_rating DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  const totalRes = await query(
    'SELECT COUNT(*) as count FROM movies WHERE imdb_rating IS NOT NULL'
  );

  const rows = extractRows(moviesRes);
  const totalRows = extractRows(totalRes);
  const total = parseInt(totalRows[0]?.count || 0, 10);

  return {
    movies: rows.map(addPosterUrl),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};