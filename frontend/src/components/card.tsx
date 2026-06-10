import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Clock, Globe } from 'lucide-react';
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
      className="h-full"
    >
      <Link href={`/movie/${encodeMovieTitle(movie.title)}`}>
        {/* PERUBAHAN UTAMA: Tinggi dinaikkan ke h-[460px] di HP dan h-[510px] di Desktop */}
        <div className="movie-card glass-panel relative w-full h-[460px] md:h-[630px] rounded-2xl cursor-pointer group overflow-hidden flex flex-col justify-end">
          
          {/* 1. AREA POSTER (LEBIH TINGGI DAN MEGAH) */}
          {movie.poster_url && (
            <div className="absolute inset-0 w-full h-full z-0">
              <Image
                src={movie.poster_url}
                alt={movie.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                priority={index < 4}
              />
              
              {/* Kombinasi gradasi disesuaikan: Hanya menggelapkan area teks di bawah (45% kebawah), area atas poster 100% jernih */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/60 to-transparent via-45% z-10 pointer-events-none" />
            </div>
          )}

          {/* BADGE RATING NGAPUNG */}
          {score > 0 && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#0A1628]/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg font-black text-[11px] border border-white/10 shadow-[0_0_15px_rgba(0,169,255,0.15)]">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{formatIMDBScore(score)}</span>
            </div>
          )}

          {/* 2. AREA DATA & TEKS (Mengapung elegan di atas gradasi warna web kamu) */}
          <div className="relative z-20 p-5 w-full flex flex-col gap-2">
            
            {/* Genre Pills */}
            <div className="flex flex-wrap gap-1.5">
              {genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="genre-pill px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Judul Film - Ukuran font sedikit dinaikkan ke text-lg agar seimbang dengan tinggi poster */}
            <h3 className="text-base md:text-lg font-black text-white group-hover:text-[#00A9FF] transition-colors duration-300 leading-tight line-clamp-1 text-glow">
              {movie.title}
            </h3>

            {/* Metadata (Tahun, Durasi, Bahasa) */}
            <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-[#e2e8f0] font-medium">
              {movie.year && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5 text-[#94a3b8]" />
                  {movie.year}
                </span>
              )}
              {runtimeDisplay && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#94a3b8]/40" />
                  <span>{runtimeDisplay}</span>
                </>
              )}
              {movie.language && movie.language !== 'nan' && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#94a3b8]/40" />
                  <span className="flex items-center gap-0.5">
                    <Globe className="w-2.5 h-2.5 text-[#94a3b8]" />
                    <span className="uppercase">{movie.language}</span>
                  </span>
                </>
              )}
            </div>

            {/* Sinopsis Singkat */}
            <p className="text-[11px] text-[#94a3b8] leading-relaxed line-clamp-2 font-light mt-0.5">
              {movie.overview && movie.overview !== 'nan' && movie.overview.trim() !== ''
                ? movie.overview
                : <span className="italic opacity-30">Sinopsis belum tersedia.</span>
              }
            </p>

            {/* Footer Inner Card */}
            <div className="pt-3 mt-1 border-t border-[#00A9FF]/10 flex items-center justify-between text-[11px]">
              <span className="text-[9px] text-[#94a3b8] font-semibold uppercase tracking-wider line-clamp-1 max-w-[65%]">
                {genres.join(' • ')}
              </span>
              <span className="font-bold text-[#00A9FF] group-hover:text-white flex items-center gap-0.5 transition-colors shrink-0">
                Detail <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

          </div>

        </div>
      </Link>
    </motion.div>
  );
}

export default MovieCard;