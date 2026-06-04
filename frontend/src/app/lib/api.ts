const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_BASE_URL}/api`;

// ============================================================
// Types
// ============================================================

export interface MovieFromAPI {
  movie_id?: number;
  title: string;
  genre: string;
  actors?: string;
  overview?: string;
  imdb_score: number;
  imdb_rating?: string | number;
  year: string;
  runtime?: number;
  language?: string;
  premiere?: string;
}

export interface MovieWithSimilarity extends MovieFromAPI {
  similarity_score: number;
}

export interface MoviesResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  movies: MovieFromAPI[];
}

export interface MovieDetailResponse {
  success: boolean;
  movie: MovieFromAPI;
  recommendations: MovieWithSimilarity[];
}

export interface HealthResponse {
  success: boolean;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

// ============================================================
// Mapping helpers
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
  };
}

function mapRecommendation(raw: Record<string, unknown>): MovieWithSimilarity {
  return {
    ...mapMovie(raw),
    similarity_score: parseRating(raw.similarity_score),
  };
}

// ============================================================
// Fetch helper with error handling for non-JSON responses
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
// API functions
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

  return {
    success: Boolean(json?.success),
    page: pagination.page ?? page,
    limit: pagination.limit ?? limit,
    total: pagination.total ?? rawMovies.length,
    total_pages: totalPages,
    movies: rawMovies.map(mapMovie),
  };
}

/**
 * Fetch detail film + rekomendasi berdasarkan judul film.
 * Alur: search by title → ambil movie_id → fetch detail by movie_id
 * Jika film tidak ada di ML dataset, tetap kembalikan data film dari search
 */
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

  // 2) Coba fetch detail + rekomendasi dari backend menggunakan movie_id
  if (found.movie_id) {
    try {
      const res = await safeFetch(`${API_BASE}/movies/${found.movie_id}`);
      if (res.ok) {
        const json = await safeJsonParse(res) as Record<string, unknown>;
        const data = json?.data as Record<string, unknown> | undefined;
        const movie = mapMovie((data?.movie as Record<string, unknown>) || found);
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

export async function fetchHealthCheck(): Promise<HealthResponse> {
  const res = await safeFetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check gagal (HTTP ${res.status})`);
  }
  return res.json();
}

// ============================================================
// Helpers
// ============================================================

export function formatIMDBScore(score: number): string {
  return score ? score.toFixed(1) : 'N/A';
}

export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return '';
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return '';
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

export function formatSimilarityScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function encodeMovieTitle(title: string): string {
  return encodeURIComponent(title);
}

export function decodeMovieTitle(encoded: string): string {
  return decodeURIComponent(encoded);
}

export function parseGenres(genreString: string): string[] {
  if (!genreString || genreString === 'nan') return [];
  return genreString.split(',').map((g) => g.trim()).filter(Boolean);
}

export function getScoreColor(score: number): string {
  if (score >= 8) return '#00A9FF';
  if (score >= 7) return '#89CFF3';
  if (score >= 6) return '#A0E9FF';
  return '#CDF5FD';
}
