import axios from 'axios';

/**
 * Helper untuk mendapatkan URL Python ML Service secara aman dan dinamis.
 * Mengurangi risiko error 'Invalid URL' akibat modul dotenv belum termuat sempurna 
 * atau adanya typo slash ganda di file .env.
 */
const getPythonUrl = () => {
  // Mengambil URL dari .env, jika kosong akan menggunakan fallback URL Railway Python kamu
  const url = process.env.PYTHON_SERVICE_URL || 'https://python-service-production.up.railway.app';
  
  // Membersihkan karakter '/' di ujung URL jika ada (contoh: http://domain.com/ menjadi http://domain.com)
  return url.replace(/\/$/, '');
};

/**
 * Get Content-Based Recommendations (TF-IDF / Tag-based) dari Python ML Service
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

  const targetUrl = `${getPythonUrl()}/recommend/content-based`;
  console.log('ML Request (Content-Based) to:', targetUrl);
  console.log('Payload:', payload);

  try {
    const response = await axios.post(targetUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000 // Timeout 15 detik untuk mengatasi cold start di Railway
    });

    console.log(`ML Response (Content-Based): ${response.data.recommendations?.length || 0} recommendations`);

    return {
      success: true,
      recommendations: response.data.recommendations || response.data.data?.recommendations || [],
      input: response.data.input || response.data.data?.input || null
    };

  } catch (error) {
    console.error('ML Service Error (Content-Based):', error.message);
    return {
      success: false,
      recommendations: [],
      input: payload,
      error: error.message
    };
  }
};

/**
 * Get Hybrid Recommendations (Gabungan Collaborative + Content) dari Python ML Service
 */
export const getContentBasedRecommendationHybrid = async (movieId, movieTitle, numRecommendations = 10) => {
  if (!movieTitle && !movieId) {
    throw new Error('movie_title atau movie_id diperlukan');
  }

  const payload = {
    movie_id: movieId || null,
    movie_title: movieTitle || null,
    num_recommendations: parseInt(numRecommendations) || 10,
    min_similarity: 0.1, // Parameter similarity bawaan sistem hybrid kamu
    genre_filter: true   // Filter berdasarkan preferensi genre user
  };

  const targetUrl = `${getPythonUrl()}/recommend/hybrid`;
  console.log('ML Request (Hybrid) to:', targetUrl);
  console.log('Payload:', payload);

  try {
    const response = await axios.post(targetUrl, payload, {
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
 * Health check untuk mendeteksi apakah Python ML Service aktif atau sedang down
 */
export const healthCheck = async () => {
  const targetUrl = `${getPythonUrl()}/health`;
  try {
    const response = await axios.get(targetUrl, { timeout: 5000 });
    return { status: 'healthy', ...response.data };
  } catch (error) { 
    return { 
      status: 'unreachable', 
      error: error.message,
      note: 'Python service mungkin down, sleeping, atau URL salah konfigurasi.'
    };
  }
};

/**
 * Error utility handler khusus untuk membaca status error dari ML Service
 */
export const handleMLError = (error, movieTitle, movieId) => {
  if (error.response?.status === 404) {
    return `Film "${movieTitle || movieId}" tidak ditemukan di dataset ML`;
  }
  if (error.code === 'ECONNREFUSED') {
    return 'ML Service tidak tersedia. Cek koneksi atau URL service.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'ML Service mengalami timeout (Waktu habis).';
  }
  return error.message || 'Gagal menghubungi ML service';
};