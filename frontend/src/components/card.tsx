import Link from 'next/link';
import { motion,  } from 'framer-motion';
import {
  Star,
  ArrowRight,
  Clock,
  Globe
} from 'lucide-react';
import { MovieFromAPI } from '@/types/movieType';
import {
  formatIMDBScore,
  formatRuntime,
  parseGenres,
  encodeMovieTitle,
} from '@/helpers/jsosParser';

function MovieCard({ movie, index }: { movie: MovieFromAPI; index: number }) {
  const genres = parseGenres(movie.genre);
  const score = movie.imdb_score;
  const runtimeDisplay = movie.runtime ? formatRuntime(Number(movie.runtime) || null) : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/movie/${encodeMovieTitle(movie.title)}`}>
        <div className="movie-card glass-panel rounded-2xl p-5 border border-white/5 cursor-pointer group h-full flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex flex-wrap gap-1.5">
                {genres.slice(0, 2).map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-brand-200 bg-brand-300/10 border border-brand-300/20"
                  >
                    {g}
                  </span>
                ))}
              </div>
              {score > 0 && (
                <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 shrink-0">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-bold text-white">{formatIMDBScore(score)}</span>
                </div>
              )}
            </div>

            <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors leading-tight mb-2 line-clamp-2">
              {movie.title}
            </h3>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-3">
              {movie.year && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {movie.year}
                </span>
              )}
              {runtimeDisplay && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>{runtimeDisplay}</span>
                </>
              )}
              {movie.language && movie.language !== 'nan' && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {movie.language}
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400/80 leading-relaxed line-clamp-2 font-light">
              {movie.overview && movie.overview !== 'nan' && movie.overview.trim() !== ''
                ? movie.overview
                : <span className="italic text-slate-500/60">Sinopsis belum tersedia untuk film ini.</span>
              }
            </p>
          </div>

          <div className="pt-3 mt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {genres.join(' • ')}
            </span>
            <span className="text-[11px] font-bold text-brand-300 group-hover:text-white flex items-center gap-1 transition-colors">
              Detail <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default MovieCard;