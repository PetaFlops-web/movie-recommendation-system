import { Router } from 'express';
import { postComment, getComments, likeMovie, getLikes, share } from '../controllers/social.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.post('/movies/:movieId/comments', authMiddleware, postComment);
router.get('/movies/:movieId/comments', getComments);
router.post('/movies/:movieId/like', authMiddleware, likeMovie);
router.get('/movies/:movieId/likes', getLikes);
router.post('/movies/:movieId/share', authMiddleware, share);

export default router;
