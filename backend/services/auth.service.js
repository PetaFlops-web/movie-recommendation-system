import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

/**
 * Register a new user with optional genre preferences
 */
export const registerUser = async ({ username, email, password, genres }) => {
  // Check existing user
  const existing = await query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existing.rows.length > 0) {
    return { error: 'Email atau username sudah terdaftar', status: 400 };
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Insert user
  const newUser = await query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
    [username, email, passwordHash]
  );
  const user = newUser.rows[0];

  // Insert genre preferences
  if (genres && Array.isArray(genres) && genres.length > 0) {
    const genrePromises = genres.map(g =>
      query('INSERT INTO user_preferences (user_id, genre) VALUES ($1, $2)', [user.id, g])
    );
    await Promise.all(genrePromises);
  }

  // Generate JWT token
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  return { user, preferences: genres || [], token };
};

/**
 * Login user and return token
 */
export const loginUser = async ({ email, password }) => {
  // Find user
  const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];

  if (!user) {
    return { error: 'Email atau password salah', status: 400 };
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return { error: 'Email atau password salah', status: 400 };
  }

  // Get preferences
  const prefsRes = await query('SELECT genre FROM user_preferences WHERE user_id = $1', [user.id]);
  const preferences = prefsRes.rows.map(p => p.genre);

  // Generate JWT token
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  return {
    user: { id: user.id, username: user.username, email: user.email },
    preferences,
    token
  };
};

/**
 * Update user genre preferences
 */
export const updatePreferences = async (userId, genres) => {
  // Delete old preferences
  await query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);

  // Insert new preferences
  if (genres.length > 0) {
    const inserts = genres.map(g =>
      query('INSERT INTO user_preferences (user_id, genre) VALUES ($1, $2)', [userId, g])
    );
    await Promise.all(inserts);
  }

  return { genres };
};

/**
 * Get user genre preferences
 */
export const getUserPreferences = async (userId) => {
  const result = await query(
    'SELECT genre FROM user_preferences WHERE user_id = $1 ORDER BY created_at',
    [userId]
  );

  const genres = result.rows.map(row => row.genre);
  return { user_id: userId, preferences: genres };
};
