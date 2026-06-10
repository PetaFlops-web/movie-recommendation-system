'use client';
import { MovieFromAPI } from '@/types/movieType';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Film,
  TrendingUp,
  Star,
  Sparkles,
  ChevronRight,
  AlertCircle,
  X,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';
import { formatIMDBScore, parseGenres, encodeMovieTitle } from '@/helpers/jsosParser';
import SkeletonCard from '@/components/SkeletonCard';
import MovieCard from '@/components/card';
import { fetchMovies } from './lib/api';
import { useAuth } from './contexts/AuthContext';

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const GENRE_LIST = [
  'Drama', 'Comedy', 'Documentary', 'Thriller', 'Romance',
  'Action', 'Horror', 'Crime', 'Animation', 'Sci-Fi',
  'Mystery', 'Family', 'Adventure', 'Fantasy',
];


const images = [
  "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470770841072-f978cbd4ee04?w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop",
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
  const [isHovered, setIsHovered] = useState(false);
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
  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
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

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };
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

  useEffect(() => {
    // Jika gambar di-hover, hentikan interval otomatis
    if (isHovered) return;

    const slideInterval = setInterval(() => {
      nextSlide();
    }, 3000); // Gambar akan bergeser setiap 3000ms (3 detik)

    // Membersihkan interval agar tidak terjadi memory leak
    return () => clearInterval(slideInterval);
  }, [isHovered, currentIndex]);

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
        {/* Tambahkan gap-3 md:gap-6 agar elemen tidak saling menempel di layar kecil */}
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 md:gap-6">

          {/* Logo - Beri shrink-0 agar ukurannya tidak tertekan oleh Search Bar */}
          <div className="flex items-center gap-3 shrink-0">
            <div>
              <span className="font-bold text-lg md:text-3xl tracking-tight text-white">
                Smart<span className="text-brand-300 font-extrabold">Movie</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 tracking-widest uppercase font-semibold">
                Sistem Rekomendasi
              </span>
            </div>
          </div>

          {/* SEARCH - Beri flex-1 agar mengisi sisa ruang tengah secara otomatis dan dinamis */}
          <div ref={searchRef} className="relative flex-1 max-w-2xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-brand-300/60" />
              <input
                id="search-movies"
                type="text"
                placeholder="Cari film..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                // Penyesuaian responsif: py-2 di HP, py-3.5 di Desktop. Ukuran teks lebih kecil di HP.
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

            {/* Dropdown Pencarian */}
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

          {/* User Info + Logout - Beri shrink-0 */}
          <div className="flex items-center gap-3 shrink-0">
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
              // Padding sedikit diperkecil di mobile
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.02] border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>

        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTENT                                                 */}
      {/* ============================================================ */}
      <main className="mx-auto pb-20">

        {/* HERO SECTION */}
        <section className="pb-12 text-center">
          <div
            className="relative w-full h-[80vh] group overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Wrapper Gambar Utama */}
            <div
              className="flex transition-transform duration-700 ease-in-out h-full w-full"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {images.map((img, index) => (
                <div
                  key={index}
                  // Shadow kustom bawah & kiri biru
                  className="w-full h-full flex-shrink-0 bg-cover bg-center shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),-12px_0_15px_-3px_rgba(59,130,246,0.5)]"
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))}
            </div>

            {/* Tombol Slide Kiri */}
            <button
              onClick={prevSlide}
              className="absolute top-1/2 left-5 -translate-y-1/2 bg-black/50 text-white p-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80 z-10"
            >
              &#10094;
            </button>

            {/* Tombol Slide Kanan */}
            <button
              onClick={nextSlide}
              className="absolute top-1/2 right-5 -translate-y-1/2 bg-black/50 text-white p-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80 z-10"
            >
              &#10095;
            </button>

            {/* Indikator Titik Bawah (Dots) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === index ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
                    }`}
                />
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
          {/* ERROR HANDLING */}
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

          {/* TRENDING SECTION */}
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
                  // Skeleton disesuaikan dimensinya dengan Card asli
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
              <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {trendingMovies.map((movie, idx) => {
                  const genres = parseGenres(movie.genre);
                  return (
                    <Link key={`${movie.title}-${idx}`} href={`/movie/${encodeMovieTitle(movie.title)}`}>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        /* PERUBAHAN UTAMA: Ditambahkan height h-[430px] md:h-[480px], relative, dan overflow-hidden */
                        className="shrink-0 w-[290px] md:w-[340px] h-[430px] md:h-[480px] glass-panel rounded-2xl cursor-pointer group border border-white/5 overflow-hidden relative flex flex-col justify-between"
                      >

                        {/* 1. GAMBAR POSTER (FULL BACKROUND CARD) */}
                        {movie.poster_url && (
                          <div className="absolute inset-0 w-full h-full z-0">
                            <Image
                              src={movie.poster_url}
                              alt={movie.title}
                              fill
                              sizes="(max-width: 768px) 290px, 340px"
                              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                              priority={idx < 2} // Mengoptimalkan LCP untuk item slider terdepan
                            />
                            {/* Color Bleed Gradient: Menghubungkan poster ke warna background gelap web kamu (#0A1628) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/50 to-transparent via-45% z-10 pointer-events-none" />
                          </div>
                        )}

                        {/* 2. FLOATING HEADER BAR (Mengapung di Atas Poster) */}
                        <div className="absolute top-0 inset-x-0 p-5 md:p-6 z-20 flex items-center justify-between bg-gradient-to-b from-black/30 to-transparent pointer-events-none">
                          <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
                            {/* Rank Badge dengan backdrop blur agar kontras */}
                            <span className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#0A1628]/60 backdrop-blur-md border border-brand-300/30 flex items-center justify-center text-xs font-black text-brand-300 shadow-md">
                              #{idx + 1}
                            </span>
                            {/* Rating Badge */}
                            {movie.imdb_score > 0 && (
                              <div className="flex items-center gap-1 bg-[#0A1628]/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-md">
                                <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-[11px] font-bold text-white">
                                  {formatIMDBScore(movie.imdb_score)}
                                </span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white/70 group-hover:text-brand-300 transition-colors group-hover:translate-x-1 transition-transform pointer-events-auto" />
                        </div>

                        {/* 3. BOTTOM KONTEN (Judul & Metadata Meleleh di Bagian Bawah) */}
                        <div className="relative z-20 p-5 md:p-6 mt-auto w-full">

                          {/* Title dengan efek text-glow bawaan CSS kamu */}
                          <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-brand-300 transition-colors leading-tight mb-3 line-clamp-2 text-glow">
                            {movie.title}
                          </h3>

                          {/* Tags (Genre & Year) menggunakan class .genre-pill agar seragam */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {genres.slice(0, 2).map((g) => (
                              <span
                                key={g}
                                className="genre-pill px-2.5 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider"
                              >
                                {g}
                              </span>
                            ))}
                            {movie.year && (
                              <span className="px-2.5 py-0.5 rounded text-[10px] md:text-xs font-bold text-slate-400 bg-white/5 border border-white/10 backdrop-blur-sm">
                                {movie.year}
                              </span>
                            )}
                          </div>

                        </div>

                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* GENRE SECTION */}
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-brand-200" />
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Kategori Genre</h2>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedGenre(null)}
                // Padding tombol dikoreksi: kecil di mobile, sedikit lebih besar di desktop
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

          {/* POPULAR MOVIES SECTION */}
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
                  ← Sebelumnya
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNum;
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
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${popularPage === pageNum
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
        </div>
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
