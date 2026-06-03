// Tambahkan di atas file
const { query } = require('../config/database');

// Contoh endpoint GET /api/recommend/movies/list
router.get('/movies/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let movies, total;
    if (search) {
      const q = `%${search}%`;
      movies = await query(`
        SELECT movie_id, title, genres, actors, overview, imdb_rating 
        FROM movies WHERE title ILIKE $1 OR genres ILIKE $1 OR actors ILIKE $1
        ORDER BY imdb_rating DESC LIMIT $2 OFFSET $3
      `, [q, parseInt(limit), offset]);
      
      const totalRes = await query(`SELECT COUNT(*) FROM movies WHERE title ILIKE $1 OR genres ILIKE $1`, [q]);
      total = parseInt(totalRes.rows[0].count);
    } else {
      movies = await query(`
        SELECT movie_id, title, genres, actors, overview, imdb_rating 
        FROM movies ORDER BY imdb_rating DESC LIMIT $1 OFFSET $2
      `, [parseInt(limit), offset]);
      
      const totalRes = await query(`SELECT COUNT(*) FROM movies`);
      total = parseInt(totalRes.rows[0].count);
    }

    res.json({
      success: true,
      data: {
        movies: movies.rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    console.error('Get movies error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data film' });
  }
});