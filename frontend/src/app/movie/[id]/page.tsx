'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, 
  Star, 
  ArrowLeft, 
  ArrowRight,
  Clock,
  Globe,
  Zap,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  fetchMovies,
  fetchContentBasedRecommendations,
  type MovieFromAPI,
  type MovieWithSimilarity,
  formatIMDBScore,
  formatRuntime,
  parseGenres,
  decodeMovieTitle,
  encodeMovieTitle,
  formatSimilarityScore
} from '../../lib/api';

export default function MovieDetailPage() {
  const params = useParams();
  const movieId = params.id as string;
  const decodedTitle = decodeMovieTitle(movieId);
  
  // Movie detail state
  const [movie, setMovie] = useState<MovieFromAPI | null>(null);
  const [isLoadingMovie, setIsLoadingMovie] = useState(true);
  const [movieError, setMovieError] = useState<string | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<MovieWithSimilarity[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [hasRecommended, setHasRecommended] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Load movie detail on mount
  useEffect(() => {
    async function loadMovie() {
      setIsLoadingMovie(true);
      setMovieError(null);
      try {
        // Fetch movie by exact title search
        const data = await fetchMovies(1, 5, decodedTitle);
        // Find exact match or take first
        const exactMatch = data.movies.find(m => m.title.toLowerCase() === decodedTitle.toLowerCase());
        const found = exactMatch || (data.movies.length > 0 ? data.movies[0] : null);
        
        if (found) {
          setMovie(found);
        } else {
          setMovieError('Film tidak ditemukan');
        }
      } catch (err) {
        setMovieError(err instanceof Error ? err.message : 'Gagal memuat detail film');
      } finally {
        setIsLoadingMovie(false);
      }
    }

    if (decodedTitle) {
      loadMovie();
    }
  }, [decodedTitle]);

  // Handle get recommendations
  const handleGetRecommendations = async () => {
    if (!movie) return;
    
    setIsRecommending(true);
    setRecError(null);
    try {
      const data = await fetchContentBasedRecommendations(movie.title, 12);
      setRecommendations(data.recommendations);
      setHasRecommended(true);
    } catch (err) {
      setRecError(err instanceof Error ? err.message : 'Gagal mendapatkan rekomendasi');
    } finally {
      setIsRecommending(false);
    }
  };

  // Helper for background style
  const backdropGradient = 'radial-gradient(circle at center, rgba(0, 169, 255, 0.25) 0%, rgba(10, 22, 40, 0.98) 70%)';
  const glowColor = '#00A9FF';

  if (isLoadingMovie) {
    return (
      <div className="min-h-screen flex items-center justify-center cinematic-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner w-12 h-12" />
          <p className="text-brand-200 font-medium animate-pulse">Memuat data film...</p>
        </div>
      </div>
    );
  }

  if (movieError || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center cinematic-bg">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Film Tidak Ditemukan</h2>
          <p className="text-slate-400 text-sm mb-6">{movieError}</p>
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

  return (
    <div className="relative min-h-screen z-10 selection:bg-brand-300/30 selection:text-brand-50 pb-20">
      
      {/* Background Atmosphere Layers */}
      <div className="cinematic-bg">
        <div 
          className="absolute w-[900px] h-[900px] -top-[300px] left-1/2 -translate-x-1/2 -z-10 rounded-full blur-[140px] opacity-25 transition-all duration-700" 
          style={{ background: backdropGradient }}
        />
        <div className="stars-overlay"></div>
        <div className="neon-grid"></div>
      </div>

      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-300 to-brand-200 flex items-center justify-center shadow-lg shadow-brand-300/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white">
                Smart<span className="text-brand-300 font-extrabold">Movie</span>
              </span>
            </div>
          </Link>

          <Link href="/" className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.02] border border-white/5 hover:border-white/10 flex items-center gap-1.5 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* ============================================================ */}
        {/* HERO SECTION - MOVIE DETAIL */}
        {/* ============================================================ */}
        <section 
          className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-10 border border-brand-300/10 shadow-2xl relative overflow-hidden mb-12"
        >
          {/* Backdrop Glass Overlay */}
          <div className="absolute inset-0 bg-slate-950/60 z-0 backdrop-blur-[2px]" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Visual Art Box (Cinematic poster representation) */}
            <div className="lg:col-span-4 flex justify-center">
              <div 
                className="w-full max-w-[280px] aspect-[2/3] rounded-2xl relative overflow-hidden shadow-2xl border border-white/15 flex flex-col justify-between p-6 transition-all duration-500 hover:scale-[1.02]"
                style={{ 
                  background: backdropGradient,
                  boxShadow: `0 20px 40px -10px ${glowColor}25, 0 0 30px ${glowColor}10` 
                }}
              >
                <div className="absolute inset-0 bg-slate-950/50 z-0" />
                
                <div className="relative z-10 flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[9px] font-bold text-white border border-white/5">
                    SmartMovie
                  </span>
                  {movie.imdb_score > 0 && (
                    <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded border border-white/10 text-amber-400 text-[10px] font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {formatIMDBScore(movie.imdb_score)}
                    </div>
                  )}
                </div>

                <div className="relative z-10 text-left">
                  <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
                    {movie.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Typography and Meta details */}
            <div className="lg:col-span-8 flex flex-col justify-between text-left h-full py-4">
              
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-slate-300 mb-4">
                {movie.year && (
                  <>
                    <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-mono">
                      {movie.year}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  </>
                )}
                {movie.runtime && (
                  <>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-brand-300" />
                      {formatRuntime(movie.runtime)}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  </>
                )}
                {movie.language && movie.language !== 'nan' && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4 text-brand-300" />
                    {movie.language}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white mb-4">
                  {movie.title}
                </h1>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {genres.map(genre => (
                  <span 
                    key={genre}
                    className="genre-pill px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Get Recommendations CTA */}
              <div className="mt-auto">
                <button 
                  onClick={handleGetRecommendations}
                  disabled={isRecommending || hasRecommended}
                  className={`btn-gloss px-8 py-4 rounded-xl text-sm sm:text-base font-bold text-white transition-all shadow-lg flex items-center justify-center gap-3 sm:w-auto w-full ${
                    isRecommending || hasRecommended
                      ? 'bg-brand-500 opacity-80 cursor-wait' 
                      : 'bg-gradient-to-r from-brand-300 to-brand-500 border border-brand-300/30 shadow-brand-300/20 hover:shadow-brand-300/40 recommend-btn-pulse'
                  }`}
                >
                  {isRecommending ? (
                    <>
                      <div className="loading-spinner border-white/30 border-t-white" />
                      Menganalisis Konten...
                    </>
                  ) : hasRecommended ? (
                    <>
                      <Star className="w-5 h-5" />
                      Rekomendasi Ditemukan
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Dapatkan Rekomendasi
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* RECOMMENDATIONS SECTION */}
        {/* ============================================================ */}
        <AnimatePresence>
          {hasRecommended && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mt-8"
            >
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Zap className="w-6 h-6 text-brand-300" />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Rekomendasi Serupa
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Berdasarkan kemiripan konten dengan <strong className="text-brand-200">{movie.title}</strong></p>
                </div>
              </div>

              {recError ? (
                <div className="glass-panel p-6 rounded-2xl border-red-500/20 text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-300">{recError}</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="glass-panel p-12 rounded-3xl text-center border border-white/5">
                  <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-lg mb-2">Tidak Ada Rekomendasi</h3>
                  <p className="text-slate-400 text-sm">Maaf, kami belum memiliki cukup data untuk merekomendasikan film serupa.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {recommendations.map((rec, idx) => (
                    <motion.div
                      key={`${rec.title}-${idx}`}
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: idx * 0.05 }}
                    >
                      <Link href={`/movie/${encodeMovieTitle(rec.title)}`}>
                        <div className="movie-card glass-panel rounded-3xl p-5 border border-white/5 relative overflow-hidden group shadow-lg flex flex-col justify-between min-h-[240px] text-left cursor-pointer">
                          
                          <div className="relative z-10 flex items-start justify-between">
                            <div className="similarity-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-300 animate-pulse" />
                              <span className="text-[10px] text-white tracking-wider font-extrabold uppercase">
                                {formatSimilarityScore(rec.similarity_score)} Mirip
                              </span>
                            </div>

                            {rec.imdb_score > 0 && (
                              <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-white/5 text-[10px] text-slate-300 font-bold">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                {formatIMDBScore(rec.imdb_score)}
                              </div>
                            )}
                          </div>

                          <div className="relative z-10 my-4">
                            <h3 className="text-lg font-black text-white group-hover:text-brand-300 transition-colors tracking-tight leading-tight mb-2 line-clamp-2">
                              {rec.title}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-3 line-clamp-1">
                              {parseGenres(rec.genre).join(' • ')}
                            </span>
                            
                            {/* Score progress bar */}
                            <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-brand-400 to-brand-200 h-1.5 rounded-full score-bar-fill" 
                                style={{ width: `${Math.min(rec.similarity_score * 100, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="relative z-10 pt-3 border-t border-white/5 flex items-center justify-between mt-auto">
                            <div className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                              {rec.year && <span>{rec.year}</span>}
                              {rec.year && rec.runtime && <span className="w-1 h-1 rounded-full bg-slate-600" />}
                              {rec.runtime && <span>{formatRuntime(rec.runtime)}</span>}
                            </div>
                            
                            <span className="text-[10px] font-bold text-brand-300 group-hover:text-white flex items-center gap-1 transition-colors">
                              Lihat Detail <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>

                          <div className="absolute inset-0 border border-white/0 group-hover:border-brand-300/30 rounded-3xl transition-all duration-300 pointer-events-none" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
