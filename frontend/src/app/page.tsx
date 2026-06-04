'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Film,
  TrendingUp,
  Star,
  ArrowRight,
  Sparkles,
  Clock,
  Globe,
  ChevronRight,
  AlertCircle,
  X,
  LogOut,
} from 'lucide-react';
import {
  fetchMovies,
  type MovieFromAPI,
  formatIMDBScore,
  formatRuntime,
  parseGenres,
  encodeMovieTitle,
} from './lib/api';
import { useAuth } from './contexts/AuthContext';

// ============================================================
// Debounce hook
// ============================================================
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ============================================================
// Genre list
// ============================================================
const GENRE_LIST = [
  'Drama', 'Comedy', 'Documentary', 'Thriller', 'Romance',
  'Action', 'Horror', 'Crime', 'Animation', 'Sci-Fi',
  'Mystery', 'Family', 'Adventure', 'Fantasy',
];

// ============================================================
// Movie Card Component
// ============================================================
function MovieCard({ movie, index }: { movie: MovieFromAPI; index: number }) {
  const genres = parseGenres(movie.genre);
  const score = movie.imdb_score;
  const runtimeDisplay = movie.runtime ? formatRuntime(Number(movie.runtime) || null) : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/movie/${encodeMovieTitle(movie.title)}`}>
        <div className="movie-card glass-panel rounded-2xl p-5 border border-white/5 cursor-pointer group h-full flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex flex-wrap gap-1.5">
                {genres.slice(0, 2).map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-brand-200 bg-brand-300/10 border border-brand-300/20"
                  >
                    {g}
                  </span>
                ))}
              </div>
              {score > 0 && (
                <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 shrink-0">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-bold text-white">{formatIMDBScore(score)}</span>
                </div>
              )}
            </div>

            <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors leading-tight mb-2 line-clamp-2">
              {movie.title}
            </h3>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-3">
              {movie.year && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {movie.year}
                </span>
              )}
              {runtimeDisplay && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>{runtimeDisplay}</span>
                </>
              )}
              {movie.language && movie.language !== 'nan' && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {movie.language}
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400/80 leading-relaxed line-clamp-2 font-light">
              {movie.overview && movie.overview !== 'nan' && movie.overview.trim() !== ''
                ? movie.overview
                : <span className="italic text-slate-500/60">Sinopsis belum tersedia untuk film ini.</span>
              }
            </p>
          </div>

          <div className="pt-3 mt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {genres.join(' • ')}
            </span>
            <span className="text-[11px] font-bold text-brand-300 group-hover:text-white flex items-center gap-1 transition-colors">
              Detail <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================
// Skeleton Card
// ============================================================
function SkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/5 h-[260px] flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-14 bg-white/5 rounded-full shimmer-bg" />
          <div className="h-4 w-12 bg-white/5 rounded-full shimmer-bg" />
        </div>
        <div className="h-5 w-3/4 bg-white/5 rounded shimmer-bg" />
        <div className="h-3 w-1/2 bg-white/5 rounded shimmer-bg" />
        <div className="space-y-1.5 pt-2">
          <div className="h-2 w-full bg-white/5 rounded shimmer-bg" />
          <div className="h-2 w-2/3 bg-white/5 rounded shimmer-bg" />
        </div>
      </div>
      <div className="h-8 w-full bg-white/5 rounded shimmer-bg" />
    </div>
  );
}

// ============================================================
// Main Home Page
// ============================================================
export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MovieFromAPI[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [popularMovies, setPopularMovies] = useState<MovieFromAPI[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [popularPage, setPopularPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [trendingMovies, setTrendingMovies] = useState<MovieFromAPI[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreMovies, setGenreMovies] = useState<MovieFromAPI[]>([]);
  const [isLoadingGenre, setIsLoadingGenre] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ---- Auth Guard ----
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // ---- Logout ----
  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  // ---- Load Popular ----
  const loadPopularMovies = useCallback(async (page: number) => {
    setIsLoadingPopular(true);
    setError(null);
    try {
      const data = await fetchMovies(page, 12);
      setPopularMovies(data.movies);
      setTotalPages(data.total_pages);
      setPopularPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar film');
    } finally {
      setIsLoadingPopular(false);
    }
  }, []);

  // ---- Load Trending ----
  const loadTrendingMovies = useCallback(async () => {
    setIsLoadingTrending(true);
    try {
      const data = await fetchMovies(1, 100);
      const sorted = [...data.movies]
        .filter((m) => m.imdb_score > 0)
        .sort((a, b) => b.imdb_score - a.imdb_score)
        .slice(0, 10);
      setTrendingMovies(sorted);
    } catch {
      // silent fail
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  // ---- Init ----
  useEffect(() => {
    loadPopularMovies(1);
    loadTrendingMovies();
  }, [loadPopularMovies, loadTrendingMovies]);

  // ---- Search ----
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const doSearch = async () => {
      setIsSearching(true);
      setShowSearchResults(true);
      try {
        const data = await fetchMovies(1, 8, debouncedSearch);
        setSearchResults(data.movies);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    doSearch();
  }, [debouncedSearch]);

  // ---- Genre filter ----
  useEffect(() => {
    if (!selectedGenre) {
      setGenreMovies([]);
      return;
    }
    const loadGenre = async () => {
      setIsLoadingGenre(true);
      try {
        const data = await fetchMovies(1, 100, selectedGenre);
        setGenreMovies(data.movies.slice(0, 12));
      } catch {
        setGenreMovies([]);
      } finally {
        setIsLoadingGenre(false);
      }
    };
    loadGenre();
  }, [selectedGenre]);

  // ---- Outside click ----
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---- Auth Loading Guard ----
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center cinematic-bg">
        <div className="loading-spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen z-10 selection:bg-brand-300/30 selection:text-brand-50">
      {/* Background */}
      <div className="cinematic-bg">
        <div className="glow-orb glow-orb-primary" />
        <div className="glow-orb glow-orb-secondary" />
        <div className="glow-orb glow-orb-center" />
        <div className="stars-overlay" />
        <div className="neon-grid" />
      </div>

      {/* ============================================================ */}
      {/* HEADER / NAVBAR — dengan User Info + Logout                  */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-300 to-brand-200 flex items-center justify-center shadow-lg shadow-brand-300/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white">
                Smart<span className="text-brand-300 font-extrabold">Movie</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 tracking-widest uppercase font-semibold">
                Sistem Rekomendasi Film
              </span>
            </div>
          </div>

          {/* User Info + Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-300/15 border border-brand-300/25 flex items-center justify-center">
                <span className="text-xs font-bold text-brand-300">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-300">{user?.username || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.02] border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTENT                                                 */}
      {/* ============================================================ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">

        {/* HERO */}
        <section className="pt-8 sm:pt-12 lg:pt-16 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-300/10 border border-brand-300/20 text-xs text-brand-200 backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-300" />
              </span>
              <span className="font-medium tracking-wide">Platform Rekomendasi Film Terbaik</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white mb-6">
            Temukan Film <br className="hidden sm:inline" />
            <span className="gradient-text-blue">Favoritmu</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Eksplorasi ribuan film dari berbagai genre. Cari judul favoritmu dan temukan tontonan seru lainnya yang khusus direkomendasikan untukmu.
          </p>

          {/* SEARCH */}
          <div ref={searchRef} className="relative max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300/60" />
              <input
                id="search-movies"
                type="text"
                placeholder="Cari judul film..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                className="search-input w-full pl-12 pr-12 py-4 rounded-2xl text-white text-base placeholder:text-slate-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="loading-spinner" />
                </div>
              )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl border border-brand-300/20 shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                >
                  {isSearching ? (
                    <div className="p-6 text-center">
                      <div className="loading-spinner mx-auto mb-3" />
                      <p className="text-sm text-slate-400">Mencari film...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-6 text-center">
                      <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        Film tidak ditemukan untuk &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((movie, i) => (
                        <Link
                          key={`${movie.title}-${i}`}
                          href={`/movie/${encodeMovieTitle(movie.title)}`}
                          onClick={() => setShowSearchResults(false)}
                        >
                          <div className="px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between group">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors truncate">
                                {movie.title}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                {movie.year && <span>{movie.year}</span>}
                                {movie.genre && movie.genre !== 'nan' && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span className="truncate">{movie.genre}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3 shrink-0">
                              {movie.imdb_score > 0 && (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  {formatIMDBScore(movie.imdb_score)}
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-300 transition-colors" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-300">Gagal memuat data</p>
              <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
              <p className="text-xs text-red-400/60 mt-1">Pastikan backend server berjalan</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                loadPopularMovies(1);
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold hover:bg-red-500/30 transition-colors"
            >
              Coba Lagi
            </button>
          </motion.div>
        )}

        {/* TRENDING */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-brand-300" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Film Trending</h2>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-300/10 border border-brand-300/20 text-[10px] font-bold text-brand-200">
              Rating Tertinggi
            </span>
          </div>

          {isLoadingTrending ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="shrink-0 w-[260px] h-[160px] glass-panel rounded-2xl p-4 border border-white/5">
                  <div className="space-y-3">
                    <div className="h-4 w-12 bg-white/5 rounded shimmer-bg" />
                    <div className="h-5 w-3/4 bg-white/5 rounded shimmer-bg" />
                    <div className="h-3 w-1/2 bg-white/5 rounded shimmer-bg" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {trendingMovies.map((movie, idx) => {
                const genres = parseGenres(movie.genre);
                return (
                  <Link key={`${movie.title}-${idx}`} href={`/movie/${encodeMovieTitle(movie.title)}`}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="shrink-0 w-[280px] glass-panel rounded-2xl p-5 border border-white/5 cursor-pointer group hover:border-brand-300/20 transition-all hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-brand-300/15 border border-brand-300/25 flex items-center justify-center text-xs font-black text-brand-300">
                            #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span className="text-xs font-bold">{formatIMDBScore(movie.imdb_score)}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-300 transition-colors" />
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors leading-tight mb-2 line-clamp-2">
                        {movie.title}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {genres.slice(0, 2).map((g) => (
                          <span
                            key={g}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold text-brand-200/70 bg-brand-300/5 border border-brand-300/10"
                          >
                            {g}
                          </span>
                        ))}
                        {movie.year && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500">
                            {movie.year}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* GENRE */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-brand-200" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Kategori Genre</h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                selectedGenre === null
                  ? 'bg-brand-300 text-white border-brand-300 shadow-lg shadow-brand-300/20'
                  : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              Semua
            </button>
            {GENRE_LIST.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre === selectedGenre ? null : genre)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedGenre === genre
                    ? 'bg-brand-300 text-white border-brand-300 shadow-lg shadow-brand-300/20'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selectedGenre && (
              <motion.div
                key={selectedGenre}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {isLoadingGenre ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : genreMovies.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {genreMovies.map((movie, idx) => (
                      <MovieCard key={`${movie.title}-${idx}`} movie={movie} index={idx} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 glass-panel rounded-2xl border border-white/5">
                    <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">
                      Tidak ada film ditemukan untuk genre &ldquo;{selectedGenre}&rdquo;
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* POPULAR */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Film className="w-5 h-5 text-brand-300" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Daftar Film</h2>
            <span className="ml-2 text-xs text-slate-500 font-medium">
              Halaman {popularPage} dari {totalPages}
            </span>
          </div>

          {isLoadingPopular ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {popularMovies.map((movie, idx) => (
                <MovieCard key={`${movie.title}-${idx}`} movie={movie} index={idx} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => loadPopularMovies(popularPage - 1)}
                disabled={popularPage <= 1 || isLoadingPopular}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-white/[0.03] border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Sebelumnya
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (popularPage <= 3) {
                    pageNum = i + 1;
                  } else if (popularPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = popularPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => loadPopularMovies(pageNum)}
                      disabled={isLoadingPopular}
                      className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                        popularPage === pageNum
                          ? 'bg-brand-300 text-white shadow-lg shadow-brand-300/20'
                          : 'text-slate-400 bg-white/[0.03] border border-white/10 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => loadPopularMovies(popularPage + 1)}
                disabled={popularPage >= totalPages || isLoadingPopular}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-white/[0.03] border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Selanjutnya →
              </button>
            </div>
          )}
        </section>


      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 bg-slate-950/30 backdrop-blur-md relative z-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
            <Film className="w-4 h-4 text-brand-300" />
            <span>SmartMovie</span>
            <span>•</span>
            <span>Platform Film & Rekomendasi</span>
          </div>
          <div>&copy; {new Date().getFullYear()} SmartMovie. Semua hak cipta dilindungi.</div>
        </div>
      </footer>
    </div>
  );
}
