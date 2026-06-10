'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Send,
  AlertCircle,
  Star,
} from 'lucide-react';
import { Comment } from '@/types/movieType';
import { getComments, addComment } from '@/app/lib/api';
import { useAuth } from '@/app/contexts/AuthContext';

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}h lalu`;
  const months = Math.floor(days / 30);
  return `${months}bln lalu`;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
        Rating
      </span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              star <= (hover || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-600'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-[10px] font-bold text-amber-400/70 ml-1">
          {value}/5
        </span>
      )}
    </div>
  );
}

interface CommentSectionProps {
  movieId: number;
}

export default function CommentSection({ movieId }: CommentSectionProps) {
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [ratingInput, setRatingInput] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) return;
    getComments(movieId)
      .then((data) => setComments(data.comments))
      .catch(() => {})
      .finally(() => setIsLoadingComments(false));
  }, [movieId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !user) return;
    setIsSubmittingComment(true);
    setError(null);
    try {
      const newComment = await addComment(
        movieId,
        commentInput.trim(),
        ratingInput > 0 ? ratingInput : undefined
      );
      setComments((prev) => [newComment, ...prev]);
      setCommentInput('');
      setRatingInput(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan komentar');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="p-5 sm:p-6 mb-12"
    >
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle className="w-5 h-5 text-brand-300" />
        <h3 className="text-lg font-bold text-white">Komentar</h3>
        <span className="text-xs font-semibold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
          {comments.length}
        </span>
      </div>

      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-300/15 border border-brand-300/25 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-brand-300">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Tulis komentar tentang film ini..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-brand-300/50 focus:shadow-[0_0_0_3px_rgba(0,169,255,0.1)] outline-none transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <StarRating value={ratingInput} onChange={setRatingInput} />
                <button
                  type="submit"
                  disabled={!commentInput.trim() || isSubmittingComment}
                  className="px-4 py-2 rounded-xl bg-brand-300 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? (
                    <>
                      <div className="loading-spinner border-white/30 border-t-white w-3.5 h-3.5" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Kirim
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <p className="text-xs text-slate-500">Masuk untuk menulis komentar</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {isLoadingComments ? (
        <div className="flex justify-center py-8">
          <div className="loading-spinner w-6 h-6" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10">
          <MessageCircle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Belum ada komentar.</p>
          <p className="text-xs text-slate-600 mt-1">Jadilah yang pertama!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {comments.map((comment, idx) => (
            <motion.div
              key={comment.id || idx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-slate-400">
                  {(comment.username || comment.display_name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-white">
                    {comment.username || comment.display_name || 'Anonim'}
                  </span>
                  {comment.rating && comment.rating > 0 && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400">{comment.rating}</span>
                    </span>
                  )}
                  <span className="text-[10px] text-slate-600">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed break-words">
                  {comment.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
