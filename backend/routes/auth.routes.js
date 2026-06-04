import { Router } from 'express';
import { register, login, preferences } from '../controllers/auth.controller.js';
import { registerValidation, loginValidation, preferencesValidation } from '../utils/validators.js';

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
 * @access  Private (TODO: add authMiddleware)
 */
router.post('/preferences', preferencesValidation, preferences);

export default router;
