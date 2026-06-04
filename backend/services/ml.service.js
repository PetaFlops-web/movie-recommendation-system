import axios from 'axios';

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

/**
 * Get content-based recommendations from Python ML Service
 * @param {number} movieId - ID dari PostgreSQL (opsional, fallback)
 * @param {string} movieTitle - Judul film (PRIORITAS UTAMA)
 * @param {number} numRecommendations - Jumlah rekomendasi yang diminta
 */
export const getContentBasedRecommendations = async (movieId, movieTitle, numRecommendations = 10) => {
  // Validasi input: minimal harus ada title atau id
  if (!movieTitle && !movieId) {
    throw new Error('movie_title atau movie_id diperlukan untuk memanggil ML service');
  }

  const payload = {
    movie_id: movieId || null,
    movie_title: movieTitle || null,
    num_recommendations: parseInt(numRecommendations) || 10
  };

  console.log('🔍 ML Request:', payload);

  const response = await axios.post(`${PYTHON_URL}/recommend/content-based`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000
  });

  console.log(`✅ ML Response: ${response.data.recommendations?.length || 0} recommendations`);

  return {
    success: true,
    data: response.data,
    recommendations: response.data.recommendations || response.data.data || []
  };
};

/**
 * Health check untuk Python ML Service
 */
export const healthCheck = async () => {
  try {
    const response = await axios.get(`${PYTHON_URL}/health`, { timeout: 3000 });
    return { status: 'healthy', ...response.data };
  } catch (error) {
    return { 
      status: 'unreachable', 
      error: error.message,
      note: 'Pastikan python inference_server.py sedang berjalan'
    };
  }
};

/**
 * Search movies via ML service (opsional)
 */
export const searchMovies = async (searchQuery, genre = null, limit = 20) => {
  try {
    const response = await axios.get(`${PYTHON_URL}/search`, {
      params: { q: searchQuery, genre, limit },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('ML Search error:', error.message);
    return { movies: [], error: error.message };
  }
};

/**
 * Handle ML service errors and throw user-friendly messages
 */
export const handleMLError = (error, movieTitle, movieId) => {
  if (error.response?.status === 404) {
    throw new Error(`Film "${movieTitle || movieId}" tidak ditemukan di dataset ML`);
  }
  
  if (error.code === 'ECONNREFUSED') {
    throw new Error('ML Service tidak tersedia. Pastikan Python service running di port 5000');
  }
  
  if (error.code === 'ECONNABORTED') {
    throw new Error('ML Service timeout. Dataset mungkin terlalu besar atau server lambat');
  }
  
  throw new Error(error.response?.data?.error || error.message || 'Gagal menghubungi ML service');
};
