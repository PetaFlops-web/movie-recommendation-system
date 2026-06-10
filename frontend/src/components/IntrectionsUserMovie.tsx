import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Share2,
  Link2,
  CheckCircle,
} from 'lucide-react';
import { getLikes, toggleLike, shareMovie } from '@/app/lib/api';
import { useAuth } from '@/app/contexts/AuthContext';

interface InteractionsUserMovieProps {
    movieId: number;
    movieTitle: string;
}

export default function InteractionsUserMovie({ movieId, movieTitle }: InteractionsUserMovieProps) {
    const { isAuthenticated } = useAuth();

    const [totalLikes, setTotalLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    const [showShareMenu, setShowShareMenu] = useState(false);
    const [shareSuccess, setShareSuccess] = useState<string | null>(null);
    const shareRef = useRef<HTMLDivElement>(null);

    const handleToggleLike = async () => {
      if (!isAuthenticated) return;
      setIsLiking(true);
      try {
        const result = await toggleLike(movieId);
        setIsLiked(result.liked);
        setTotalLikes((prev) => (result.liked ? prev + 1 : prev - 1));
      } catch {
        // silent fail
      } finally {
        setIsLiking(false);
      }
    };

    const handleShare = async (platform: string) => {
      setShowShareMenu(false);
      const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

      if (platform === 'copy') {
        try {
          await navigator.clipboard.writeText(pageUrl);
          setShareSuccess('Link disalin!');
          setTimeout(() => setShareSuccess(null), 2000);
        } catch {
          setShareSuccess('Gagal menyalin link');
          setTimeout(() => setShareSuccess(null), 2000);
        }
      } else if (platform === 'whatsapp') {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`Cek film "${movieTitle}" di SmartMovie! ${pageUrl}`)}`,
          '_blank'
        );
      } else if (platform === 'twitter') {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Cek film "${movieTitle}" di SmartMovie!`)}&url=${encodeURIComponent(pageUrl)}`,
          '_blank'
        );
      }

      if (isAuthenticated) {
        shareMovie(movieId, platform).catch(() => {});
      }
    };

    useEffect(() => {
      getLikes(movieId)
        .then((data) => setTotalLikes(data.total_likes))
        .catch(() => {});
    }, [movieId]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
          setShowShareMenu(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl flex items-center gap-4 sm:gap-6 mb-8"
      >
        {/* Like Button */}
        <button
          onClick={handleToggleLike}
          disabled={isLiking || !isAuthenticated}
          className="flex items-center gap-2 group transition-all disabled:opacity-50"
          title={!isAuthenticated ? 'Masuk untuk like' : ''}
        >
          <div
            className={`w-10 h-10 md:w-12 md:h-12 lg:w-13 lg:h-13 rounded-xl flex items-center justify-center transition-all ${
              isLiked
                ? 'bg-red-500/20 border border-red-500/30'
                : 'bg-white/[0.03] border border-white/10 group-hover:border-red-500/30 group-hover:bg-red-500/10'
            }`}
          >
            <Heart
              className={`w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 transition-colors ${
                isLiked ? 'text-red-400 fill-red-400' : 'text-slate-400 group-hover:text-red-400'
              }`}
            />
          </div>
          <span
            className={`text-xl md:text-2xl lg:text-xl font-bold transition-colors ${
              isLiked ? 'text-red-400' : 'text-slate-400 group-hover:text-white'
            }`}
          >
            {totalLikes}
          </span>
        </button>

        {/* Share Button */}
        <div className="relative ml-auto" ref={shareRef}>
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:border-brand-300/30 group-hover:bg-brand-300/10 transition-all">
              <Share2 className="w-5 h-5 text-slate-400 group-hover:text-brand-300 transition-colors" />
            </div>
            <span className="text-xl md:text-2xl lg:text-xl font-bold text-slate-400 group-hover:text-white transition-colors hidden sm:inline">
              Bagikan
            </span>
          </button>

          <AnimatePresence>
            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 glass-panel rounded-xl border border-brand-300/20 shadow-2xl overflow-hidden z-50"
              >
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                >
                  <Link2 className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-brand-300" />
                  <span className="text-sm font-medium text-white">Salin Link</span>
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="text-sm font-medium text-white">WhatsApp</span>
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-sm font-medium text-white">X (Twitter)</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Share success toast */}
          <AnimatePresence>
            {shareSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-xs font-medium text-green-300 whitespace-nowrap z-50"
              >
                <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                {shareSuccess}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    );
}
