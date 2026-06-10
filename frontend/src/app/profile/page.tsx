'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  ArrowLeft,
  User as UserIcon,
  Mail,
  Lock,
  Pencil,
  Check,
  X,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchProfile, updateProfile, deleteAccount } from '../lib/api';
import { UserProfile } from '@/types/movieType';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id)
        .then((data) => {
          setProfile(data);
          setEditValue(data.display_name || data.username);
        })
        .catch(() => {
          setProfile({
            id: user.id,
            username: user.username,
            email: user.email,
            display_name: user.username,
            created_at: '',
          });
          setEditValue(user.username);
        })
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  const handleSaveUsername = async () => {
    if (!user?.id || !editValue.trim()) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const updated = await updateProfile(user.id, { display_name: editValue.trim() });
      setProfile(updated);
      updateUser({ username: editValue.trim() });
      setIsEditing(false);
      setSuccessMsg('Username berhasil diperbarui');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui username');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || deleteConfirm !== 'HAPUS') return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteAccount(user.id);
      logout();
      router.replace('/login');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menghapus akun');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || !isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center cinematic-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner w-12 h-12" />
          <p className="text-brand-200 font-medium animate-pulse">Memuat profil...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || user?.username || 'User';
  const email = profile?.email || user?.email || '';

  return (
    <div className="relative min-h-screen z-10 selection:bg-brand-300/30 selection:text-brand-50 pb-20">
      {/* Background */}
      <div className="cinematic-bg">
        <div className="glow-orb glow-orb-primary" />
        <div className="glow-orb glow-orb-secondary" />
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

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="w-24 h-24 rounded-full bg-brand-300/15 border-2 border-brand-300/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-300/10">
            <span className="text-3xl font-black text-brand-300">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {displayName}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{email}</p>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <p className="text-sm font-medium text-green-300">{successMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm font-medium text-red-300">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Account Info Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/5 mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-brand-300" />
            Informasi Akun
          </h2>

          <div className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Username
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-300" />
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.05] border border-brand-300/50 text-white text-sm focus:border-brand-300 focus:shadow-[0_0_0_3px_rgba(0,169,255,0.15)] outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSaveUsername}
                    disabled={isSaving || !editValue.trim()}
                    className="w-10 h-10 rounded-xl bg-brand-300 flex items-center justify-center text-white hover:bg-brand-200 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="loading-spinner border-white/30 border-t-white w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditValue(profile?.display_name || user?.username || '');
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="relative flex-1">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <div className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm">
                      {displayName}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-3 w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-300 hover:border-brand-300/30 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <div className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 text-sm">
                  {email}
                  <span className="ml-2 text-[10px] text-slate-600 uppercase font-semibold">
                    tidak dapat diubah
                  </span>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <div className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 text-sm">
                  ••••••••
                  <span className="ml-2 text-[10px] text-slate-600 uppercase font-semibold">
                    tidak dapat diubah
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Danger Zone */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel rounded-2xl p-6 sm:p-8 border border-red-500/20"
        >
          <h2 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zona Berbahaya
          </h2>
          <p className="text-sm text-slate-400 mb-5">
            Tindakan ini tidak dapat dibatalkan. Semua data, komentar, dan like kamu akan dihapus secara permanen.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold flex items-center gap-2 hover:bg-red-500/20 hover:border-red-500/50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Akun Permanen
          </button>
        </motion.section>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md glass-panel rounded-2xl p-6 sm:p-8 border border-red-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">
                Hapus Akun?
              </h3>
              <p className="text-sm text-slate-400 text-center mb-6">
                Ketik <strong className="text-red-400">HAPUS</strong> untuk mengonfirmasi.
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder='Ketik "HAPUS"'
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm text-center placeholder:text-slate-600 focus:border-red-500/50 outline-none transition-all mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirm('');
                  }}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/[0.1] transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'HAPUS' || isDeleting}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="loading-spinner border-white/30 border-t-white w-4 h-4" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
