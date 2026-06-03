// API Service Layer - Komunikasi dengan Backend
// Backend runs on localhost:3001, proxied via Next.js rewrites

const API_BASE = '/api/v1';

// ============================================================
// Type Definitions
// ============================================================

export interface MovieFromAPI {
  title: string;
  genre: string;
  imdb_score: number;
  language: string;
  year: number | null;
  runtime: number | null;
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

export interface ContentBasedResponse {
  success: boolean;
  model: string;
  input_title: string;
  count: number;
  recommendations: MovieWithSimilarity[];
}

export interface HealthResponse {
  success: boolean;
  data: {
    node_server: string;
    python_inference_server: string;
    python_details: Record<string, unknown>;
  };
}

export interface APIErrorResponse {
  success: false;
  message: string;
  error?: string;
  suggestions?: string[];
}

// ============================================================
// API Functions
// ============================================================

const DUMMY_MOVIES: MovieFromAPI[] = [
  { title: "Inception", genre: "Action, Sci-Fi, Thriller", imdb_score: 8.8, language: "English", year: 2010, runtime: 148 },
  { title: "The Dark Knight", genre: "Action, Crime, Drama", imdb_score: 9.0, language: "English", year: 2008, runtime: 152 },
  { title: "Interstellar", genre: "Adventure, Drama, Sci-Fi", imdb_score: 8.6, language: "English", year: 2014, runtime: 169 },
  { title: "Parasite", genre: "Comedy, Drama, Thriller", imdb_score: 8.5, language: "Korean", year: 2019, runtime: 132 },
  { title: "Avengers: Endgame", genre: "Action, Adventure, Drama", imdb_score: 8.4, language: "English", year: 2019, runtime: 181 },
  { title: "The Matrix", genre: "Action, Sci-Fi", imdb_score: 8.7, language: "English", year: 1999, runtime: 136 },
  { title: "Forrest Gump", genre: "Drama, Romance", imdb_score: 8.8, language: "English", year: 1994, runtime: 142 },
  { title: "Pulp Fiction", genre: "Crime, Drama", imdb_score: 8.9, language: "English", year: 1994, runtime: 154 },
  { title: "The Shawshank Redemption", genre: "Drama", imdb_score: 9.3, language: "English", year: 1994, runtime: 142 },
  { title: "The Godfather", genre: "Crime, Drama", imdb_score: 9.2, language: "English", year: 1972, runtime: 175 },
  { title: "Spirited Away", genre: "Animation, Adventure, Family", imdb_score: 8.6, language: "Japanese", year: 2001, runtime: 125 },
  { title: "Laskar Pelangi", genre: "Drama", imdb_score: 8.0, language: "Indonesian", year: 2008, runtime: 125 },
  { title: "Pengabdi Setan", genre: "Horror, Mystery", imdb_score: 7.6, language: "Indonesian", year: 2017, runtime: 107 },
  { title: "Gundala", genre: "Action, Sci-Fi", imdb_score: 6.9, language: "Indonesian", year: 2019, runtime: 119 },
  { title: "Habibie & Ainun", genre: "Drama, Romance", imdb_score: 7.6, language: "Indonesian", year: 2012, runtime: 118 },
  { title: "Spider-Man: No Way Home", genre: "Action, Adventure, Fantasy", imdb_score: 8.2, language: "English", year: 2021, runtime: 148 },
  { title: "Everything Everywhere All at Once", genre: "Action, Adventure, Comedy", imdb_score: 7.8, language: "English", year: 2022, runtime: 139 },
  { title: "The Lord of the Rings: The Return of the King", genre: "Action, Adventure, Drama", imdb_score: 9.0, language: "English", year: 2003, runtime: 201 },
  { title: "Your Name.", genre: "Animation, Drama, Fantasy", imdb_score: 8.4, language: "Japanese", year: 2016, runtime: 106 },
  { title: "Joker", genre: "Crime, Drama, Thriller", imdb_score: 8.4, language: "English", year: 2019, runtime: 122 }
];

/**
 * Fetch daftar film dengan pagination dan pencarian
 */
export async function fetchMovies(
  page: number = 1,
  limit: number = 20,
  search: string = ''
): Promise<MoviesResponse> {
  await new Promise(resolve => setTimeout(resolve, 500));

  let filteredMovies = DUMMY_MOVIES;
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    filteredMovies = DUMMY_MOVIES.filter(m => 
      m.title.toLowerCase().includes(searchLower) || 
      m.genre.toLowerCase().includes(searchLower)
    );
  }

  const total = filteredMovies.length;
  const total_pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedMovies = filteredMovies.slice(start, end);

  return {
    success: true,
    page,
    limit,
    total,
    total_pages: total_pages === 0 ? 1 : total_pages,
    movies: paginatedMovies
  };
}

/**
 * Fetch rekomendasi Content-Based Filtering berdasarkan judul film
 */
export async function fetchContentBasedRecommendations(
  title: string,
  topN: number = 10
): Promise<ContentBasedResponse> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const shuffled = [...DUMMY_MOVIES].sort(() => 0.5 - Math.random());
  const recommendations: MovieWithSimilarity[] = shuffled
    .filter(m => m.title.toLowerCase() !== title.toLowerCase())
    .slice(0, topN)
    .map(m => ({
      ...m,
      similarity_score: 0.5 + Math.random() * 0.4
    }))
    .sort((a, b) => b.similarity_score - a.similarity_score);

  return {
    success: true,
    model: 'dummy-tfidf',
    input_title: title,
    count: recommendations.length,
    recommendations
  };
}

/**
 * Health check - cek apakah backend dan Python server aktif
 */
export async function fetchHealthCheck(): Promise<HealthResponse> {
  return {
    success: true,
    data: {
      node_server: 'Dummy Node (Running)',
      python_inference_server: 'Dummy Python (Running)',
      python_details: { mocked: true }
    }
  };
}

// ============================================================
// Helper Utilities
// ============================================================

/**
 * Format IMDB score to display string
 */
export function formatIMDBScore(score: number): string {
  return score ? score.toFixed(1) : 'N/A';
}

/**
 * Format runtime menit ke string "Xh Ym"
 */
export function formatRuntime(minutes: number | null): string {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * Format similarity score ke persentase
 */
export function formatSimilarityScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

/**
 * Encode judul film untuk URL
 */
export function encodeMovieTitle(title: string): string {
  return encodeURIComponent(title);
}

/**
 * Decode judul film dari URL
 */
export function decodeMovieTitle(encoded: string): string {
  return decodeURIComponent(encoded);
}

/**
 * Parse genre string ke array
 */
export function parseGenres(genreString: string): string[] {
  if (!genreString || genreString === 'nan') return [];
  return genreString.split(',').map(g => g.trim()).filter(Boolean);
}

/**
 * Get color gradient based on IMDB score
 */
export function getScoreColor(score: number): string {
  if (score >= 8) return '#00A9FF';
  if (score >= 7) return '#89CFF3';
  if (score >= 6) return '#A0E9FF';
  return '#CDF5FD';
}
