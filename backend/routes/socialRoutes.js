import { Router } from 'express';
import { query } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.helper.js';
import { validateComment } from '../utils/commentValidator.js';

const router = Router();

/**
 * POST /api/movies/:movieId/comments
 * Add comment to movie
 * ✅ FIX: Fetch user data & merge ke response agar username/display_name tidak null
 */
router.post('/movies/:movieId/comments', async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const { content, rating } = req.body;
    const userId = req.body.user_id || 1; // TODO: Ganti dengan req.user.id

    // Validasi komentar
    if (validateComment) {
      const validation = validateComment(content);
      if (!validation.valid) {
        return errorResponse(res, validation.message, 400);
      }
    }

    // Check movie exists (pakai id primary key)
    const movieCheck = await query('SELECT id FROM movies WHERE id = $1', [movieId]);
    if (movieCheck.rows.length === 0) {
      return errorResponse(res, 'Film tidak ditemukan', 404);
    }

    // ✅ FIX 1: Ambil data user sebelum insert comment
    const userRes = await query(
      'SELECT id, username, display_name FROM users WHERE id = $1',
      [userId]
    );
    const user = userRes.rows[0];
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    // Insert comment (HANYA simpan user_id → normalisasi DB)
    const result = await query(
      `INSERT INTO comments (user_id, movie_id, content, rating)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, movieId, content, rating || null]
    );

    // ✅ FIX 2: Gabungkan data comment + user info untuk response
    const responseData = {
      ...result.rows[0],
      username: user.username,
      display_name: user.display_name || user.username // fallback kalau display_name kosong
    };

    return successResponse(res, responseData, 'Komentar berhasil ditambahkan', 201);
  } catch (err) {
    console.error('Add comment error:', err);
    return errorResponse(res, 'Gagal menambahkan komentar');
  }
});

/**
 * GET /api/movies/:movieId/comments
 * Get all comments for a movie (dengan JOIN user info)
 */
router.get('/movies/:movieId/comments', async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);

    // Pakai JOIN untuk ambil user info saat GET
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

    return successResponse(res, { 
      movie_id: movieId,
      comments: result.rows, 
      total: result.rows.length 
    });
  } catch (err) {
    console.error('Get comments error:', err);
    return errorResponse(res, 'Gagal mengambil komentar');
  }
});

/**
 * POST /api/movies/:movieId/like
 * Like a movie (toggle)
 */
router.post('/movies/:movieId/like', async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const userId = req.body.user_id || 1;

    // Check if already liked
    const existing = await query(
      'SELECT id FROM movie_likes WHERE user_id = $1 AND movie_id = $2',
      [userId, movieId]
    );

    if (existing.rows.length > 0) {
      // Unlike - hapus by id primary key
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
      'SELECT COUNT(*) as total_likes FROM movie_likes WHERE movie_id = $1',
      [movieId]
    );

    return successResponse(res, { 
      movie_id: movieId,
      total_likes: parseInt(result.rows[0].total_likes) 
    });
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