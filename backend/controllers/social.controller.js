import { addComment, getMovieComments, toggleLike, getMovieLikes, shareMovie } from '../services/social.service.js';
import { validateComment } from '../utils/validators.js';
import { successResponse, errorResponse } from '../utils/response.helper.js';

/**
 * POST /api/movies/:movieId/comments
 */
export const postComment = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const { content, rating } = req.body;
    const userId = req.user.id;

    const validation = validateComment(content);
    if (!validation.valid) {
      return errorResponse(res, validation.message, 400);
    }

    const result = await addComment(userId, movieId, content, rating);

    if (result.error) {
      return errorResponse(res, result.error, result.status);
    }

    return successResponse(res, result.comment, 'Komentar berhasil ditambahkan', 201);
  } catch (err) {
    console.error('Add comment error:', err);
    return errorResponse(res, 'Gagal menambahkan komentar');
  }
};

/**
 * GET /api/movies/:movieId/comments
 */
export const getComments = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);

    const result = await getMovieComments(movieId);

    return successResponse(res, result);
  } catch (err) {
    console.error('Get comments error:', err);
    return errorResponse(res, 'Gagal mengambil komentar');
  }
};

/**
 * POST /api/movies/:movieId/like
 */
export const likeMovie = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const userId = req.user.id;

    const result = await toggleLike(userId, movieId);

    const message = result.liked ? 'Berhasil like movie' : 'Berhasil unlike movie';
    const status = result.liked ? 201 : 200;

    return successResponse(res, result, message, status);
  } catch (err) {
    console.error('Like movie error:', err);
    return errorResponse(res, 'Gagal memproses like');
  }
};

/**
 * GET /api/movies/:movieId/likes
 */
export const getLikes = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);

    const result = await getMovieLikes(movieId);

    return successResponse(res, result);
  } catch (err) {
    console.error('Get likes error:', err);
    return errorResponse(res, 'Gagal mengambil jumlah like');
  }
};

/**
 * POST /api/movies/:movieId/share
 */
export const share = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const { platform } = req.body;
    const userId = req.user.id;

    const result = await shareMovie(userId, movieId, platform);

    return successResponse(res, result, `Berhasil share ke ${result.platform}`, 201);
  } catch (err) {
    console.error('Share movie error:', err);
    return errorResponse(res, 'Gagal share movie');
  }
};
