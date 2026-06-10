import { Router } from 'express';
import { query } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.helper.js';

const router = Router();

/**
 * GET /api/users/:userId/profile
 * Get user profile (Menyembunyikan properti yang bernilai null)
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

    const user = result.rows[0];

    // 💡 DI SINI TEMPATNYA: Trik menghapus properti jika nilainya null
    Object.keys(user).forEach(key => {
      if (user[key] === null) {
        delete user[key];
      }
    });

    // Mengembalikan data user yang sudah bersih tanpa tulisan null
    return successResponse(res, user);
  } catch (err) {
    console.error('Get profile error:', err);
    return errorResponse(res, 'Gagal mengambil profile');
  }
});

/**
 * PUT /api/users/:userId/profile
 * Update user profile (HANYA BISA EDIT USERNAME)
 */
router.put('/:userId/profile', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { username } = req.body;

    if (!username || username.trim() === '') {
      return errorResponse(res, 'Username tidak boleh kosong', 400);
    }

    const cleanUsername = username.trim();

    const userCheck = await query('SELECT id, username FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    const currentUser = userCheck.rows[0];

    if (currentUser.username !== cleanUsername) {
      const duplicateCheck = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2', 
        [cleanUsername, userId]
      );
      
      if (duplicateCheck.rows.length > 0) {
        return errorResponse(res, 'Username sudah digunakan oleh orang lain', 400);
      }
    }

    const result = await query(
      `UPDATE users 
       SET username = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, display_name, bio, location, updated_at`,
      [cleanUsername, userId]
    );

    const updatedUser = result.rows[0];

    // 💡 Di rute PUT juga kita pasang biar kalau dipanggil responsnya ikutan bersih
    Object.keys(updatedUser).forEach(key => {
      if (updatedUser[key] === null) {
        delete updatedUser[key];
      }
    });

    return successResponse(res, updatedUser, 'Username berhasil diperbarui');
  } catch (err) {
    console.error('Update profile error:', err);
    return errorResponse(res, 'Gagal memperbarui username profile');
  }
});

/**
 * DELETE /api/users/:userId/profile
 * Delete user account
 */
router.delete('/:userId/profile', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan atau sudah dihapus', 404);
    }

    await query('DELETE FROM users WHERE id = $1', [userId]);

    return successResponse(res, null, 'Akun user berhasil dihapus secara permanen');
  } catch (err) {
    console.error('Delete account error:', err);
    return errorResponse(res, 'Gagal menghapus akun user');
  }
});

export default router;