// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with genre preferences
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, genres } = req.body;

    // Cek user existing (PostgreSQL style)
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email atau username sudah terdaftar' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, password_hash]
    );
    const user = newUser.rows[0];

    // Insert genres
    if (genres && Array.isArray(genres) && genres.length > 0) {
      const genrePromises = genres.map(g =>
        query('INSERT INTO user_preferences (user_id, genre) VALUES ($1, $2)', [user.id, g])
      );
      await Promise.all(genrePromises);
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        user,
        preferences: genres || [],
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat registrasi' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(400).json({ success: false, message: 'Email atau password salah' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Email atau password salah' });
    }

    // Get preferences
    const prefsRes = await query('SELECT genre FROM user_preferences WHERE user_id = $1', [user.id]);
    const preferences = prefsRes.rows.map(p => p.genre);

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: { id: user.id, username: user.username, email: user.email },
        preferences,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat login' });
  }
});

/**
 * @route   POST /api/auth/preferences
 * @desc    Update user genre preferences
 * @access  Private
 */
router.post('/preferences', async (req, res) => {
  try {
    // Anda bisa tambahkan authMiddleware di sini jika sudah siap
    const { genres } = req.body;
    if (!genres || !Array.isArray(genres)) {
      return res.status(400).json({ success: false, message: 'Format genres harus array' });
    }

    const userId = 1; // Ganti dengan req.user.id saat middleware auth aktif

    // Hapus preferences lama
    await query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);

    // Insert preferences baru
    if (genres.length > 0) {
      const inserts = genres.map(g =>
        query('INSERT INTO user_preferences (user_id, genre) VALUES ($1, $2)', [userId, g])
      );
      await Promise.all(inserts);
    }

    res.json({ success: true, message: 'Preferensi genre berhasil disimpan', data: { genres } });
  } catch (error) {
    console.error('Preferences error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan preferensi' });
  }
});

module.exports = router;