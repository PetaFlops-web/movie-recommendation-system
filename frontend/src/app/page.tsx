'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Film,
  TrendingUp,
  Star,
  AlertCircle,
  ChevronRight,
  X,
  LogOut,
  Sparkles
} from 'lucide-react';

import { useAuth } from '@/app/contexts/AuthContext';
import { fetchMovies, fetchTrendingMovies } from '@/app/lib/api';
import { MovieFromAPI } from '@/types/movieType';
import MovieCard from '@/components/card';
import SkeletonCard from '@/components/SkeletonCard';


function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

function parseGenres(genre?: string): string[] {
  if (!genre || genre === 'nan') return [];
  return genre.split(',').map((g) => g.trim()).filter(Boolean);
}

function formatIMDBScore(score?: number): string {
  if (!score) return '-';
  return score.toFixed(1);
}

function encodeMovieTitle(title: string): string {
  return encodeURIComponent(title);
}

const GENRE_LIST = [
  'Drama', 'Comedy', 'Documentary', 'Thriller', 'Romance',
  'Action', 'Horror', 'Crime', 'Animation', 'Sci-Fi',
  'Mystery', 'Family', 'Adventure', 'Fantasy',
];

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MovieFromAPI[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered] = useState(false);
  const [popularMovies, setPopularMovies] = useState<MovieFromAPI[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [popularPage, setPopularPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [trendingMovies, setTrendingMovies] = useState<MovieFromAPI[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreMovies, setGenreMovies] = useState<MovieFromAPI[]>([]);
  const [isLoadingGenre, setIsLoadingGenre] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragged, setIsDragged] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const heroMovies = trendingMovies.slice(0, 5);
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroMovies.length);
  }, [heroMovies.length]);




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

  const handleMouseDown = (e: React.MouseEvent | MouseEvent) => {
    // 1. Tambahkan baris ini untuk mencegah error 'null'
    if (!carouselRef.current) return;

    setIsDragging(true);
    setIsDragged(false);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    // 2. Tambahkan pengecekan null di sini juga
    if (!isDragging || !carouselRef.current) return;

    e.preventDefault();
    setIsDragged(true);
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const loadTrendingMovies = useCallback(async () => {
    setIsLoadingTrending(true);
    try {
      const data = await fetchTrendingMovies(1, 10);
      setTrendingMovies(data.movies);
    } catch {
      // silent fail
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  useEffect(() => {
    loadPopularMovies(1);
    loadTrendingMovies();
  }, [loadPopularMovies, loadTrendingMovies]);

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

  useEffect(() => {
    if (isHovered || heroMovies.length === 0) return;
    const interval = setInterval(nextSlide, 3000);
    return () => clearInterval(interval);
  }, [isHovered, nextSlide, heroMovies.length]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 backdrop-blur-md">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-bold text-lg md:text-3xl tracking-tight text-white">
              <Link href="/">Smart<span className="text-brand-300 font-extrabold">Movie</span></Link>
            </span>
            <span className="hidden sm:block text-[10px] text-slate-400 tracking-widest uppercase font-semibold">
              Sistem Rekomendasi
            </span>
          </div>

          <div ref={searchRef} className="relative flex-1 max-w-2xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-brand-300/60" />
              <input
                type="text"
                placeholder="Cari film..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                className="search-input w-full pr-10 md:pr-14 pl-9 md:pl-12 py-2 md:py-3.5 rounded-xl md:rounded-2xl text-white text-sm md:text-base placeholder:text-slate-500 font-medium bg-white/5 border border-white/10 focus:border-brand-300/50 focus:bg-white/10 outline-none transition-all"
              />
              {searchQuery && !isSearching && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400" />
                </button>
              )}
              {isSearching && (
                <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2">
                  <div className="loading-spinner w-4 h-4 md:w-5 md:h-5" />
                </div>
              )}
            </div>

            <AnimatePresence>
              {showSearchResults && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-xl md:rounded-2xl border border-brand-300/20 shadow-2xl overflow-hidden z-50 max-h-[300px] md:max-h-[400px] overflow-y-auto"
                >
                  {isSearching ? (
                    <div className="p-4 md:p-6 text-center">
                      <div className="loading-spinner mx-auto mb-2 md:mb-3" />
                      <p className="text-xs md:text-sm text-slate-400">Mencari film...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 md:p-6 text-center">
                      <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs md:text-sm text-slate-400">
                        Film tidak ditemukan untuk &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="py-1.5 md:py-2">
                      {searchResults.map((movie, i) => (
                        <Link
                          key={`${movie.title}-${i}`}
                          href={`/movie/${encodeMovieTitle(movie.title)}`}
                          onClick={() => setShowSearchResults(false)}
                        >
                          <div className="px-3 md:px-4 py-2.5 md:py-3 hover:bg-white/5 transition-colors flex items-center justify-between group">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs md:text-sm font-semibold text-white group-hover:text-brand-300 transition-colors truncate">
                                {movie.title}
                              </h4>
                              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-[11px] text-slate-400 mt-0.5 md:mt-1">
                                {movie.year && <span>{movie.year}</span>}
                                {movie.genre && movie.genre !== 'nan' && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span className="truncate">{movie.genre}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 ml-2 md:ml-3 shrink-0">
                              {movie.imdb_score > 0 && (
                                <span className="flex items-center gap-1 text-[10px] md:text-[11px] font-bold text-amber-400">
                                  <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-amber-400" />
                                  {formatIMDBScore(movie.imdb_score)}
                                </span>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-600 group-hover:text-brand-300 transition-colors" />
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

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/profile" className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-300/15 border border-brand-300/25 flex items-center justify-center">
                <span className="text-xs font-bold text-brand-300">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-300">{user?.username || 'User'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.02] border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto pb-20">
        {/* Hero Section */}
        <section className="relative w-full h-[85vh] overflow-hidden group">
          {isLoadingTrending ? (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a0a2e] to-[#0d1b2a] flex items-center justify-center">
              <div className="loading-spinner w-12 h-12" />
            </div>
          ) : heroMovies.length === 0 ? (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a0a2e] to-[#0d1b2a] flex items-center justify-center text-white text-lg">
              Tidak ada film trending.
            </div>
          ) : (
            <>
              <div className="absolute inset-0">
                {heroMovies.map((movie, index) => (
                  <div
                    key={movie.title + index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                  >
                    {movie.poster_url ? (
                      <>
                        {/* Efek Blur di belakang: Menyembunyikan fakta bahwa gambar pecah */}
                        <Image
                          src={movie.poster_url}
                          alt=""
                          fill
                          quality={50} // Kualitas rendah tidak masalah karena toh di-blur
                          className="object-cover opacity-30 blur-3xl scale-110 -z-10"
                        />

                        {/* Gambar utama di depan: Tampil utuh, tajam, tidak ditarik (stretch) */}
                        <Image
                          src={movie.poster_url}
                          alt={movie.title}
                          fill
                          quality={100}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-contain object-center z-0"
                          priority={index === 0}
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a0a2e] to-[#0d1b2a]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0a1628]/70 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-[#0a1628]/40 z-10" />
                  </div>
                ))}
              </div>

              {heroMovies[currentIndex] && (
                <div className="absolute inset-0 z-20 flex items-center">
                  <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="max-w-2xl"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        {heroMovies[currentIndex].imdb_score > 0 && (
                          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-lg">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-bold text-amber-400">
                              {formatIMDBScore(heroMovies[currentIndex].imdb_score)}
                            </span>
                          </div>
                        )}
                        {heroMovies[currentIndex].year && (
                          <span className="text-sm font-semibold text-slate-300">
                            {heroMovies[currentIndex].year}
                          </span>
                        )}
                        {heroMovies[currentIndex].runtime && (
                          <span className="text-sm text-slate-400">
                            {Math.floor((heroMovies[currentIndex].runtime as number) / 60)}h {(heroMovies[currentIndex].runtime as number) % 60}m
                          </span>
                        )}
                      </div>

                      <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 drop-shadow-2xl">
                        {heroMovies[currentIndex].title}
                      </h1>

                      <div className="flex flex-wrap gap-2 mb-5">
                        {parseGenres(heroMovies[currentIndex].genre).slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/15 text-slate-200 backdrop-blur-sm"
                          >
                            {g}
                          </span>
                        ))}
                      </div>

                      {heroMovies[currentIndex].overview && (
                        <p className="text-sm md:text-base text-slate-300/90 leading-relaxed mb-8 line-clamp-3 max-w-xl">
                          {heroMovies[currentIndex].overview}
                        </p>
                      )}

                      <div className="flex items-center gap-4">
                        <Link href={`/movie/${encodeMovieTitle(heroMovies[currentIndex].title)}`}>
                          <button className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-brand-300 hover:bg-brand-200 text-white font-bold text-sm transition-all shadow-lg shadow-brand-300/30 hover:shadow-brand-300/50 hover:scale-105">
                            <span className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="text-white font-serif font-bold text-xs italic leading-none">i</span>
                            </span>
                            Detail Film
                          </button>
                        </Link>


                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                {heroMovies.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`transition-all duration-300 rounded-full ${currentIndex === index
                      ? 'w-8 h-2.5 bg-brand-300'
                      : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a1628] to-transparent z-20 pointer-events-none" />
            </>
          )}
        </section>

        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
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

          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-8 h-8 text-brand-300" />
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Film Trending</h2>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-300/10 border border-brand-300/20 text-[12px] font-bold text-brand-200">
                Rating Tertinggi
              </span>
            </div>

            {isLoadingTrending ? (
              <div className="flex gap-4 md:gap-6 overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="shrink-0 w-[290px] md:w-[340px] h-[180px] md:h-[220px] glass-panel rounded-2xl p-5 md:p-6 border border-white/5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="h-5 w-16 bg-white/5 rounded shimmer-bg" />
                      <div className="h-6 md:h-8 w-3/4 bg-white/5 rounded shimmer-bg" />
                    </div>
                    <div className="h-4 w-1/2 bg-white/5 rounded shimmer-bg" />
                  </div>
                ))}
              </div>
            ) : (
              <div
                ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                style={{ scrollbarWidth: 'none' }}
              >
                {trendingMovies.map((movie, idx) => {
                  return (
                    <Link
                      key={`${movie.title}-${idx}`}
                      href={`/movie/${encodeMovieTitle(movie.title)}`}
                      // 2. Cegah redirect halaman jika user sedang mencoba menggeser (bukan klik detail)
                      onClick={(e) => {
                        if (isDragged) e.preventDefault();
                      }}
                      // 3. Cegah browser men-drag elemen link ini
                      draggable={false}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="shrink-0 w-[290px] md:w-[340px] h-[430px] md:h-[480px] glass-panel rounded-2xl cursor-pointer group border border-white/5 overflow-hidden relative flex flex-col justify-between"
                      >
                        {movie.poster_url && (
                          <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                            <Image
                              src={movie.poster_url}
                              alt={movie.title}
                              fill
                              sizes="(max-width: 768px) 290px, 340px"
                              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out pointer-events-none"
                              priority={idx < 2}
                              // 4. Cegah browser men-drag gambar
                              draggable={false}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/50 to-transparent via-45% z-10 pointer-events-none" />
                          </div>
                        )}

                        {/* ... (Kode konten kartu sisanya dibiarkan sama saja seperti sebelumnya) ... */}

                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-brand-200" />
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Kategori Genre</h2>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border ${selectedGenre === null
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
                  className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border ${selectedGenre === genre
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

          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Film className="w-10 h-10 text-brand-300" />
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Daftar Film</h2>
              <span className="ml-2 text-sm text-slate-500 font-medium">
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
                  Sebelumnya
                </button>
                <span className="px-4 py-2 rounded-xl text-xs font-bold text-brand-300 bg-brand-300/10 border border-brand-300/20">
                  {popularPage}
                </span>
                <button
                  onClick={() => loadPopularMovies(popularPage + 1)}
                  disabled={popularPage >= totalPages || isLoadingPopular}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-white/[0.03] border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
