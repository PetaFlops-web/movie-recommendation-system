const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5001";


async function callPythonService(endpoint, options = {}) {
  const url = `${PYTHON_SERVICE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: data.error || "Python service returned an error",
        details: data,
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      status: 503,
      error: "Python inference service is unavailable. Make sure inference_server.py is running on port 5001.",
      details: error.message,
    };
  }
}

/**
 * Get content-based recommendations for a given movie title
 */
export async function getContentBasedRecommendations(title, topN = 10) {
  const params = new URLSearchParams({ title, top_n: topN });
  return callPythonService(`/predict/content-based?${params}`);
}

/**
 * Get NCF (collaborative filtering) recommendations for a user
 */
export async function getNCFRecommendations(username, topN = 10, excludeSeen = true) {
  const params = new URLSearchParams({
    username,
    top_n: topN,
    exclude_seen: excludeSeen.toString(),
  });
  return callPythonService(`/predict/ncf?${params}`);
}

/**
 * Get hybrid onboarding recommendations for new users
 */
export async function getHybridOnboardingRecommendations(likedTitles, topN = 10) {
  return callPythonService("/predict/hybrid-onboarding", {
    method: "POST",
    body: JSON.stringify({ liked_titles: likedTitles, top_n: topN }),
  });
}

/**
 * Get paginated list of all movies
 */
export async function getAllMovies(page = 1, limit = 20, search = "") {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append("search", search);
  return callPythonService(`/movies?${params}`);
}

/**
 * Get list of all users
 */
export async function getAllUsers() {
  return callPythonService("/users");
}

/**
 * Check Python service health
 */
export async function checkHealth() {
  return callPythonService("/health");
}
