import axios from 'axios';

// ✅ FIX: Default ke URL Railway yang benar (bukan localhost)
const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'https://pyhtton-service-production.up.railway.app';

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

  console.log('🔍 ML Request:', payload);

  try {
    const response = await axios.post(`${PYTHON_URL}/recommend/content-based`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log(`✅ ML Response: ${response.data.recommendations?.length || 0} recommendations`);

    // ✅ FIX: Return struktur yang jelas & konsisten
    return {
      success: true,
      // Python service return: { input: {...}, recommendations: [...] }
      recommendations: response.data.recommendations || response.data.data?.recommendations || [],
      input: response.data.input || response.data.data?.input || null
    };

  } catch (error) {
    console.error('❌ ML Service Error:', error.message);
    
    // ✅ FALLBACK: Return empty recommendations agar backend tidak crash
    return {
      success: false,
      recommendations: [],
      input: null,
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