import { successResponse, errorResponse } from '../utils/response.helper.js';
import {
  parsePagination,
  getMovies,
  getMovieById,
  findMovieByTitle,
  getTopByGenre,
  getByMultipleGenres,
  getUserRecommendations,
  getMovieByTmdbId,
  
} from '../services/movie.service.js';
import { getContentBasedRecommendations, getContentBasedRecommendationHybrid } from '../services/ml.service.js';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const addPosterUrl = (movie) => {
  if (!movie) return movie;

  let finalUrl = null;

  const path = movie.poster_path

  finalUrl = path ? `${TMDB_IMAGE_BASE}${path}` : null;

  return {
    ...movie,
    poster_url: finalUrl
  };
};

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
 * Menghapus parseInt kaku agar mendukung ID string/alphanumeric dari database lokal
 */
export const movieDetail = async (req, res) => {
  try {
    const movieId = req.params.id; 
    
    if (!movieId) {
      return errorResponse(res, 'ID film tidak valid', 400);
    }

    const movie = await getMovieById(movieId);
    if (!movie) {
      return errorResponse(res, 'Film tidak ditemukan', 404);
    }

    // Pastikan film utama juga dapet poster_url jika belum ada
    const movieWithPoster = addPosterUrl(movie);

    let recommendationHybrid = [];
    let recommendationTFIDF = [];

    try {
      // 💡 Tarik data dari ML Service (TF-IDF dan Hybrid) secara BERSAMAAN
      const [mlResultTFIDF, mlResultHybrid] = await Promise.all([
        getContentBasedRecommendations(movie.movie_id, movie.title, 10),
        getContentBasedRecommendationHybrid(movie.movie_id, movie.title, 10)
      ]);

      const rawTFIDF = mlResultTFIDF?.recommendations || [];
      const rawHybrid = mlResultHybrid?.recommendations || [];
      
      // 💡 Helper function agar tidak perlu nulis loop database dua kali
      const enrichRecommendations = async (rawRecs) => {
        return await Promise.all(
          rawRecs.map(async (recMovie) => {
            const fullMovieData = await getMovieById(recMovie.movieId || recMovie.movie_id);
            
            if (fullMovieData) {
              return addPosterUrl({
                ...fullMovieData,
                similarity_score: recMovie.similarity_score, // Mempertahankan skor dari ML
                hybrid_score: recMovie.hybrid_score // Tambahan jika ada dari model hybrid
              });
            }
            
            return recMovie; // Fallback jika tidak ada di DB Node.js
          })
        );
      };

      // Tembakkan raw data ke helper untuk ditambahkan poster_url
      recommendationTFIDF = await enrichRecommendations(rawTFIDF);
      recommendationHybrid = await enrichRecommendations(rawHybrid);

    } catch (mlError) {
      console.error('ML Service error for detail:', mlError.message);
      // Proses tetap berjalan meskipun ML gagal (fail-safe)
    }

    // Kembalikan movie utama beserta list rekomendasi dari masing-masing model
    return successResponse(res, { 
      movie: movieWithPoster, 
      recommendations: {
        hybrid: recommendationHybrid,
        tfidf: recommendationTFIDF
      }
    });

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

    // 1. Cari movie di database lokal
    const foundMovie = await findMovieByTitle(searchTitle);
    if (!foundMovie) {
      return errorResponse(res, `Film "${searchTitle}" tidak ditemukan di database`, 404);
    }

    // 2. Panggil ML Service
    const mlResult = await getContentBasedRecommendations(foundMovie.movie_id, foundMovie.title, 10);

    const recommendations = 
      mlResult?.recommendations || 
      mlResult?.data?.recommendations || 
      mlResult?.data || 
      [];

    // 3. Jika ML return data kosong, fallback ke genre-based
    if (recommendations.length === 0) {
      console.log('⚠️ Fallback to genre-based recommendations');
      const genreArray = foundMovie.genres?.split(',').map(g => g.trim()) || [];
      if (genreArray.length > 0) {
        const fallback = await getByMultipleGenres(genreArray, 10);
        return successResponse(res, {
          input_movie: {
            movie_id: foundMovie.movie_id,
            title: foundMovie.title,
            genres: foundMovie.genres,
            imdb_rating: foundMovie.imdb_rating
          },
          recommendations: fallback,
          total_similar: fallback.length,
          note: 'Rekomendasi berbasis genre (fallback)'
        });
      }
    }

    // 4. Return hasil sukses
    return successResponse(res, {
      input_movie: {
        movie_id: foundMovie.movie_id,
        title: foundMovie.title,
        genres: foundMovie.genres,
        imdb_rating: foundMovie.imdb_rating
      },
      recommendations: recommendations,
      total_similar: recommendations.length
    });

  } catch (err) {
    console.error('Similar movie error:', err);
    return errorResponse(res, 'Gagal mendapatkan rekomendasi film mirip', 500);
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
    const { genres } = req.query;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (isNaN(limit) || limit <= 0) {
      return errorResponse(res, 'Parameter limit harus berupa angka positif', 400);
    }

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

/**
 * GET /api/movies/tmdb/:tmdbId
 * Get movie detail by TMDB Movie ID + Top 10 Content-Based Recommendations
 */
export const movieDetailByTmdb = async (req, res) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId);
    if (isNaN(tmdbId)) {
      return errorResponse(res, 'TMDB ID tidak valid', 400);
    }

    // Ambil data film berdasarkan movie_id dari TMDB
    const movie = await getMovieByTmdbId(tmdbId);
    if (!movie) {
      return errorResponse(res, 'Film tidak ditemukan berdasarkan TMDB ID tersebut', 404);
    }

    // Panggil Python ML Service agar outputnya sama lengkapnya dengan rute id biasa
    let recommendations = [];
    try {
      const mlResult = await getContentBasedRecommendations(movie.movie_id, movie.title, 10);
      recommendations = mlResult?.recommendations || mlResult?.data?.recommendations || mlResult?.data || [];
    } catch (mlError) {
      console.error('ML Service error for TMDB detail:', mlError.message);
    }

    return successResponse(res, { movie, recommendations });
  } catch (err) {
    console.error('Movie detail by TMDB error:', err);
    return errorResponse(res, err.message || 'Gagal mengambil detail film berdasarkan TMDB ID');
  }
};