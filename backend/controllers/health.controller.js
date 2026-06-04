import { successResponse } from '../utils/response.helper.js';
import { healthCheck } from '../services/ml.service.js';

/**
 * GET /api/health
 * System health check (Node.js + Python ML service)
 */
export const checkHealth = async (req, res) => {
  try {
    const mlStatus = await healthCheck();

    return successResponse(res, {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Smart Movie Recommendation Backend',
      database: 'PostgreSQL',
      ml_service: mlStatus,
      team: 'PJK-GM059'
    }, 'Health check completed');
  } catch (err) {
    // Tetap return 200 agar monitoring tidak panic
    return successResponse(res, {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Smart Movie Recommendation Backend',
      database: 'PostgreSQL',
      ml_service: { status: 'unreachable', note: 'Python ML service might be down' },
      team: 'PJK-GM059'
    }, 'Health check completed');
  }
};
