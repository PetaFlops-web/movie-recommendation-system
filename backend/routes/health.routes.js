import { Router } from 'express';
import { checkHealth } from '../controllers/health.controller.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    System health check (Node.js + Python ML service)
 * @access  Public
 */
router.get('/', checkHealth);

export default router;
