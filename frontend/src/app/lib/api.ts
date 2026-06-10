import { MovieFromAPI, MovieWithSimilarity, MoviesResponse, MovieDetailResponse } from '@/types/movieType';

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
