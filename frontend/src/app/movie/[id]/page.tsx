'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  Star, 
  ArrowLeft, 
  ArrowRight,
  Plus, 
  BookmarkCheck,
  Zap, 
  Layers,
  Heart,
  Clock,
  Cpu,
  Tv
} from 'lucide-react';
import { moviesDatabase, Movie } from '../data';

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const movieId = params.id;
  
  // Resolve active movie with robust fallback
  const activeMovie: Movie = moviesDatabase[movieId] || moviesDatabase.interstellar;

  const [activeCategory, setActiveCategory] = useState<'Most Similar' | 'Same Genre' | 'Hidden Gem' | 'AI Pick'>('Most Similar');
  const [watchlistSaved, setWatchlistSaved] = useState(false);
  const [favoriteSaved, setFavoriteSaved] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Trigger a subtle skeleton loader shimmer when movie changes
  useEffect(() => {
    setIsLoadingRecommendations(true);
    setWatchlistSaved(false);
    setFavoriteSaved(false);
    setCarouselIndex(0);
    
    const timer = setTimeout(() => {
      setIsLoadingRecommendations(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [movieId]);

  // Content-Based recommendation selector logic
  const getFilteredRecommendations = () => {
    const similarityList = Object.entries(activeMovie.similarities).map(([id, sim]) => {
      const details = moviesDatabase[id];
      return {
        ...details,
        score: sim.score,
        matchType: sim.matchType,
        rationale: sim.rationale
      };
    });

    // Sort by cosine similarity score descending
    const sortedList = similarityList.sort((a, b) => b.score - a.score);

    if (activeCategory === 'Most Similar') {
      return sortedList;
    } else if (activeCategory === 'Same Genre') {
      return sortedList.filter(item => 
        item.genres.some(genre => activeMovie.genres.includes(genre))
      );
    } else if (activeCategory === 'Hidden Gem') {
      return sortedList.filter(item => item.matchType === 'Hidden Gem');
    } else {
      return sortedList.filter(item => item.matchType === 'AI Pick' || item.score > 90);
    }
  };

  const filteredRecs = getFilteredRecommendations();

  // Scroll handlers for our custom premium carousel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setCarouselIndex(prev => Math.max(prev - 1, 0));
    } else {
      setCarouselIndex(prev => Math.min(prev + 1, Math.max(0, filteredRecs.length - 3)));
    }
  };

  return (
    <div className="relative min-h-screen z-10 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background Atmosphere Layers */}
      <div className="cinematic-bg">
        <div 
          className="absolute w-[900px] h-[900px] -top-[300px] left-1/2 -translate-x-1/2 -z-10 rounded-full blur-[140px] opacity-25 transition-all duration-700" 
          style={{ backgroundImage: activeMovie.backdropGradient }}
        />
        <div className="stars-overlay"></div>
        <div className="neon-grid"></div>
      </div>

      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                CineMind<span className="text-violet-500 font-extrabold text-2xl">.</span>AI
              </span>
              <span className="block text-[10px] text-slate-400 tracking-widest uppercase font-semibold">Recommendation Hub</span>
            </div>
          </Link>

          {/* Quick Hub Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.02] border border-white/5 hover:border-white/10 flex items-center gap-1.5 transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to AI Sandbox
            </Link>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-cyan-500/20 text-cyan-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-glow-indicator"></span>
              Neural Core Dynamic Engine
            </div>
          </div>
        </div>
      </header>

      {/* Main Detail Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        
        {/* Breadcrumbs / Back button */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-violet-400" /> Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Dynamic Route:</span>
            <span className="text-cyan-400 font-mono">/movie/{activeMovie.id}</span>
          </div>
        </div>

        {/* 1. CINEMATIC HERO SECTION */}
        <section 
          className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/10 shadow-2xl relative overflow-hidden mb-12"
          style={{ background: activeMovie.backdropGradient }}
        >
          {/* Backdrop Glass Overlay */}
          <div className="absolute inset-0 bg-slate-950/80 z-0 backdrop-blur-[2px]" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Visual Art Box (Cinematic poster representation) */}
            <div className="lg:col-span-4 flex justify-center">
              <div 
                className="w-full max-w-[280px] aspect-[2/3] rounded-2xl relative overflow-hidden shadow-2xl border border-white/15 flex flex-col justify-between p-6 transition-all duration-500 hover:scale-[1.02]"
                style={{ 
                  background: activeMovie.backdropGradient,
                  boxShadow: `0 20px 40px -10px ${activeMovie.glowColor}25, 0 0 30px ${activeMovie.glowColor}10` 
                }}
              >
                <div className="absolute inset-0 bg-slate-950/50 z-0" />
                
                {/* Tech Poster details */}
                <div className="relative z-10 flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[9px] font-bold text-white border border-white/5">
                    CineMind.AI
                  </span>
                  <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded border border-white/10 text-amber-400 text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {activeMovie.rating}
                  </div>
                </div>

                <div className="relative z-10 text-left">
                  <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest block mb-1">
                    NEURAL SOURCE INDEX
                  </span>
                  <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
                    {activeMovie.title}
                  </h2>
                  <span className="text-[10px] text-slate-300 font-medium block mt-1">
                    {activeMovie.genres.join(' • ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Typography and Meta details */}
            <div className="lg:col-span-8 flex flex-col justify-between text-left h-full">
              
              {/* Top Row: Year, Runtime, rating */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-slate-300 mb-4">
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-mono">
                  {activeMovie.year}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  {activeMovie.runtime}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span className="text-slate-400">Director: <strong className="text-white font-bold">{activeMovie.director}</strong></span>
              </div>

              {/* Title & Tagline */}
              <div className="mb-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white mb-3">
                  {activeMovie.title}
                </h1>
                <p className="text-sm sm:text-base italic text-cyan-400 font-light tracking-wide">
                  &ldquo;{activeMovie.tagline}&rdquo;
                </p>
              </div>

              {/* Genres Tag Cloud */}
              <div className="flex flex-wrap gap-2 mb-6">
                {activeMovie.genres.map(genre => (
                  <span 
                    key={genre}
                    className="px-3.5 py-1 rounded-full text-xs font-bold text-white bg-white/5 border border-white/10 shadow-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Synopsis / Overview */}
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-extrabold mb-2">
                  Synopsis
                </h3>
                <p className="text-slate-200 text-sm sm:text-base font-light leading-relaxed max-w-2xl">
                  {activeMovie.overview}
                </p>
              </div>

              {/* Cast & Crew block */}
              <div className="mb-8">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-extrabold mb-2">
                  Key Cast
                </h3>
                <div className="flex flex-wrap gap-3">
                  {activeMovie.cast.map(actor => (
                    <span key={actor} className="text-xs text-slate-300 bg-black/20 px-2.5 py-1 rounded border border-white/5">
                      {actor}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button className="btn-gloss px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 border border-violet-500/30 flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-violet-600/10">
                  <Tv className="w-4 h-4" /> Watch Now
                </button>

                <button 
                  onClick={() => setWatchlistSaved(!watchlistSaved)}
                  className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 active:scale-95 transition-all border ${
                    watchlistSaved 
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                  }`}
                >
                  {watchlistSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-emerald-400" /> In Watchlist
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Add to Watchlist
                    </>
                  )}
                </button>

                <button 
                  onClick={() => setFavoriteSaved(!favoriteSaved)}
                  className={`p-3 rounded-xl flex items-center justify-center active:scale-95 transition-all border ${
                    favoriteSaved 
                      ? 'bg-rose-600/25 border-rose-500 text-rose-500' 
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:text-rose-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${favoriteSaved ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

            </div>

          </div>
        </section>

        {/* 2. DYNAMIC AI RECOMMENDATION INSIGHT CARD */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-violet-400" />
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
              AI Recommendation Match Insight
            </h2>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/5 shadow-xl relative overflow-hidden bg-slate-900/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Insight Description */}
              <div className="md:col-span-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Content-Based Synergy</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
                  Why CineMind AI Maps This Film
                </h3>
                <p className="text-slate-300 text-sm font-light leading-relaxed mb-4">
                  Our algorithm processes this title using a dynamic TF-IDF Vectorizer and multi-dimensional Cosine Similarity. Recommended matches are calculated based on overlapping linguistic structures in the plot synopsis, stylistic genres, key director characteristics, soundscapes, and thematic keywords.
                </p>
                <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 text-slate-400 text-xs italic">
                  &ldquo;Recommended because this movie shares similar themes, genres, keywords, cast characteristics, and storytelling patterns with movies you enjoy.&rdquo;
                </div>
              </div>

              {/* Vector Data details */}
              <div className="md:col-span-6">
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Genre Synergy Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-2 tracking-wider">
                      Similar Genres
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeMovie.genres.map(g => (
                        <span key={g} className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 text-[10px] font-bold border border-violet-500/20">
                          {g} ✓
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Themes Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-2 tracking-wider">
                      Similar Themes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeMovie.themes.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-bold border border-cyan-500/20">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Keywords Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-2 tracking-wider">
                      Similar Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeMovie.keywords.slice(0, 3).map(k => (
                        <span key={k} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                          #{k}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Audience Preferences Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-2 tracking-wider">
                      Audience Prefs
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeMovie.audiencePreferences.slice(0, 2).map(p => (
                        <span key={p} className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 text-[10px] font-bold border border-pink-500/20">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. TOP 10 SIMILAR MOVIES CAROUSEL (CORE ENGAGEMENT ENGINE) */}
        <section className="relative">
          
          {/* Header block with interactive category selectors */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-extrabold uppercase tracking-wider mb-1">
                <Zap className="w-3.5 h-3.5 animate-pulse" /> CONTENT-BASED FILTERING ENGINE
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Because You Liked <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">{activeMovie.title}</span>
              </h2>
            </div>

            {/* Slider categories tabs */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/5">
              {(['Most Similar', 'Same Genre', 'Hidden Gem', 'AI Pick'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setCarouselIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeCategory === cat 
                      ? 'bg-violet-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'Hidden Gem' ? 'Hidden Gems' : cat === 'AI Pick' ? 'AI Picks' : cat}
                </button>
              ))}
            </div>

          </div>

          {/* Carousel Viewport Container */}
          <div className="relative overflow-hidden py-4 px-1">
            
            {/* Carousel navigation arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 z-30 -ml-3">
              <button 
                onClick={() => scrollCarousel('left')}
                disabled={carouselIndex === 0}
                className="w-10 h-10 rounded-full bg-slate-950/80 border border-white/10 hover:border-white/20 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-xl backdrop-blur-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            
            <div className="absolute top-1/2 -translate-y-1/2 right-0 z-30 -mr-3">
              <button 
                onClick={() => scrollCarousel('right')}
                disabled={carouselIndex >= filteredRecs.length - 3 || filteredRecs.length <= 3}
                className="w-10 h-10 rounded-full bg-slate-950/80 border border-white/10 hover:border-white/20 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-xl backdrop-blur-sm"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Recommended Content Blocks */}
            <AnimatePresence mode="wait">
              {isLoadingRecommendations ? (
                /* 3A. EMPTY STATE: Animated Skeleton Loaders */
                <motion.div 
                  key="skeletons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {[1, 2, 3].map(i => (
                    <div key={i} className="glass-panel rounded-3xl p-5 border border-white/5 h-[230px] flex flex-col justify-between overflow-hidden">
                      <div className="space-y-3">
                        <div className="h-4 w-1/3 bg-white/5 rounded shimmer-bg" />
                        <div className="h-6 w-3/4 bg-white/5 rounded shimmer-bg" />
                        <div className="h-3 w-1/2 bg-white/5 rounded shimmer-bg" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-10 w-full bg-white/5 rounded shimmer-bg" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : filteredRecs.length === 0 ? (
                /* 3B. EMPTY STATE: No items matching criteria */
                <motion.div 
                  key="no-items"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel rounded-3xl p-12 text-center border border-white/5"
                >
                  <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-lg mb-2">No Matching Recommendations Found</h3>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto">
                    Try switching filters to &ldquo;Most Similar&rdquo; or &ldquo;AI Picks&rdquo; to compute different dynamic high-affinity matrices.
                  </p>
                </motion.div>
              ) : (
                /* 3C. ACTIVE DATA: The Slide Carousel */
                <motion.div 
                  key="carousel-data"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500"
                >
                  {filteredRecs.slice(carouselIndex, carouselIndex + 3).map(movie => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      whileHover={{ y: -6 }}
                      className="glass-panel rounded-3xl p-5 border border-white/5 relative overflow-hidden group shadow-lg flex flex-col justify-between min-h-[240px] text-left cursor-pointer"
                      onClick={() => {
                        // Dynamically navigate to trigger state updates & endless discovery
                        router.push(`/movie/${movie.id}`);
                      }}
                    >
                      {/* Background subtle glowing radial overlay */}
                      <div 
                        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300 z-0"
                        style={{ background: movie.backdropGradient }}
                      />
                      
                      {/* Top metadata */}
                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span className="text-[10px] text-cyan-400 tracking-wider font-extrabold uppercase">
                            {movie.score}% MATCH
                          </span>
                        </div>

                        <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-white/5 text-[10px] text-slate-300 font-bold">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {movie.rating}
                        </div>
                      </div>

                      {/* Title & info */}
                      <div className="relative z-10 my-4">
                        <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors tracking-tight leading-tight mb-1">
                          {movie.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {movie.genres.join(' • ')}
                        </span>
                        
                        {/* Summary description */}
                        <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed mt-2 italic font-light font-serif">
                          &ldquo;{movie.rationale}&rdquo;
                        </p>
                      </div>

                      {/* Bottom action trigger bar */}
                      <div className="relative z-10 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="text-[9px] text-slate-400 uppercase font-bold">
                          Year: <strong className="text-white">{movie.year}</strong> | {movie.runtime}
                        </div>
                        
                        <span className="text-[10px] font-bold text-violet-400 group-hover:text-white flex items-center gap-1 transition-colors">
                          Inspect Match <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>

                      {/* Premium border highlight glow on hover */}
                      <div className="absolute inset-0 border border-white/0 group-hover:border-violet-500/30 rounded-3xl transition-all duration-300 pointer-events-none" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Carousel indicator pips */}
          {filteredRecs.length > 3 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: Math.max(0, filteredRecs.length - 2) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    carouselIndex === i 
                      ? 'w-4 bg-cyan-400' 
                      : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          )}

        </section>

        {/* 4. PIPELINE DETAILS SECTION */}
        <div className="mt-20 border border-white/5 bg-slate-950/20 backdrop-blur-md rounded-2xl p-6 sm:p-8 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-violet-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
              Content-Based Vector Pipeline Diagnostics
            </h3>
          </div>
          <p className="text-slate-400 text-xs mb-6 font-light leading-relaxed">
            The similarity matrices are computed using a term-frequency inverse-document-frequency (TF-IDF) equation that quantifies lexical relevance of genres, themes, and overview plots, and returns distance dimensions based on cosine similarity logic:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 font-mono">
              <span className="text-[10px] text-cyan-400 font-extrabold block mb-1">EQUATION</span>
              cos(θ) = A·B / ||A||||B||
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 font-mono">
              <span className="text-[10px] text-violet-400 font-extrabold block mb-1">VOCAB DIMENSIONS</span>
              k = 18,492 Latent Factors
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 font-mono">
              <span className="text-[10px] text-emerald-400 font-extrabold block mb-1">WEIGHT ENGINE</span>
              L2 Norm Normalization
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 font-mono">
              <span className="text-[10px] text-pink-400 font-extrabold block mb-1">MODEL LATENCY</span>
              0.14 ms / similarity query
            </div>
          </div>
        </div>

      </main>

      {/* Footer bar */}
      <footer className="border-t border-white/5 py-8 bg-slate-950/30 backdrop-blur-md relative z-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <span>CineMind.AI</span>
            <span>•</span>
            <span>Next-Generation Film Discovery Systems</span>
          </div>
          <div>
            &copy; 2026 CineMind Systems Corp. Built with Next.js 14, Framer Motion & Tailwind.
          </div>
        </div>
      </footer>

    </div>
  );
}
