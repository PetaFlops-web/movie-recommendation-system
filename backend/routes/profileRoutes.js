import { Router } from 'express';
import { query } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.helper.js';

const router = Router();

/**
 * GET /api/users/:userId/profile
 * Get user profile
 */
router.get('/:userId/profile', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const result = await query(
      'SELECT id, username, email, display_name, bio, location, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    return successResponse(res, result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    return errorResponse(res, 'Gagal mengambil profile');
  }
});

/**
 * PUT /api/users/:userId/profile
 * Update user profile
 */
router.put('/:userId/profile', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { display_name, bio, location } = req.body;

    // Check user exists
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    // Update profile
    const result = await query(
      `UPDATE users 
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           location = COALESCE($3, location),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, email, display_name, bio, location`,
      [display_name, bio, location, userId]
    );

    return successResponse(res, result.rows[0], 'Profile berhasil diupdate');
  } catch (err) {
    console.error('Update profile error:', err);
    return errorResponse(res, 'Gagal mengupdate profile');
  }
});

export default router;