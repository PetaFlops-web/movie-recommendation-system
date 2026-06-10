import { Router } from 'express';
import { getProfile, updateProfile, deleteProfile } from '../controllers/profile.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/:userId/profile', getProfile);
router.put('/:userId/profile', authMiddleware, updateProfile);
router.delete('/:userId/profile', authMiddleware, deleteProfile);

export default router;
