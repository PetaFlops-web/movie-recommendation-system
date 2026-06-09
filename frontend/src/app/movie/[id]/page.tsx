"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Film,
  Globe,
  Sparkles,
  Star,
  Users,
  Zap,
  AlertCircle,
} from "lucide-react";
import { MovieFromAPI, MovieWithSimilarity } from "@/types/movieType";
import { decodeMovieTitle, formatIMDBScore, formatRuntime, parseGenres, encodeMovieTitle } from "@/helpers/jsosParser";
import { fetchMovieDetail } from "@/app/lib/api";

export default function MovieDetailPage() {
  const params = useParams();
  const decodedTitle = decodeMovieTitle(params.id as string);

  const [movie, setMovie] = useState<MovieFromAPI | null>(null);
  const [recommendations, setRecommendations] = useState<MovieWithSimilarity[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const backdropGradient =
    "radial-gradient(circle at center, rgba(0, 169, 255, 0.25) 0%, rgba(10, 22, 40, 0.98) 70%)";
  const glowColor = "#00A9FF";

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

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-300 to-brand-200 flex items-center justify-center shadow-lg shadow-brand-300/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Smart<span className="text-brand-300 font-extrabold">Movie</span>
            </span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.02] border border-white/5 hover:border-white/10 flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali
          </Link>
        </div>
      </header>

      <main className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* DETAIL */}
        <section className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-10 border border-brand-300/10 shadow-2xl relative overflow-hidden mb-12">
          <div className="absolute inset-0 bg-slate-950/60 z-0 backdrop-blur-[2px]" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Poster */}
            <div className="lg:col-span-4 flex justify-center">
              <div
                className="w-full max-w-[420px] aspect-[2/3] rounded-2xl relative overflow-hidden shadow-2xl border border-white/15 flex flex-col justify-between p-6 transition-all duration-500 hover:scale-[1.02]"
                style={{
                  background: backdropGradient,
                  boxShadow: `0 20px 40px -10px ${glowColor}25, 0 0 30px ${glowColor}10`,
                }}
              >
                <div className="absolute inset-0 bg-slate-950/50 z-0" />
                
                <div className="relative z-10 flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-sm font-bold text-white border border-white/5">
                    SmartMovie
                  </span>
                  {movie.imdb_score > 0 && (
                    <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded border border-white/10 text-amber-400 text-sm font-bold">
                      <Star className="w-5 h-5 fill-amber-400" />
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
                      className="genre-pill px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm"
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
                    <Users className="w-4 h-4 text-brand-300" />
                    <h3 className="text-sm font-bold text-brand-200 uppercase tracking-wider">
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
                  <h3 className="text-sm font-bold text-brand-200 uppercase tracking-wider mb-2">
                    Sinopsis
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-light">
                    {movie.overview}
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="mt-auto pt-4">
                {recommendations.length > 0 ? (
                  <div className="flex items-center gap-2 px-6 py-3 max-w-md rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    {recommendations.length} rekomendasi film serupa untukmu
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    Rekomendasi tidak tersedia untuk film ini
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* REKOMENDASI */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <Zap className="w-6 h-6 text-brand-300" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Rekomendasi Serupa
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Koleksi film yang mirip dengan{" "}
                <strong className="text-brand-200">{movie.title}</strong>
              </p>
            </div>
          </div>

          {recommendations.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center border border-white/5">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">
                Tidak Ada Rekomendasi
              </h3>
              <p className="text-slate-400 text-sm">
                Belum ada rekomendasi serupa untuk film ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recommendations.map((rec, idx) => {
                const recRuntime = rec.runtime
                  ? formatRuntime(Number(rec.runtime) || null)
                  : "";
                return (
                  <motion.div
                    key={`${rec.title}-${idx}`}
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                  >
                    <Link href={`/movie/${encodeMovieTitle(rec.title)}`}>
                      <div className="movie-card glass-panel rounded-3xl p-5 border border-white/5 relative overflow-hidden group shadow-lg flex flex-col justify-between min-h-[240px] text-left cursor-pointer">
                        <div className="relative z-10 flex items-start justify-end">
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
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-2 line-clamp-1">
                            {parseGenres(rec.genre).join(" • ")}
                          </span>
                          <p className="text-[11px] text-slate-400/80 leading-relaxed line-clamp-3 mb-3 font-light">
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
                          <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-brand-400 to-brand-200 h-1.5 rounded-full score-bar-fill"
                              style={{
                                width: `${Math.min(rec.similarity_score * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="relative z-10 pt-3 border-t border-white/5 flex items-center justify-between mt-auto">
                          <div className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                            {rec.year && <span>{rec.year}</span>}
                            {rec.year && recRuntime && (
                              <span className="w-1 h-1 rounded-full bg-slate-600" />
                            )}
                            {recRuntime && <span>{recRuntime}</span>}
                          </div>
                          <span className="text-[10px] font-bold text-brand-300 group-hover:text-white flex items-center gap-1 transition-colors">
                            Lihat Detail
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>

                        <div className="absolute inset-0 border border-white/0 group-hover:border-brand-300/30 rounded-3xl transition-all duration-300 pointer-events-none" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
