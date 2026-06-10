import { validationResult } from 'express-validator';
import { registerUser, loginUser, updatePreferences, getUserPreferences } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.helper.js';

/**
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validasi gagal', 400, errors.array());
    }

    const { username, email, password, genres } = req.body;
    const result = await registerUser({ username, email, password, genres });

    if (result.error) {
      return errorResponse(res, result.error, result.status);
    }

    return successResponse(res, result, 'Registrasi berhasil', 201);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 'Terjadi kesalahan server saat registrasi');
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validasi gagal', 400, errors.array());
    }

    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    if (result.error) {
      return errorResponse(res, result.error, result.status);
    }

    return successResponse(res, result, 'Login berhasil');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Terjadi kesalahan server saat login');
  }
};

/**
 * POST /api/auth/preferences
 */
export const preferences = async (req, res) => {
  try {
    const { genres } = req.body;

    if (!genres || !Array.isArray(genres)) {
      return errorResponse(res, 'Format genres harus array', 400);
    }

    // TODO: Ganti dengan req.user.id saat middleware auth aktif
    const userId = req.user?.id || 1;

    const result = await updatePreferences(userId, genres);
    return successResponse(res, result, 'Preferensi genre berhasil disimpan');
  } catch (error) {
    console.error('Preferences error:', error);
    return errorResponse(res, 'Gagal menyimpan preferensi');
  }
};

/**
 * GET /api/auth/preferences
 */
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUserPreferences(userId);

    return successResponse(res, result, 'Preferensi berhasil diambil');
  } catch (error) {
    console.error('Get preferences error:', error);
    return errorResponse(res, 'Gagal mengambil preferensi');
  }
};
