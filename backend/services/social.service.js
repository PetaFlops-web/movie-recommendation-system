import { query } from '../config/database.js';

/**
 * Add comment to movie
 */
export const addComment = async (userId, movieId, content, rating) => {
  const movieCheck = await query('SELECT movie_id FROM movies WHERE movie_id = $1', [movieId]);
  if (movieCheck.rows.length === 0) {
    return { error: 'Film tidak ditemukan', status: 404 };
  }

  const userRes = await query(
    'SELECT id, username, display_name FROM users WHERE id = $1',
    [userId]
  );
  const user = userRes.rows[0];
  
  if (!user) {
    return { error: 'User tidak ditemukan', status: 404 };
  }

  const result = await query(
    `INSERT INTO comments (user_id, movie_id, content, rating)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, movieId, content, rating || null]
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
export const getMovieComments = async (movieId) => {
  const result = await query(
    `SELECT 
       c.id, c.content, c.rating, c.created_at,
       c.user_id,
       u.username, u.display_name
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.movie_id = $1
     ORDER BY c.created_at DESC`,
    [movieId]
  );

  return {
    movie_id: movieId,
    comments: result.rows,
    total: result.rows.length
  };
};

/**
 * Toggle like on movie (like/unlike)
 */
export const toggleLike = async (userId, movieId) => {
  const existing = await query(
    'SELECT id FROM movie_likes WHERE user_id = $1 AND movie_id = $2',
    [userId, movieId]
  );

  if (existing.rows.length > 0) {
    await query('DELETE FROM movie_likes WHERE id = $1', [existing.rows[0].id]);
    return { liked: false };
  } else {
    await query(
      'INSERT INTO movie_likes (user_id, movie_id) VALUES ($1, $2)',
      [userId, movieId]
    );
    return { liked: true };
  }
};

/**
 * Get like count for a movie
 */
export const getMovieLikes = async (movieId) => {
  const result = await query(
    'SELECT COUNT(*) as total_likes FROM movie_likes WHERE movie_id = $1',
    [movieId]
  );

  return {
    movie_id: movieId,
    total_likes: parseInt(result.rows[0].total_likes)
  };
};

/**
 * Share a movie
 */
export const shareMovie = async (userId, movieId, platform) => {
  await query(
    'INSERT INTO movie_shares (user_id, movie_id, platform) VALUES ($1, $2, $3)',
    [userId, movieId, platform || 'direct']
  );

  return { shared: true, platform: platform || 'direct' };
};
