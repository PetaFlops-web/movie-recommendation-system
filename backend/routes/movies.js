const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const mlService = require('../services/mlService');

/**
 * Helper: Parse pagination
 */
const parsePagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
};

/**
 * @route   GET /api/movies
 * @desc    Get movie list with pagination & search
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req);
    const search = req.query.search || '';
    const q = `%${search}%`;

    let moviesRes, totalRes;

    if (search) {
      moviesRes = await query(`
        SELECT movie_id, title, genres, actors, overview, imdb_rating, year
        FROM movies
        WHERE title ILIKE $1 OR genres ILIKE $1 OR actors ILIKE $1
        ORDER BY imdb_rating DESC NULLS LAST LIMIT $2 OFFSET $3
      `, [q, limit, offset]);

      totalRes = await query(`
        SELECT COUNT(*) FROM movies
        WHERE title ILIKE $1 OR genres ILIKE $1 OR actors ILIKE $1
      `, [q]);
    } else {
      moviesRes = await query(`
        SELECT movie_id, title, genres, actors, overview, imdb_rating, year
        FROM movies
        ORDER BY imdb_rating DESC NULLS LAST LIMIT $1 OFFSET $2
      `, [limit, offset]);

      totalRes = await query(`SELECT COUNT(*) FROM movies`);
    }

    const total = parseInt(totalRes.rows[0].count);

    res.json({
      success: true,
      data: {
        movies: moviesRes.rows,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    console.error('Get movies error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar film' });
  }
});

/**
 * @route   GET /api/movies/:id
 * @desc    Get movie detail + Top 10 Content-Based Recommendations
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    if (isNaN(movieId)) return res.status(400).json({ success: false, message: 'ID film tidak valid' });

    const movieRes = await query(`
      SELECT movie_id, title, genres, actors, overview, imdb_rating, premiere, runtime, language, year
      FROM movies WHERE movie_id = $1
    `, [movieId]);

    if (movieRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Film tidak ditemukan' });
    }
    const movie = movieRes.rows[0];

    // Panggil Python ML Service
    const recommendations = await mlService.getContentBasedRecommendations(movie.movie_id, movie.title, 10);

    res.json({
      success: true,
      data: {
        movie,
        recommendations: recommendations.recommendations || recommendations.data || []
      }
    });
  } catch (err) {
    console.error('Movie detail error:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal mengambil detail film' });
  }
});

/**
 * @route   GET /api/movies/recommendations/similar/:title
 * @desc    Input 1 judul film -> dapatkan 10 film paling mirip (Content-Based)
 * @access  Public
 * @example GET /api/movies/recommendations/similar/The%20Open%20House
 */
router.get('/recommendations/similar/:title', async (req, res) => {
  try {
    // Decode URL encoding (ganti %20 jadi spasi, dll)
    let searchTitle = decodeURIComponent(req.params.title).trim();
    if (!searchTitle) {
      return res.status(400).json({ success: false, message: 'Judul film tidak boleh kosong' });
    }

    // 1. Cari film di database (prioritaskan exact match, lalu partial match)
    const movieRes = await query(`
      SELECT movie_id, title, genres, actors, overview, imdb_rating, year
      FROM movies
      WHERE title ILIKE $1
      ORDER BY 
        CASE WHEN LOWER(title) = LOWER($2) THEN 0 ELSE 1 END,
        imdb_rating DESC NULLS LAST
      LIMIT 1
    `, [`%${searchTitle}%`, searchTitle]);

    if (movieRes.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `Film "${searchTitle}" tidak ditemukan di database` 
      });
    }

    const foundMovie = movieRes.rows[0];

    // 🔥 PERBAIKAN UTAMA: Kirim foundMovie.title ke Python agar dataset ML bisa match
    const recommendations = await mlService.getContentBasedRecommendations(
      foundMovie.movie_id, 
      foundMovie.title,  // <-- FIX: Kirim Judul Film, bukan null
      10
    );

    res.json({
      success: true,
      data: {
        input_movie: {
          movie_id: foundMovie.movie_id,
          title: foundMovie.title,
          genres: foundMovie.genres,
          imdb_rating: foundMovie.imdb_rating
        },
        recommendations: recommendations.recommendations || recommendations.data || [],
        total_similar: recommendations.recommendations?.length || 0
      }
    });
  } catch (err) {
    console.error('Similar movie error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mendapatkan rekomendasi film mirip',
      error: err.message 
    });
  }
});

/**
 * @route   GET /api/movies/top/:genre
 * @desc    Get Top 10 movies for a SINGLE genre
 * @access  Public
 */
router.get('/top/:genre', async (req, res) => {
  try {
    const genre = req.params.genre.trim();
    const limit = parseInt(req.query.limit) || 10;

    if (!genre) return res.status(400).json({ success: false, message: 'Genre tidak boleh kosong' });

    const moviesRes = await query(`
      SELECT movie_id, title, genres, actors, overview, imdb_rating, year
      FROM movies
      WHERE genres ILIKE $1
      ORDER BY imdb_rating DESC NULLS LAST
      LIMIT $2
    `, [`%${genre}%`, limit]);

    if (moviesRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Tidak ada film untuk genre "${genre}"` });
    }

    res.json({
      success: true,
      data: {
        genre,
        total_found: moviesRes.rows.length,
        recommendations: moviesRes.rows
      }
    });
  } catch (err) {
    console.error('Top genre error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil rekomendasi film' });
  }
});

/**
 * @route   GET /api/movies/recommendations/by-genre
 * @desc    Get Top 10 movies based on MULTIPLE genres
 * @access  Public
 */
router.get('/recommendations/by-genre', async (req, res) => {
  try {
    const { genres, limit = 10 } = req.query;
    if (!genres) return res.status(400).json({ success: false, message: 'Parameter genres diperlukan' });

    const genreArray = genres.split(',').map(g => g.trim()).filter(Boolean);
    if (genreArray.length === 0) return res.status(400).json({ success: false, message: 'Genre tidak valid' });

    const placeholders = genreArray.map((_, i) => `$${i + 1}`).join(', ');
    const params = genreArray.map(g => `%${g}%`);
    params.push(parseInt(limit));

    const moviesRes = await query(`
      SELECT DISTINCT movie_id, title, genres, actors, overview, imdb_rating, year
      FROM movies
      WHERE genres ILIKE ANY(ARRAY[${placeholders}])
      ORDER BY imdb_rating DESC NULLS LAST
      LIMIT $${params.length}
    `, params);

    res.json({
      success: true,
      data: {
        recommendations: moviesRes.rows,
        total: moviesRes.rows.length,
        genres_requested: genreArray
      }
    });
  } catch (err) {
    console.error('Genre recommendation error:', err);
    res.status(500).json({ success: false, message: 'Gagal mendapatkan rekomendasi film' });
  }
});

/**
 * @route   GET /api/movies/recommendations/user/:userId
 * @desc    Get personalized recommendations based on user's stored preferences
 * @access  Public
 */
router.get('/recommendations/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit) || 10;
    if (isNaN(userId)) return res.status(400).json({ success: false, message: 'ID user tidak valid' });

    const prefsRes = await query(`SELECT genre FROM user_preferences WHERE user_id = $1`, [userId]);
    if (prefsRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'User belum memiliki preferensi genre.' });
    }

    const preferredGenres = prefsRes.rows.map(p => p.genre);
    const placeholders = preferredGenres.map((_, i) => `$${i + 1}`).join(', ');
    const params = preferredGenres.map(g => `%${g}%`);
    params.push(limit);

    const moviesRes = await query(`
      SELECT DISTINCT m.movie_id, m.title, m.genres, m.actors, m.overview, m.imdb_rating, m.year
      FROM movies m
      WHERE m.genres ILIKE ANY(ARRAY[${placeholders}])
      ORDER BY m.imdb_rating DESC NULLS LAST
      LIMIT $${params.length}
    `, params);

    res.json({
      success: true,
      data: {
        user_id: userId,
        user_preferences: preferredGenres,
        recommendations: moviesRes.rows,
        total: moviesRes.rows.length
      }
    });
  } catch (err) {
    console.error('User recommendation error:', err);
    res.status(500).json({ success: false, message: 'Gagal mendapatkan rekomendasi personal' });
  }
});

module.exports = router;