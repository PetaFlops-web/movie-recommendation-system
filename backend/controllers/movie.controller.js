import { successResponse, errorResponse } from '../utils/response.helper.js';
import {
  parsePagination,
  getMovies,
  getMovieById,
  findMovieByTitle,
  getTopByGenre,
  getByMultipleGenres,
  getUserRecommendations
} from '../services/movie.service.js';
import { getContentBasedRecommendations, handleMLError } from '../services/ml.service.js';

/**
 * GET /api/movies
 * Get movie list with pagination & search
 */
export const listMovies = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = req.query.search || '';

    const data = await getMovies({ page, limit, offset, search });
    return successResponse(res, data);
  } catch (err) {
    console.error('Get movies error:', err);
    return errorResponse(res, 'Gagal mengambil daftar film');
  }
};

/**
 * GET /api/movies/:id
 * Get movie detail + Top 10 Content-Based Recommendations
 */
export const movieDetail = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    if (isNaN(movieId)) {
      return errorResponse(res, 'ID film tidak valid', 400);
    }

    const movie = await getMovieById(movieId);
    if (!movie) {
      return errorResponse(res, 'Film tidak ditemukan', 404);
    }

    // Panggil Python ML Service
    let recommendations = [];
    try {
      const mlResult = await getContentBasedRecommendations(movie.movie_id, movie.title, 10);
      recommendations = mlResult.recommendations || mlResult.data || [];
    } catch (mlError) {
      console.error('ML Service error for detail:', mlError.message);
      // Tetap return movie detail meski ML gagal
    }

    return successResponse(res, { movie, recommendations });
  } catch (err) {
    console.error('Movie detail error:', err);
    return errorResponse(res, err.message || 'Gagal mengambil detail film');
  }
};

/**
 * GET /api/movies/recommendations/similar/:title
 * Input 1 judul film -> dapatkan 10 film paling mirip (Content-Based)
 */
export const similarMovies = async (req, res) => {
  try {
    let searchTitle = decodeURIComponent(req.params.title).trim();
    if (!searchTitle) {
      return errorResponse(res, 'Judul film tidak boleh kosong', 400);
    }

    const foundMovie = await findMovieByTitle(searchTitle);
    if (!foundMovie) {
      return errorResponse(res, `Film "${searchTitle}" tidak ditemukan di database`, 404);
    }

    const mlResult = await getContentBasedRecommendations(foundMovie.movie_id, foundMovie.title, 10);

    return successResponse(res, {
      input_movie: {
        movie_id: foundMovie.movie_id,
        title: foundMovie.title,
        genres: foundMovie.genres,
        imdb_rating: foundMovie.imdb_rating
      },
      recommendations: mlResult.recommendations || mlResult.data || [],
      total_similar: mlResult.recommendations?.length || 0
    });
  } catch (err) {
    console.error('Similar movie error:', err);
    return errorResponse(res, 'Gagal mendapatkan rekomendasi film mirip', 500, err.message);
  }
};

/**
 * GET /api/movies/top/:genre
 * Get Top 10 movies for a single genre
 */
export const topByGenre = async (req, res) => {
  try {
    const genre = req.params.genre.trim();
    const limit = parseInt(req.query.limit) || 10;

    if (!genre) {
      return errorResponse(res, 'Genre tidak boleh kosong', 400);
    }

    const movies = await getTopByGenre(genre, limit);
    if (movies.length === 0) {
      return errorResponse(res, `Tidak ada film untuk genre "${genre}"`, 404);
    }

    return successResponse(res, {
      genre,
      total_found: movies.length,
      recommendations: movies
    });
  } catch (err) {
    console.error('Top genre error:', err);
    return errorResponse(res, 'Gagal mengambil rekomendasi film');
  }
};

/**
 * GET /api/movies/recommendations/by-genre
 * Get Top 10 movies based on multiple genres
 */
export const recommendByGenre = async (req, res) => {
  try {
    const { genres, limit = 10 } = req.query;
    if (!genres) {
      return errorResponse(res, 'Parameter genres diperlukan', 400);
    }

    const genreArray = genres.split(',').map(g => g.trim()).filter(Boolean);
    if (genreArray.length === 0) {
      return errorResponse(res, 'Genre tidak valid', 400);
    }

    const movies = await getByMultipleGenres(genreArray, parseInt(limit));

    return successResponse(res, {
      recommendations: movies,
      total: movies.length,
      genres_requested: genreArray
    });
  } catch (err) {
    console.error('Genre recommendation error:', err);
    return errorResponse(res, 'Gagal mendapatkan rekomendasi film');
  }
};

/**
 * GET /api/movies/recommendations/user/:userId
 * Get personalized recommendations based on user's stored preferences
 */
export const userRecommendations = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit) || 10;

    if (isNaN(userId)) {
      return errorResponse(res, 'ID user tidak valid', 400);
    }

    const result = await getUserRecommendations(userId, limit);
    if (result.error) {
      return errorResponse(res, result.error, result.status);
    }

    return successResponse(res, result);
  } catch (err) {
    console.error('User recommendation error:', err);
    return errorResponse(res, 'Gagal mendapatkan rekomendasi personal');
  }
};
