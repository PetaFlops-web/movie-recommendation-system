import { MovieFromAPI, MovieWithSimilarity, MoviesResponse, MovieDetailResponse, Comment, UserProfile } from '@/types/movieType';

// ============================================================
// API Configuration — reads from .env (NEXT_PUBLIC_API_URL)
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_BASE_URL}/api`;

// ============================================================
// Data Mapping Helpers
// ============================================================

function parseRating(value: unknown): number {
  if (value === undefined || value === null || value === '' || value === 'nan') return 0;
  if (typeof value === 'number') return value;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function parseRuntimeValue(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '' || value === 'nan') return undefined;
  if (typeof value === 'number') return value;
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : undefined;
}

function mapMovie(raw: Record<string, unknown>): MovieFromAPI {
  return {
    movie_id: raw.movie_id as number | undefined,
    title: (raw.title as string) || 'Unknown',
    genre: (raw.genres as string) || (raw.genre as string) || '',
    actors: (raw.actors as string) || undefined,
    overview: (raw.overview as string) || undefined,
    imdb_score: parseRating(raw.imdb_rating ?? raw.imdb_score),
    imdb_rating: (raw.imdb_rating as string | number) ?? undefined,
    year: (raw.year as string) || '',
    runtime: parseRuntimeValue(raw.runtime),
    language: (raw.language as string) || undefined,
    premiere: (raw.premiere as string) || undefined,
    poster_url: (raw.poster_url as string) || undefined,
  };
}

function mapRecommendation(raw: Record<string, unknown>): MovieWithSimilarity {
  return {
    ...mapMovie(raw),
    similarity_score: parseRating(raw.similarity_score),
  };
}

// ============================================================
// Fetch Helper with Error Handling
// ============================================================

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
  }
  return res;
}

async function safeJsonParse(res: Response): Promise<Record<string, unknown>> {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`Server error (HTTP ${res.status}). Coba lagi nanti.`);
    }
    throw new Error('Response dari server tidak valid. Periksa konfigurasi API URL.');
  }
  return res.json();
}

// ============================================================
// Movie API Functions
// ============================================================

export async function fetchMovies(
  page: number = 1,
  limit: number = 20,
  search: string = ''
): Promise<MoviesResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) {
    params.set('search', search);
  }

  const res = await safeFetch(`${API_BASE}/movies?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Gagal memuat film (HTTP ${res.status})`);
  }

  const json = await safeJsonParse(res) as Record<string, unknown>;
  const data = json?.data as Record<string, unknown> | undefined;
  const rawMovies = (data?.movies as Record<string, unknown>[]) || [];
  const pagination = (data?.pagination as Record<string, number>) || {};

  const totalPages =
    pagination.pages ??
    (Math.ceil((pagination.total ?? rawMovies.length) / (pagination.limit || limit)) || 1);
  console.log('API Response:', {
    rawMovies,
  });
  return {
    success: Boolean(json?.success),
    page: pagination.page ?? page,
    limit: pagination.limit ?? limit,
    total: pagination.total ?? rawMovies.length,
    total_pages: totalPages,
    movies: rawMovies.map(mapMovie),
  };
}

export async function fetchMovieDetail(
  title: string
): Promise<MovieDetailResponse> {
  // 1) Search film berdasarkan judul untuk mendapatkan movie_id
  const searchData = await fetchMovies(1, 5, title);
  const exactMatch = searchData.movies.find(
    (m) => m.title.toLowerCase() === title.toLowerCase()
  );
  const found = exactMatch || (searchData.movies.length > 0 ? searchData.movies[0] : null);

  if (!found) {
    throw new Error('Film tidak ditemukan');
  }

  if (found.movie_id) {
    try {
      const res = await safeFetch(`${API_BASE}/movies/${found.movie_id}`);
      if (res.ok) {
        const json = await safeJsonParse(res) as Record<string, unknown>;
        const data = json?.data as Record<string, unknown> | undefined;
        const movie = mapMovie((data?.movie as Record<string, unknown>) || found);
        console.log('Movie detail API response:', { data });
        const recommendations = ((data?.recommendations as Record<string, unknown>[]) || []).map(mapRecommendation);
        return {
          success: true,
          movie,
          recommendations,
        };
      }
    } catch {
      // Jika gagal, fallback ke data dari search tanpa rekomendasi
    }
  }

  // 3) Fallback: film ada di database tapi tidak di ML dataset
  return {
    success: true,
    movie: found,
    recommendations: [],
  };
}

// ============================================================
// Profile API Functions
// ============================================================

export async function fetchProfile(userId: number): Promise<UserProfile> {
  const res = await safeFetch(`${API_BASE}/users/${userId}/profile`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Gagal memuat profil (HTTP ${res.status})`);
  }
  const json = await safeJsonParse(res) as Record<string, unknown>;
  return json?.data as UserProfile;
}

export async function updateProfile(
  userId: number,
  data: { display_name?: string; bio?: string; location?: string }
): Promise<UserProfile> {
  const res = await safeFetch(`${API_BASE}/users/${userId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Gagal memperbarui profil (HTTP ${res.status})`);
  }
  const json = await safeJsonParse(res) as Record<string, unknown>;
  return json?.data as UserProfile;
}

export async function deleteAccount(userId: number): Promise<void> {
  const res = await safeFetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Gagal menghapus akun (HTTP ${res.status})`);
  }
}

// ============================================================
// Social API Functions
// ============================================================

export async function getComments(movieId: number): Promise<{ comments: Comment[]; total: number }> {
  const res = await safeFetch(`${API_BASE}/movies/${movieId}/comments`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Gagal memuat komentar (HTTP ${res.status})`);
  }
  const json = await safeJsonParse(res) as Record<string, unknown>;
  const data = json?.data as Record<string, unknown>;
  return {
    comments: (data?.comments as Comment[]) || [],
    total: (data?.total as number) || 0,
  };
}

export async function addComment(
  movieId: number,
  userId: number,
  content: string
): Promise<Comment> {
  const res = await safeFetch(`${API_BASE}/movies/${movieId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal menambahkan komentar');
  }
  const json = await safeJsonParse(res) as Record<string, unknown>;
  return json?.data as Comment;
}

export async function getLikes(movieId: number): Promise<{ total_likes: number }> {
  const res = await safeFetch(`${API_BASE}/movies/${movieId}/likes`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Gagal memuat likes (HTTP ${res.status})`);
  }
  const json = await safeJsonParse(res) as Record<string, unknown>;
  return json?.data as { total_likes: number };
}

export async function toggleLike(
  movieId: number,
  userId: number
): Promise<{ liked: boolean }> {
  const res = await safeFetch(`${API_BASE}/movies/${movieId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal memproses like');
  }
  const json = await safeJsonParse(res) as Record<string, unknown>;
  return json?.data as { liked: boolean };
}

export async function shareMovie(
  movieId: number,
  userId: number,
  platform: string
): Promise<{ shared: boolean }> {
  const res = await safeFetch(`${API_BASE}/movies/${movieId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, platform }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Gagal share movie');
  }
  const json = await safeJsonParse(res) as Record<string, unknown>;
  return json?.data as { shared: boolean };
}
