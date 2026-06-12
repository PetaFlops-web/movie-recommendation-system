import { query } from '../config/database.js';

/**
 * Add comment to movie
 * FIX: Map movie_id (dataset) to id (primary key) for FK constraint
 */
export const addComment = async (userId, movieIdFromUrl, content, rating) => {
  // 1. CARI MOVIE berdasarkan movie_id (dataset ID seperti 4102018)
  const movieCheck = await query(
    'SELECT id, movie_id FROM movies WHERE movie_id = $1', 
    [movieIdFromUrl]
  );
  
  if (movieCheck.rows.length === 0) {
    return { error: 'Film tidak ditemukan', status: 404 };
  }

  // 2. AMBIL PRIMARY KEY id (angka 4, bukan 4102018)
  const movieDbId = movieCheck.rows[0].id;

  // 3. Get user info
  const userRes = await query(
    'SELECT id, username, display_name FROM users WHERE id = $1',
    [userId]
  );
  const user = userRes.rows[0];
  
  if (!user) {
    return { error: 'User tidak ditemukan', status: 404 };
  }

  // 4. INSERT menggunakan movieDbId (primary key), BUKAN movieIdFromUrl
  const result = await query(
    `INSERT INTO comments (user_id, movie_id, content, rating)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, movieDbId, content, rating || null]
  );

  const responseData = {
    ...result.rows[0],
    username: user.username,
    display_name: user.display_name || user.username
  };

  return { comment: responseData };
};

/**
 * Get all comments for a movie with JOIN user info
 */
export const getMovieComments = async (movieIdFromUrl) => {
  // 1. Cari primary key movie
  const movieCheck = await query(
    'SELECT id FROM movies WHERE movie_id = $1', 
    [movieIdFromUrl]
  );
  
  if (movieCheck.rows.length === 0) {
    return { comments: [], total: 0, movie_id: movieIdFromUrl };
  }

  const movieDbId = movieCheck.rows[0].id;

  // 2. Ambil comments menggunakan primary key
  const result = await query(
    `SELECT 
       c.id, c.content, c.rating, c.created_at,
       c.user_id,
       u.username, u.display_name
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.movie_id = $1
     ORDER BY c.created_at DESC`,
    [movieDbId]
  );

  return {
    movie_id: movieIdFromUrl,
    comments: result.rows,
    total: result.rows.length
  };
};

/**
 * Toggle like on movie (like/unlike)
 * FIX: Map movie_id to primary key
 */
export const toggleLike = async (userId, movieIdFromUrl) => {
  // 1. Cari primary key movie
  const movieCheck = await query(
    'SELECT id FROM movies WHERE movie_id = $1', 
    [movieIdFromUrl]
  );
  
  if (movieCheck.rows.length === 0) {
    throw new Error('Film tidak ditemukan');
  }

  const movieDbId = movieCheck.rows[0].id;

  // 2. Cek existing like menggunakan primary key
  const existing = await query(
    'SELECT id FROM movie_likes WHERE user_id = $1 AND movie_id = $2',
    [userId, movieDbId]
  );

  if (existing.rows.length > 0) {
    await query('DELETE FROM movie_likes WHERE id = $1', [existing.rows[0].id]);
    return { liked: false };
  } else {
    await query(
      'INSERT INTO movie_likes (user_id, movie_id) VALUES ($1, $2)',
      [userId, movieDbId]
    );
    return { liked: true };
  }
};

/**
 * Get like count for a movie
 */
export const getMovieLikes = async (movieIdFromUrl) => {
  // 1. Cari primary key movie
  const movieCheck = await query(
    'SELECT id FROM movies WHERE movie_id = $1', 
    [movieIdFromUrl]
  );
  
  if (movieCheck.rows.length === 0) {
    return { movie_id: movieIdFromUrl, total_likes: 0 };
  }

  const movieDbId = movieCheck.rows[0].id;

  // 2. Hitung likes menggunakan primary key
  const result = await query(
    'SELECT COUNT(*) as total_likes FROM movie_likes WHERE movie_id = $1',
    [movieDbId]
  );

  return {
    movie_id: movieIdFromUrl,
    total_likes: parseInt(result.rows[0].total_likes)
  };
};

/**
 * Share a movie
 * FIX: Map movie_id to primary key
 */
export const shareMovie = async (userId, movieIdFromUrl, platform) => {
  // 1. Cari primary key movie
  const movieCheck = await query(
    'SELECT id FROM movies WHERE movie_id = $1', 
    [movieIdFromUrl]
  );
  
  if (movieCheck.rows[0].length === 0) {
    throw new Error('Film tidak ditemukan');
  }

  const movieDbId = movieCheck.rows[0].id;

  // 2. Insert share menggunakan primary key
  await query(
    'INSERT INTO movie_shares (user_id, movie_id, platform) VALUES ($1, $2, $3)',
    [userId, movieDbId, platform || 'direct']
  );

  return { shared: true, platform: platform || 'direct' };
};