export interface MovieFromAPI {
  movie_id?: number;
  title: string;
  genre: string;
  actors?: string;
  overview?: string;
  imdb_score: number;
  imdb_rating?: string | number;
  year: string;
  poster_url?: string;
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

export interface Comment {
  id: number;
  user_id: number;
  movie_id: number;
  content: string;
  rating?: number;
  display_name?: string;
  username?: string;
  created_at: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  bio?: string;
  location?: string;
  created_at: string;
}