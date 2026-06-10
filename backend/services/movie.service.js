import { query } from '../config/database.js';

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
      SELECT movie_id, title, genres, actors, overview, imdb_rating, year, poster_path
      FROM movies
      WHERE title ILIKE $1 OR genres ILIKE $1 OR actors ILIKE $1
      ORDER BY imdb_rating DESC NULLS LAST LIMIT $2 OFFSET $3
    `, [q, limit, offset]);

    totalRes = await query(`
      SELECT COUNT(*) FROM movies
      WHERE title ILIKE $1 OR genres ILIKE $1 OR actors ILIKE $1
    `, [q]);
  } else {
    moviesRes = await query(`
      SELECT movie_id, title, genres, actors, overview, imdb_rating, year, poster_path
      FROM movies
      ORDER BY imdb_rating DESC NULLS LAST LIMIT $1 OFFSET $2
    `, [limit, offset]);

    totalRes = await query('SELECT COUNT(*) FROM movies');
  }

  const total = parseInt(totalRes.rows[0].count);

  const BASE_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

  const moviesWithImages = moviesRes.rows.map(movie => ({
    ...movie,
    poster_url: movie.poster_path ? `${BASE_IMAGE_URL}${movie.poster_path}` : null
  }));

  return {
    movies: moviesWithImages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
};

/**
 * Get a single movie by ID
 */
export const getMovieById = async (movieId) => {
  const movieRes = await query(`
    SELECT movie_id, title, genres, actors, overview, imdb_rating, premiere, runtime, language, year, poster_path
    FROM movies WHERE movie_id = $1
  `, [movieId]);

  if (movieRes.rows.length === 0) {
    return null;
  }

  const movies = movieRes.rows[0];

  const BASE_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
  
  return {
    ...movies,
    poster_url: movies.poster_path ? `${BASE_IMAGE_URL}${movies.poster_path}` : null
  };
};

/**
 * Find a movie by title (prioritize exact match, then partial)
 */
export const findMovieByTitle = async (searchTitle) => {
  const movieRes = await query(`
    SELECT movie_id, title, genres, actors, overview, imdb_rating, year, poster_path
    FROM movies
    WHERE title ILIKE $1
    ORDER BY 
      CASE WHEN LOWER(title) = LOWER($2) THEN 0 ELSE 1 END,
      imdb_rating DESC NULLS LAST
    LIMIT 1
  `, [`%${searchTitle}%`, searchTitle]);

  if (movieRes.rows.length === 0) {
    return null;
  }

  return movieRes.rows[0];
};

/**
 * Get top movies for a single genre
 */
export const getTopByGenre = async (genre, limit = 10) => {
  const moviesRes = await query(`
    SELECT movie_id, title, genres, actors, overview, imdb_rating, year, poster_path
    FROM movies
    WHERE genres ILIKE $1
    ORDER BY imdb_rating DESC NULLS LAST
    LIMIT $2
  `, [`%${genre}%`, limit]);

  return moviesRes.rows;
};

/**
 * Get movies matching multiple genres
 */
export const getByMultipleGenres = async (genreArray, limit = 10) => {
  const placeholders = genreArray.map((_, i) => `$${i + 1}`).join(', ');
  const params = genreArray.map(g => `%${g}%`);
  params.push(parseInt(limit));

  const moviesRes = await query(`
    SELECT DISTINCT movie_id, title, genres, actors, overview, imdb_rating, year
    FROM movies
    WHERE genres ILIKE ANY(ARRAY[${placeholders}])
    ORDER BY imdb_rating DESC NULLS LAST
    LIMIT $${params.length}
  `, params);

  return moviesRes.rows;
};

/**
 * Get user genre preferences and recommend movies based on them
 */
export const getUserRecommendations = async (userId, limit = 10) => {
  const prefsRes = await query('SELECT genre FROM user_preferences WHERE user_id = $1', [userId]);

  if (prefsRes.rows.length === 0) {
    return { error: 'User belum memiliki preferensi genre.', status: 400 };
  }

  const preferredGenres = prefsRes.rows.map(p => p.genre);
  const placeholders = preferredGenres.map((_, i) => `$${i + 1}`).join(', ');
  const params = preferredGenres.map(g => `%${g}%`);
  params.push(limit);

  const moviesRes = await query(`
    SELECT DISTINCT m.movie_id, m.title, m.genres, m.actors, m.overview, m.imdb_rating, m.year, m.poster_path
    FROM movies m
    WHERE m.genres ILIKE ANY(ARRAY[${placeholders}])
    ORDER BY m.imdb_rating DESC NULLS LAST
    LIMIT $${params.length}
  `, params);

  return {
    user_id: userId,
    user_preferences: preferredGenres,
    recommendations: moviesRes.rows,
    total: moviesRes.rows.length
  };
};
