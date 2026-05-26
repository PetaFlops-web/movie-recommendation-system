import {
  getContentBasedRecommendations,
  getNCFRecommendations,
  getHybridOnboardingRecommendations,
  getAllMovies,
  getAllUsers,
  checkHealth,
} from "../services/recommendation.service.js";
import { successResponse, errorResponse } from "../utils/response.helper.js";

/**
 * GET /api/v1/recommendations/content-based
 * Get movie recommendations based on content similarity
 */
export async function contentBasedController(req, res) {
  try {
    const { title, top_n } = req.query;

    if (!title) {
      return errorResponse(res, 'Query parameter "title" is required', 400);
    }

    const topN = parseInt(top_n) || 10;
    const result = await getContentBasedRecommendations(title, topN);

    if (!result.success) {
      return errorResponse(res, result.error, result.status, result.details);
    }

    return successResponse(res, result.data, "Content-based recommendations retrieved successfully");
  } catch (error) {
    console.error("[ContentBasedController] Error:", error.message);
    return errorResponse(res, "Failed to get content-based recommendations", 500);
  }
}

/**
 * GET /api/v1/recommendations/ncf
 * Get personalized recommendations via Neural Collaborative Filtering
 */
export async function ncfController(req, res) {
  try {
    const { username, top_n, exclude_seen } = req.query;

    if (!username) {
      return errorResponse(res, 'Query parameter "username" is required', 400);
    }

    const topN = parseInt(top_n) || 10;
    const excludeSeen = exclude_seen !== "false";
    const result = await getNCFRecommendations(username, topN, excludeSeen);

    if (!result.success) {
      return errorResponse(res, result.error, result.status, result.details);
    }

    return successResponse(res, result.data, "NCF recommendations retrieved successfully");
  } catch (error) {
    console.error("[NCFController] Error:", error.message);
    return errorResponse(res, "Failed to get NCF recommendations", 500);
  }
}

/**
 * POST /api/v1/recommendations/hybrid-onboarding
 * Get recommendations for new users based on liked movie titles
 */
export async function hybridOnboardingController(req, res) {
  try {
    const { liked_titles, top_n } = req.body;

    if (!liked_titles || !Array.isArray(liked_titles) || liked_titles.length === 0) {
      return errorResponse(
        res,
        'Request body must contain "liked_titles" as a non-empty array',
        400
      );
    }

    const topN = parseInt(top_n) || 10;
    const result = await getHybridOnboardingRecommendations(liked_titles, topN);

    if (!result.success) {
      return errorResponse(res, result.error, result.status, result.details);
    }

    return successResponse(res, result.data, "Hybrid onboarding recommendations retrieved successfully");
  } catch (error) {
    console.error("[HybridOnboardingController] Error:", error.message);
    return errorResponse(res, "Failed to get hybrid onboarding recommendations", 500);
  }
}

/**
 * GET /api/v1/movies
 * List all available movies with pagination and search
 */
export async function moviesController(req, res) {
  try {
    const { page, limit, search } = req.query;
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 20;
    const result = await getAllMovies(p, l, search || "");

    if (!result.success) {
      return errorResponse(res, result.error, result.status, result.details);
    }

    return successResponse(res, result.data, "Movies retrieved successfully");
  } catch (error) {
    console.error("[MoviesController] Error:", error.message);
    return errorResponse(res, "Failed to get movies", 500);
  }
}

/**
 * GET /api/v1/users
 * List all available users
 */
export async function usersController(req, res) {
  try {
    const result = await getAllUsers();

    if (!result.success) {
      return errorResponse(res, result.error, result.status, result.details);
    }

    return successResponse(res, result.data, "Users retrieved successfully");
  } catch (error) {
    console.error("[UsersController] Error:", error.message);
    return errorResponse(res, "Failed to get users", 500);
  }
}

/**
 * GET /api/v1/health
 * Check system health (Node.js + Python service)
 */
export async function healthController(req, res) {
  try {
    const pythonHealth = await checkHealth();

    const healthData = {
      node_server: "healthy",
      python_inference_server: pythonHealth.success ? "healthy" : "unavailable",
      python_details: pythonHealth.success ? pythonHealth.data : pythonHealth.error,
    };

    const statusCode = pythonHealth.success ? 200 : 207;
    return successResponse(res, healthData, "Health check completed", statusCode);
  } catch (error) {
    console.error("[HealthController] Error:", error.message);
    return errorResponse(res, "Health check failed", 500);
  }
}
