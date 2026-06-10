import { Router } from 'express';
import {
  listMovies,
  movieDetail,
  movieDetailByTmdb, // ➕ Pastikan nanti fungsi ini di-import dari controller
  similarMovies,
  topByGenre,
  recommendByGenre,
  userRecommendations
} from '../controllers/movie.controller.js';

const router = Router();

/**
 * @route   GET /api/movies
 * @desc    Get movie list with pagination & search
 * @access  Public
 */
router.get('/', listMovies);

/**
 * @route   GET /api/movies/recommendations/similar/:title
 * @desc    Get 10 most similar movies (Content-Based)
 * @access  Public
 * @note    Must be before /:id to avoid route conflict
 */
router.get('/recommendations/similar/:title', similarMovies);

/**
 * @route   GET /api/movies/recommendations/by-genre
 * @desc    Get Top 10 movies based on multiple genres
 * @access  Public
 */
router.get('/recommendations/by-genre', recommendByGenre);

/**
 * @route   GET /api/movies/recommendations/user/:userId
 * @desc    Get personalized recommendations based on user preferences
 * @access  Public
 */
router.get('/recommendations/user/:userId', userRecommendations);

/**
 * @route   GET /api/movies/top/:genre
 * @desc    Get Top 10 movies for a single genre
 * @access  Public
 */
router.get('/top/:genre', topByGenre);

/**
 * ➕ BARU:
 * @route   GET /api/movies/tmdb/:tmdbId
 * @desc    Get movie detail by TMDB Movie ID
 * @access  Public
 * @note    Harus di atas /:id supaya kata "tmdb" tidak terbaca sebagai parameter :id
 */
router.get('/tmdb/:tmdbId', movieDetailByTmdb);

/**
 * @route   GET /api/movies/:id
 * @desc    Get movie detail + Top 10 recommendations
 * @access  Public
 * @note    Must be LAST to avoid catching other routes
 */
router.get('/:id', movieDetail);

export default router;