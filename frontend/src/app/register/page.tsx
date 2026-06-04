"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Film,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { register } from "../lib/auth";

const GENRE_LIST = [
  "Drama",
  "Comedy",
  "Documentary",
  "Thriller",
  "Romance",
  "Action",
  "Horror",
  "Crime",
  "Animation",
  "Sci-Fi",
  "Mystery",
  "Family",
  "Adventure",
  "Fantasy",
];

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedGenres.length === 0) {
      setError("Pilih minimal 1 genre favorit");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(username, email, password, selectedGenres);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen z-10 selection:bg-brand-300/30 selection:text-brand-50 flex items-center justify-center px-4 py-8">
      <div className="cinematic-bg">
        <div className="glow-orb glow-orb-primary" />
        <div className="glow-orb glow-orb-secondary" />
        <div className="glow-orb glow-orb-center" />
        <div className="stars-overlay" />
        <div className="neon-grid" />
      </div>

      <div className="fixed inset-0 bg-black/60 z-0" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-300 to-brand-200 flex items-center justify-center shadow-lg shadow-brand-300/30">
              <Film className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Smart<span className="text-brand-300">Movie</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Buat akun baru</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl">
          {/* Success State */}
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Registrasi Berhasil!
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Akun kamu sudah dibuat. Mengalihkan ke halaman login...
              </p>
              <div className="flex justify-center">
                <div className="loading-spinner border-brand-300/30 border-t-brand-300 w-6 h-6" />
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-brand-300/50 focus:shadow-[0_0_0_3px_rgba(0,169,255,0.1)] outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  3-50 karakter (huruf, angka, underscore saja)
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh@email.com"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-brand-300/50 focus:shadow-[0_0_0_3px_rgba(0,169,255,0.1)] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-brand-300/50 focus:shadow-[0_0_0_3px_rgba(0,169,255,0.1)] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Minimal 6 karakter dengan minimal 1 angka (0-9)
                </p>
              </div>

              {/* Genre Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Genre Favorit
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_LIST.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedGenres.includes(genre)
                          ? "bg-brand-300 text-white border-brand-300 shadow-lg shadow-brand-300/20"
                          : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                {selectedGenres.length > 0 && (
                  <p className="text-[10px] text-brand-300 mt-2 font-medium">
                    {selectedGenres.length} genre dipilih
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{error}</p>
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-300 to-brand-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-300/20 hover:shadow-brand-300/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner border-white/30 border-t-white w-4 h-4" />
                    Mendaftar...
                  </>
                ) : (
                  <>
                    Daftar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Link ke login */}
          {!success && (
            <p className="text-center text-xs text-slate-500 mt-6">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="text-brand-300 font-bold hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6">
          &copy; 2026 SmartMovie &bull; Content-Based Filtering
        </p>
      </motion.div>
    </div>
  );
}
