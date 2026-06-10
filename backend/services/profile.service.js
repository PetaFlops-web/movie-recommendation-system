import { query } from '../config/database.js';

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  const result = await query(
    'SELECT id, username, email, display_name FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return { error: 'User tidak ditemukan', status: 404 };
  }

  return { user: result.rows[0] };
};

/**
 * Check if username is already taken by another user
 */
export const isUsernameTaken = async (username, excludeUserId) => {
  const result = await query(
    'SELECT id FROM users WHERE username = $1 AND id != $2',
    [username, excludeUserId]
  );

  return result.rows.length > 0;
};

/**
 * Update user profile (username only)
 */
export const updateUserProfile = async (userId, username) => {
  const result = await query(
    `UPDATE users 
     SET username = $1
     WHERE id = $2
     RETURNING id, username, email, display_name`,
    [username, userId]
  );

  return { user: result.rows[0] };
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (userId) => {
  const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
  
  if (userCheck.rows.length === 0) {
    return { error: 'User tidak ditemukan atau sudah dihapus', status: 404 };
  }

  await query('DELETE FROM users WHERE id = $1', [userId]);
  return { success: true };
};
