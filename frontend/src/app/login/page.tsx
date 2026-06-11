'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { login } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loginSuccess } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      loginSuccess(res.data);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center cinematic-bg">
        <div className="loading-spinner w-12 h-12" />
      </div>
    );
  }

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
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
      
          <h1 className="text-3xl font-black text-white tracking-tight">
            Smart<span className="text-brand-300">Movie</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Masuk ke akun kamu</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
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
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-brand-300/50 focus:shadow-[0_0_0_3px_rgba(0,169,255,0.1)] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                  Masuk...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link ke register */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Belum punya akun?{' '}
            <Link href="/register" className="text-brand-300 font-bold hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6">
          &copy; 2026 SmartMovie &bull; Content-Based Filtering
        </p>
      </motion.div>
    </div>
  );
}
