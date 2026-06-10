import { getUserProfile, updateUserProfile, deleteUserAccount, isUsernameTaken } from '../services/profile.service.js';
import { cleanNullProperties } from '../utils/object.helper.js';
import { successResponse, errorResponse } from '../utils/response.helper.js';

/**
 * GET /api/users/:userId/profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const result = await getUserProfile(userId);

    if (result.error) {
      return errorResponse(res, result.error, result.status);
    }

    const cleanUser = cleanNullProperties(result.user);
    return successResponse(res, cleanUser);
  } catch (err) {
    console.error('Get profile error:', err);
    return errorResponse(res, 'Gagal mengambil profile');
  }
};

/**
 * PUT /api/users/:userId/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { username } = req.body;

    if (!username || username.trim() === '') {
      return errorResponse(res, 'Username tidak boleh kosong', 400);
    }

    const cleanUsername = username.trim();

    const profileResult = await getUserProfile(userId);
    if (profileResult.error) {
      return errorResponse(res, profileResult.error, profileResult.status);
    }

    const currentUser = profileResult.user;

    if (currentUser.username !== cleanUsername) {
      const isTaken = await isUsernameTaken(cleanUsername, userId);
      if (isTaken) {
        return errorResponse(res, 'Username sudah digunakan oleh orang lain', 400);
      }
    }

    const result = await updateUserProfile(userId, cleanUsername);
    const cleanUser = cleanNullProperties(result.user);

    return successResponse(res, cleanUser, 'Username berhasil diperbarui');
  } catch (err) {
    console.error('Update profile error:', err);
    return errorResponse(res, 'Gagal memperbarui username profile');
  }
};

/**
 * DELETE /api/users/:userId/profile
 */
export const deleteProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const result = await deleteUserAccount(userId);

    if (result.error) {
      return errorResponse(res, result.error, result.status);
    }

    return successResponse(res, null, 'Akun user berhasil dihapus secara permanen');
  } catch (err) {
    console.error('Delete account error:', err);
    return errorResponse(res, 'Gagal menghapus akun user');
  }
};
