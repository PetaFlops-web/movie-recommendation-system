const API_BASE_URL = 'http://localhost:3001';
const API_AUTH = `${API_BASE_URL}/api/auth`;

const STORAGE_KEY = process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'smartmovie_token';
const USER_STORAGE_KEY = `${STORAGE_KEY}_user`;
const PREFS_STORAGE_KEY = `${STORAGE_KEY}_preferences`;



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

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(PREFS_STORAGE_KEY);
}

export function getSavedUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getSavedPreferences(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(PREFS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAuth(data: AuthResponse['data']): void {
  setToken(data.token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(data.preferences));
}

export function updateStoredUser(updates: Partial<User>): User | null {
  if (typeof window === 'undefined') return null;
  const current = getSavedUser();
  if (!current) return null;
  const updated = { ...current, ...updates };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  return updated;
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
    console.log('Login response status:', res.status);
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
