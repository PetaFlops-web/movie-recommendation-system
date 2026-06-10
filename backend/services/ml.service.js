import axios from 'axios';

const PYTHON_URL = process.env.PYTHON_SERVICE_URL;

/**
 * Get content-based recommendations from Python ML Service
 */
export const getContentBasedRecommendations = async (movieId, movieTitle, numRecommendations = 10) => {
  if (!movieTitle && !movieId) {
    throw new Error('movie_title atau movie_id diperlukan');
  }

  const payload = {
    movie_id: movieId || null,
    movie_title: movieTitle || null,
    num_recommendations: parseInt(numRecommendations) || 10
  };

  console.log('ML Request:', payload);

  try {
    const response = await axios.post(`${PYTHON_URL}/recommend/content-based`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log(`ML Response: ${response.data.recommendations?.length || 0} recommendations`);

    // Return struktur yang jelas & konsisten
    return {
      success: true,
      recommendations: response.data.recommendations || response.data.data?.recommendations || [],
      input: response.data.input || response.data.data?.input || null
    };

  } catch (error) {
    console.error('ML Service Error:', error.message);
    
    return {
      success: false,
      recommendations: [],
      input: null,
      error: error.message
    };
  }
};

/**
 * Get Hybrid recommendations from Python ML Service
 */
export const getContentBasedRecommendationHybrid = async (movieId, movieTitle, numRecommendations = 10) => {
  if (!movieTitle && !movieId) {
    throw new Error('movie_title atau movie_id diperlukan');
  }

  const payload = {
    movie_id: movieId || null,
    movie_title: movieTitle || null,
    num_recommendations: parseInt(numRecommendations) || 10,
    min_similarity: 0.1, // Sesuai parameter hybrid Anda
    genre_filter: true   // Sesuai parameter hybrid Anda
  };

  console.log('ML Request (Hybrid):', payload);

  try {
    const response = await axios.post(`${PYTHON_URL}/recommend/hybrid`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log(`ML Response (Hybrid): ${response.data.recommendations?.length || 0} recommendations`);

    return {
      success: true,
      recommendations: response.data.recommendations || response.data.data?.recommendations || [],
      input: response.data.input || response.data.data?.input || null
    };

  } catch (error) {
    console.error('ML Service Error (Hybrid):', error.message);
    return {
      success: false,
      recommendations: [],
      input: payload,
      error: error.message
    };
  }
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
      note: 'Python service mungkin down atau URL salah'
    };
  }
};

/**
 * Handle ML service errors
 */
export const handleMLError = (error, movieTitle, movieId) => {
  if (error.response?.status === 404) {
    return `Film "${movieTitle || movieId}" tidak ditemukan di dataset ML`;
  }
  if (error.code === 'ECONNREFUSED') {
    return 'ML Service tidak tersedia. Cek koneksi atau URL service.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'ML Service timeout.';
  }
  return error.message || 'Gagal menghubungi ML service';
};