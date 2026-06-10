import { Router } from 'express';
import { register, login, preferences } from '../controllers/auth.controller.js';
import { registerValidation, loginValidation, preferencesValidation } from '../utils/validators.js';

// ✅ IMPORT DEFAULT (tanpa curly braces) + nama sesuai file auth.js
import authMiddleware from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with genre preferences
 * @access  Public
 */
router.post('/register', registerValidation, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   POST /api/auth/preferences
 * @desc    Update user genre preferences
 * @access  Private
 */
router.post('/preferences', authMiddleware, preferencesValidation, preferences);

/**
 * @route   GET /api/auth/preferences
 * @desc    Get user genre preferences
 * @access  Private
 */
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT genre FROM user_preferences WHERE user_id = $1 ORDER BY created_at',
      [userId]
    );

    const genres = result.rows.map(row => row.genre);

    return res.status(200).json({
      success: true,
      message: 'Preferensi berhasil diambil',
      data: {
        user_id: userId,
        preferences: genres
      }
    });
  } catch (err) {
    console.error('Get preferences error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil preferensi'
    });
  }
});

export default router;