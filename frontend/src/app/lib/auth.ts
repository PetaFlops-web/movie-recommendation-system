// Auth Service Layer
// Uses NEXT_PUBLIC_API_URL for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_AUTH = `${API_BASE_URL}/api/auth`;

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    preferences: string[];
    token: string;
  };
}

// ============================================================
// Token Management
// ============================================================

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('smartmovie_token');
}

export function setToken(token: string): void {
  localStorage.setItem('smartmovie_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('smartmovie_token');
  localStorage.removeItem('smartmovie_user');
  localStorage.removeItem('smartmovie_preferences');
}

export function getSavedUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('smartmovie_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getSavedPreferences(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('smartmovie_preferences');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAuth(data: AuthResponse['data']): void {
  setToken(data.token);
  localStorage.setItem('smartmovie_user', JSON.stringify(data.user));
  localStorage.setItem('smartmovie_preferences', JSON.stringify(data.preferences));
}

// ============================================================
// API Functions
// ============================================================

export async function register(
  username: string,
  email: string,
  password: string,
  genres: string[]
): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_AUTH}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, genres }),
    });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
  }

  // Handle non-JSON responses (e.g. HTML error pages)
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`Server error (HTTP ${res.status}). Coba lagi nanti.`);
    }
    throw new Error('Response dari server tidak valid. Periksa konfigurasi API URL.');
  }

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || 'Registrasi gagal');
  }

  return json;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_AUTH}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
  }

  // Handle non-JSON responses
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`Server error (HTTP ${res.status}). Coba lagi nanti.`);
    }
    throw new Error('Response dari server tidak valid. Periksa konfigurasi API URL.');
  }

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || 'Login gagal');
  }

  return json;
}
