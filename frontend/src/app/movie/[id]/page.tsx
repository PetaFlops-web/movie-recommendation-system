"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Film,
  Globe,
  Sparkles,
  Star,
  Search,
  Users,
  Zap,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { MovieFromAPI, MovieWithSimilarity, RecommendationsByCategory } from "@/types/movieType";
import { decodeMovieTitle, formatIMDBScore, formatRuntime, parseGenres, encodeMovieTitle } from "@/helpers/jsosParser";
import { fetchMovieDetail } from "@/app/lib/api";
import { useAuth } from "@/app/contexts/AuthContext";
import CommentSection from "@/components/CommentSection";
import InteractionsUserMovie from "@/components/IntrectionsUserMovie";
import { fetchMovies } from '@/app/lib/api';


function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function MovieDetailPage() {
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MovieFromAPI[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user, logout } = useAuth();
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const decodedTitle = decodeMovieTitle(params.id as string);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [movie, setMovie] = useState<MovieFromAPI | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsByCategory>({
    hybrid: [],
    tfidf: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  useEffect(() => {
    if (!decodedTitle) return;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const detail = await fetchMovieDetail(decodedTitle);
        setMovie(detail.movie);
        setRecommendations(detail.recommendations);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat detail film",
        );
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [decodedTitle]);

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

  const backdropGradient =
    "radial-gradient(circle at center, rgba(0, 169, 255, 0.25) 0%, rgba(10, 22, 40, 0.98) 70%)";
  const glowColor = "#00A9FF";

  // Scroll ref and handler for horizontal recommendations
  const hybridScrollRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const tfidfScrollRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const scrollByAmount = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const amount = direction === "left" ? -360 : 360;
      ref.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center cinematic-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner w-12 h-12" />
          <p className="text-brand-200 font-medium animate-pulse">
            Memuat data film...
          </p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center cinematic-bg">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Film Tidak Ditemukan
          </h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link href="/">
            <button className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold transition-colors w-full border border-white/10">
              Kembali ke Beranda
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const genres = parseGenres(movie.genre);
  const actors =
    movie.actors && movie.actors !== "nan"
      ? movie.actors
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
      : [];
  const runtimeDisplay = movie.runtime
    ? formatRuntime(Number(movie.runtime) || null)
    : "";

  return (
    <div className="relative min-h-screen z-10 selection:bg-brand-300/30 selection:text-brand-50 pb-20">
      <div className="cinematic-bg">
        <div
          className="absolute w-[900px] h-[900px] -top-[300px] left-1/2 -translate-x-1/2 -z-10 rounded-full blur-[140px] opacity-25 transition-all duration-700"
          style={{ background: backdropGradient }}
        />
        <div className="stars-overlay" />
        <div className="neon-grid" />
      </div>

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
              // Padding sedikit diperkecil di mobile
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.02] border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* DETAIL */}
        <section className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-10 border border-brand-300/10 shadow-2xl relative mb-12">
          <div className="absolute inset-0 bg-slate-950/60 z-0 backdrop-blur-[2px] rounded-3xl overflow-hidden" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Poster */}
            <div className="lg:col-span-4 flex justify-center">
              <div
                className="w-full max-w-[420px] aspect-[2/3] rounded-2xl relative overflow-hidden shadow-2xl border border-white/15 flex flex-col justify-between p-6 transition-all duration-500 hover:scale-[1.02]"
                style={{
                  boxShadow: `0 20px 40px -10px ${glowColor}25, 0 0 30px ${glowColor}10`,
                }}
              >
                {/* Poster Image or Gradient Fallback */}
                {movie.poster_url ? (
                  <div className="absolute inset-0 w-full h-full z-0">
                    <Image
                      src={movie.poster_url}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 420px"
                      className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/40 to-transparent via-40% z-10 pointer-events-none" />
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 z-0" style={{ background: backdropGradient }} />
                    <div className="absolute inset-0 bg-slate-950/50 z-0" />
                  </>
                )}

                <div className="relative z-20 flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-lg bg-[#0A1628]/60 backdrop-blur-md text-sm font-bold text-white border border-white/10 shadow-md">
                    SmartMovie
                  </span>
                  {movie.imdb_score > 0 && (
                    <div className="flex items-center gap-1 bg-[#0A1628]/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-amber-400 text-sm font-bold shadow-md">
                      <Star className="w-5 h-5 fill-amber-400" />
                      {formatIMDBScore(movie.imdb_score)}
                    </div>
                  )}
                </div>
                <div className="relative z-20 text-left">
                  <h2 className="text-2xl font-black text-white leading-tight tracking-tight text-glow drop-shadow-lg">
                    {movie.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-8 flex flex-col text-left h-full py-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none text-white mb-5">
                {movie.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-slate-300 mb-5">
                {movie.year && (
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-mono">
                    {movie.year}
                  </span>
                )}
                {runtimeDisplay && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-brand-300" />
                    {runtimeDisplay}
                  </span>
                )}
                {movie.language && movie.language !== "nan" && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4 text-brand-300" />
                    {movie.language}
                  </span>
                )}
                {movie.imdb_score > 0 && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-bold">
                      {formatIMDBScore(movie.imdb_score)}
                    </span>
                    <span className="text-[10px] text-amber-400/60">/ 10</span>
                  </span>
                )}
              </div>

              {/* Genre */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {genres.map((genre) => (
                    <span
                      key={genre}
                      className="genre-pill px-3.5 py-1.5 rounded-full text-xs md:text-sm lg:text-sm font-bold shadow-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Actors */}
              {actors.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6  text-brand-300" />
                    <h3 className="text-sm md:text-2xl lg:text-xl font-bold text-brand-200 uppercase tracking-wider">
                      Pemeran
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {actors.map((actor) => (
                      <span
                        key={actor}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-white/[0.03] border border-white/5"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Overview */}
              {movie.overview && movie.overview !== "nan" && (
                <div className="mb-6">
                  <h3 className="text-sm md:text-2xl lg:text-xl font-bold text-brand-200 uppercase tracking-wider mb-2">
                    Sinopsis
                  </h3>
                  <p className="text-sm md:text-2xl lg:text-xl text-slate-300 leading-relaxed font-light">
                    {movie.overview}
                  </p>
                </div>
              )}

              {movie.title && movie.movie_id !== undefined && (
                <InteractionsUserMovie movieId={movie.movie_id} movieTitle={movie.title} />
              )}

            </div>
          </div>
        </section>

        {/* REKOMENDASI */}
        {(recommendations.hybrid.length > 0 || recommendations.tfidf.length > 0) && (
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
              <Zap className="w-10 h-10 text-brand-300" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Rekomendasi Film
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Koleksi film yang mirip dengan{" "}
                  <strong className="text-brand-200">{movie.title}</strong>
                </p>
              </div>
            </div>

            {(() => {
              const renderRecCarousel = (
                items: MovieWithSimilarity[],
                scrollRef: React.RefObject<HTMLDivElement>,
                label: string,
                description: string,
              ) => {

                if (items.length === 0) return null;
                return (
                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: label === "Recommendations by Synopsis" ? "#A855F7" : "#3B82F6" }}
                          />
                          {label}
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">{description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => scrollByAmount(scrollRef, "left")}
                          className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/10 hover:border-brand-300/30 hover:bg-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-all group/btn"
                        >
                          <ChevronLeft className="w-4 h-4 group-hover/btn:text-brand-300 transition-colors" />
                        </button>
                        <button
                          onClick={() => scrollByAmount(scrollRef, "right")}
                          className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/10 hover:border-brand-300/30 hover:bg-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-all group/btn"
                        >
                          <ChevronRight className="w-4 h-4 group-hover/btn:text-brand-300 transition-colors" />
                        </button>
                      </div>
                    </div>
                    <div
                      ref={scrollRef}
                      className="flex gap-4 md:gap-6 overflow-x-auto pb-4"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {items.map((rec, idx) => {
                        const recRuntime = rec.runtime
                          ? formatRuntime(Number(rec.runtime) || null)
                          : "";
                        const recGenres = parseGenres(rec.genre);
                        return (
                          <motion.div
                            key={`${rec.title}-${idx}`}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.06 }}
                            className="shrink-0 w-[280px] md:w-[320px]"
                          >
                            <Link href={`/movie/${encodeMovieTitle(rec.title)}`}>
                              <div className="movie-card glass-panel relative w-full h-[430px] md:h-[480px] rounded-3xl cursor-pointer group overflow-hidden flex flex-col justify-end border border-white/5 shadow-lg">
                                {rec.poster_url && (
                                  <div className="absolute inset-0 w-full h-full z-0">
                                    <Image
                                      src={rec.poster_url}
                                      alt={rec.title}
                                      fill
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/60 to-transparent via-45% z-10 pointer-events-none" />
                                  </div>
                                )}
                                {rec.imdb_score > 0 && (
                                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#0A1628]/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg font-black text-[11px] border border-white/10 shadow-[0_0_15px_rgba(0,169,255,0.15)]">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    <span>{formatIMDBScore(rec.imdb_score)}</span>
                                  </div>
                                )}
                                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-[#0A1628]/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-brand-300/20 shadow-md">
                                  <Sparkles className="w-3 h-3 text-brand-300" />
                                  <span className="text-[11px] font-black text-brand-200">
                                    {(rec.similarity_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="relative z-20 p-5 w-full flex flex-col gap-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    {recGenres.slice(0, 2).map((g) => (
                                      <span
                                        key={g}
                                        className="genre-pill px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                                      >
                                        {g}
                                      </span>
                                    ))}
                                  </div>
                                  <h3 className="text-base md:text-lg font-black text-white group-hover:text-brand-300 transition-colors leading-tight line-clamp-2 text-glow">
                                    {rec.title}
                                  </h3>
                                  <p className="text-[11px] text-slate-400/80 leading-relaxed line-clamp-2 font-light">
                                    {rec.overview &&
                                      rec.overview !== "nan" &&
                                      rec.overview.trim() !== "" ? (
                                      rec.overview
                                    ) : (
                                      <span className="italic text-slate-500/60">
                                        Sinopsis belum tersedia untuk film ini.
                                      </span>
                                    )}
                                  </p>
                                  <div className="pt-3 mt-1 border-t border-brand-300/10 flex items-center justify-between text-[11px]">
                                    <div className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                                      {rec.year && <span>{rec.year}</span>}
                                      {rec.year && recRuntime && (
                                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                                      )}
                                      {recRuntime && <span>{recRuntime}</span>}
                                    </div>
                                    <span className="text-[10px] font-bold text-brand-300 group-hover:text-white flex items-center gap-1 transition-colors shrink-0">
                                      Lihat Detail
                                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                  </div>
                                </div>
                                <div className="absolute inset-0 border border-white/0 group-hover:border-brand-300/30 rounded-3xl transition-all duration-300 pointer-events-none z-20" />
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {renderRecCarousel(
                    recommendations.hybrid,
                    hybridScrollRef,
                    "Recommendations by Synopsis",
                    "Rekomendasi berdasarkan sinopsis",
                  )}
                  {renderRecCarousel(
                    recommendations.tfidf,
                    tfidfScrollRef,
                    "Recommendations by Similarity",
                    "Rekomendasi berdasarkan kemiripan fitur",
                  )}
                </>
              );
            })()}
          </section>
        )}

        {recommendations.hybrid.length === 0 && recommendations.tfidf.length === 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Zap className="w-10 h-10 text-brand-300" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Rekomendasi Film
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Koleksi film yang mirip dengan{" "}
                  <strong className="text-brand-200">{movie.title}</strong>
                </p>
              </div>
            </div>
            <div className="glass-panel p-12 rounded-3xl text-center border border-white/5">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">
                Tidak Ada Rekomendasi
              </h3>
              <p className="text-slate-400 text-sm">
                Belum ada rekomendasi serupa untuk film ini.
              </p>
            </div>
          </section>
        )}

        {/* SOCIAL INTERACTION — Comments */}
        {movie.movie_id && (
          <CommentSection movieId={movie.movie_id} />
        )}
      </main>
    </div>
  );
}
