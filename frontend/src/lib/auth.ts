// Authentication utilities for frontend

const STORAGE_KEY = process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || "auth_token";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
  error?: string;
}

/**
 * Save authentication token
 */
export const saveAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, token);
  }
};

/**
 * Get authentication token
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
};

/**
 * Remove authentication token
 */
export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token && isTokenValid(token);
};

/**
 * Check if token is valid (basic check)
 */
export const isTokenValid = (token: string): boolean => {
  try {
    // Basic JWT structure check
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode payload
    const payload = JSON.parse(atob(parts[1]));

    // Check expiration
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expirationTime;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Decode JWT token
 */
export const decodeToken = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
};

/**
 * Get user ID from token
 */
export const getUserIdFromToken = (): number | null => {
  const token = getAuthToken();
  if (!token) return null;

  const payload = decodeToken(token);
  return (payload?.userId as number) || (payload?.id as number) || null;
};

/**
 * Handle logout
 */
export const logout = (): void => {
  removeAuthToken();
  // Redirect to login page if needed
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  saveAuthToken,
  getAuthToken,
  removeAuthToken,
  isAuthenticated,
  isTokenValid,
  decodeToken,
  getUserIdFromToken,
  logout,
};
