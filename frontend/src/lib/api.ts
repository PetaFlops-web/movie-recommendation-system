// Frontend API Client Configuration
// This file handles all API communications with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000");

interface RequestOptions extends RequestInit {
  timeout?: number;
}

/**
 * Fetch wrapper with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestOptions = {},
): Promise<Response> {
  const { timeout = API_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Main API client for backend communication
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T = Record<string, unknown>>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers,
      ...options,
    });

    return handleResponse<T>(response);
  },

  /**
   * POST request
   */
  async post<T = Record<string, unknown>>(
    endpoint: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      ...options,
    });

    return handleResponse<T>(response);
  },

  /**
   * PUT request
   */
  async put<T = Record<string, unknown>>(
    endpoint: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetchWithTimeout(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
      ...options,
    });

    return handleResponse<T>(response);
  },

  /**
   * DELETE request
   */
  async delete<T = Record<string, unknown>>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetchWithTimeout(url, {
      method: "DELETE",
      headers,
      ...options,
    });

    return handleResponse<T>(response);
  },
};

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const error = await response.json();
      throw new Error(error.message || `API Error: ${response.status}`);
    } else {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  }

  if (!isJson) {
    throw new Error("Invalid response format");
  }

  return response.json() as Promise<T>;
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const storageKey = process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || "auth_token";
  return localStorage.getItem(storageKey);
}

/**
 * Movie API endpoints
 */
export const movieAPI = {
  getAll: (page?: number, limit?: number) =>
    apiClient.get(`/api/movies?page=${page || 1}&limit=${limit || 20}`),

  getById: (id: string | number) => apiClient.get(`/api/movies/${id}`),

  search: (query: string) =>
    apiClient.get(`/api/movies/search?q=${encodeURIComponent(query)}`),

  getRecommendations: (movieId: string | number, type: "cf" | "cbf" = "cf") =>
    apiClient.get(`/api/movies/${movieId}/recommendations?type=${type}`),

  getByGenre: (genre: string) =>
    apiClient.get(`/api/movies/genre/${encodeURIComponent(genre)}`),
};

/**
 * Auth API endpoints
 */
export const authAPI = {
  register: (credentials: {
    username: string;
    email: string;
    password: string;
  }) => apiClient.post("/api/auth/register", credentials),

  login: (credentials: { email: string; password: string }) =>
    apiClient.post("/api/auth/login", credentials),

  logout: () => {
    if (typeof window !== "undefined") {
      const storageKey =
        process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || "auth_token";
      localStorage.removeItem(storageKey);
    }
  },

  getCurrentUser: () => apiClient.get("/api/auth/me"),

  verifyToken: (token: string) => apiClient.post("/api/auth/verify", { token }),
};

/**
 * Health check
 */
export const healthAPI = {
  check: () => apiClient.get("/api/health"),

  pythonServiceHealth: () => apiClient.get("/api/health/python-service"),
};

export default apiClient;
