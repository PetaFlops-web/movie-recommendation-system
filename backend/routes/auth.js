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
  // 🔍 DEBUG: Cek data yang masuk dari frontend
  console.log('📥 REGISTER REQUEST BODY:', JSON.stringify(req.body, null, 2));
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('⚠️ Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, genres } = req.body;

    // Validasi input dasar
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, dan password wajib diisi' 
      });
    }

    // Cek user existing
    console.log(`🔍 Checking existing user: ${email}, ${username}`);
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existing.rows.length > 0) {
      console.warn('⚠️ User already exists:', existing.rows[0]);
      return res.status(400).json({ 
        success: false, 
        message: 'Email atau username sudah terdaftar' 
      });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    console.log('💾 Inserting new user...');
    const newUser = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, password_hash]
    );
    const user = newUser.rows[0];
    console.log('✅ User created:', user.id, user.username);

    // Insert genres
    if (genres && Array.isArray(genres) && genres.length > 0) {
      console.log(`🎨 Saving ${genres.length} genre preferences...`);
      const genrePromises = genres.map(g =>
        query('INSERT INTO user_preferences (user_id, genre) VALUES ($1, $2)', [user.id, g])
      );
      await Promise.all(genrePromises);
      console.log('✅ Preferences saved successfully');
    } else {
      console.log('ℹ️ No genres provided, skipping preferences');
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret_key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    console.log('🎉 Registration successful for:', username);
    
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
    console.error('❌ Register ERROR:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server saat registrasi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  console.log('📥 LOGIN REQUEST BODY:', JSON.stringify(req.body, null, 2));
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email dan password wajib diisi' 
      });
    }

    // Find user
    console.log(`🔍 Searching user by email: ${email}`);
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];

    if (!user) {
      console.warn('️ User not found:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }

    // Verify password
    console.log('🔑 Verifying password...');
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn('⚠️ Password mismatch for:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }

    // Get preferences
    const prefsRes = await query('SELECT genre FROM user_preferences WHERE user_id = $1', [user.id]);
    const preferences = prefsRes.rows.map(p => p.genre);
    console.log(`🎨 Found ${preferences.length} preferences for user ${user.username}`);

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret_key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    console.log('🎉 Login successful for:', user.username);

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
    console.error('❌ Login ERROR:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server saat login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/preferences
 * @desc    Update user genre preferences
 * @access  Private (Needs auth middleware later)
 */
router.post('/preferences', async (req, res) => {
  console.log('📥 PREFERENCES UPDATE REQUEST:', JSON.stringify(req.body, null, 2));
  
  try {
    const { genres } = req.body;
    if (!genres || !Array.isArray(genres)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Format genres harus array' 
      });
    }

    // TODO: Ganti dengan req.user.id setelah auth middleware siap
    const userId = req.user?.id || 1; 
    console.log(`🔄 Updating preferences for user ID: ${userId}`);

    // Hapus preferences lama
    await query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);

    // Insert preferences baru
    if (genres.length > 0) {
      const inserts = genres.map(g =>
        query('INSERT INTO user_preferences (user_id, genre) VALUES ($1, $2)', [userId, g])
      );
      await Promise.all(inserts);
      console.log(`✅ Saved ${genres.length} new preferences`);
    }

    res.json({ 
      success: true, 
      message: 'Preferensi genre berhasil disimpan', 
      data: { genres } 
    });
  } catch (error) {
    console.error('❌ Preferences ERROR:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menyimpan preferensi' 
    });
  }
});

module.exports = router;