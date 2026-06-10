import { Router } from 'express';
import { register, login, preferences, getPreferences } from '../controllers/auth.controller.js';
import { registerValidation, loginValidation, preferencesValidation } from '../utils/validators.js';
import authMiddleware from '../middleware/auth.js';

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
router.get('/preferences', authMiddleware, getPreferences);

export default router;
