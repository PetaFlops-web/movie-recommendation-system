import { Router } from 'express';
import { query } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.helper.js';
import { validateComment } from '../utils/commentValidator.js';

const router = Router();

/**
 * POST /api/movies/:movieId/comments
 * Add comment to movie
 */
router.post('/movies/:movieId/comments', async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const { content, rating } = req.body;
    const userId = req.body.user_id || 1; // TODO: Ganti dengan req.user.id

    // Validasi komentar
    const validation = validateComment(content);
    if (!validation.valid) {
      return errorResponse(res, validation.message, 400);
    }

    // Check movie exists
    const movieCheck = await query('SELECT movie_id FROM movies WHERE movie_id = $1 OR id = $1', [movieId]);
    if (movieCheck.rows.length === 0) {
      return errorResponse(res, 'Film tidak ditemukan', 404);
    }

    // Get user display name
    const userRes = await query('SELECT display_name, username FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    // Insert comment
    const result = await query(
      `INSERT INTO comments (user_id, movie_id, content, rating, display_name, username)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, movieId, content, rating || null, user?.display_name, user?.username]
    );

    return successResponse(res, result.rows[0], 'Komentar berhasil ditambahkan', 201);
  } catch (err) {
    console.error('Add comment error:', err);
    return errorResponse(res, 'Gagal menambahkan komentar');
  }
});

/**
 * GET /api/movies/:movieId/comments
 * Get all comments for a movie
 */
router.get('/movies/:movieId/comments', async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);

    const result = await query(
      `SELECT * FROM comments 
       WHERE movie_id = $1 OR movie_id IN (SELECT id FROM movies WHERE movie_id = $1)
       ORDER BY created_at DESC`,
      [movieId]
    );

    return successResponse(res, { comments: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Get comments error:', err);
    return errorResponse(res, 'Gagal mengambil komentar');
  }
});

/**
 * POST /api/movies/:movieId/like
 * Like a movie
 */
router.post('/movies/:movieId/like', async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const userId = req.body.user_id || 1; // TODO: Ganti dengan req.user.id

    // Check if already liked
    const existing = await query(
      'SELECT id FROM movie_likes WHERE user_id = $1 AND movie_id = $2',
      [userId, movieId]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await query('DELETE FROM movie_likes WHERE id = $1', [existing.rows[0].id]);
      return successResponse(res, { liked: false }, 'Berhasil unlike movie');
    } else {
      // Like
      await query(
        'INSERT INTO movie_likes (user_id, movie_id) VALUES ($1, $2)',
        [userId, movieId]
      );
      return successResponse(res, { liked: true }, 'Berhasil like movie', 201);
    }
  } catch (err) {
    console.error('Like movie error:', err);
    return errorResponse(res, 'Gagal memproses like');
  }
});

/**
 * GET /api/movies/:movieId/likes
 * Get like count for a movie
 */
router.get('/movies/:movieId/likes', async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);

    const result = await query(
      'SELECT COUNT(*) as total_likes FROM movie_likes WHERE movie_id = $1 OR movie_id IN (SELECT id FROM movies WHERE movie_id = $1)',
      [movieId]
    );

    return successResponse(res, { total_likes: parseInt(result.rows[0].total_likes) });
  } catch (err) {
    console.error('Get likes error:', err);
    return errorResponse(res, 'Gagal mengambil jumlah like');
  }
});

/**
 * POST /api/movies/:movieId/share
 * Share a movie
 */
router.post('/movies/:movieId/share', async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const { platform } = req.body;
    const userId = req.body.user_id || 1;

    await query(
      'INSERT INTO movie_shares (user_id, movie_id, platform) VALUES ($1, $2, $3)',
      [userId, movieId, platform || 'direct']
    );

    return successResponse(res, { shared: true }, `Berhasil share ke ${platform}`, 201);
  } catch (err) {
    console.error('Share movie error:', err);
    return errorResponse(res, 'Gagal share movie');
  }
});

export default router;