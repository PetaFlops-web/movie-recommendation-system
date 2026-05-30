'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Film, 
  Brain, 
  TrendingUp, 
  Compass, 
  Cpu, 
  Star, 
  ArrowRight, 
  Zap, 
  Activity, 
  Terminal, 
  Play, 
  Plus, 
  BookmarkCheck,
  UserCheck
} from 'lucide-react';

// Pre-defined premium movie recommendations for the AI Sandbox
interface MovieRecommendation {
  id: string;
  title: string;
  year: string;
  runtime: string;
  rating: string;
  match: number;
  genres: string[];
  backdrop: string;
  glowColor: string;
  aiRationale: string;
  tasteMetrics: {
    scifi: number;
    thriller: number;
    visuals: number;
    depth: number;
  };
}

const recommendations: Record<string, MovieRecommendation> = {
  scifi: {
    id: 'interstellar',
    title: 'Interstellar',
    year: '2014',
    runtime: '2h 49m',
    rating: '8.7',
    match: 98,
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    backdrop: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.4) 0%, rgba(15, 23, 42, 0.95) 75%)',
    glowColor: '#8b5cf6',
    aiRationale: 'Highly recommended based on your preference for high-concept astrophysics, profound emotional depth, relativistic time dilation concepts, and Hans Zimmer orchestral score profiles.',
    tasteMetrics: { scifi: 95, thriller: 55, visuals: 90, depth: 98 }
  },
  cyberpunk: {
    id: 'bladerunner2049',
    title: 'Blade Runner 2049',
    year: '2017',
    runtime: '2h 44m',
    rating: '8.0',
    match: 96,
    genres: ['Cyberpunk', 'Sci-Fi', 'Mystery'],
    backdrop: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.4) 0%, rgba(15, 23, 42, 0.95) 75%)',
    glowColor: '#06b6d4',
    aiRationale: 'Matches your affinity for synthwave ambient frequencies, neo-noir mystery plots, philosophical android existentialism, and Roger Deakins masterpiece level of color composition.',
    tasteMetrics: { scifi: 98, thriller: 75, visuals: 98, depth: 88 }
  },
  thriller: {
    id: 'inception',
    title: 'Inception',
    year: '2010',
    runtime: '2h 28m',
    rating: '8.8',
    match: 95,
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    backdrop: 'radial-gradient(circle at center, rgba(236, 72, 153, 0.4) 0%, rgba(15, 23, 42, 0.95) 75%)',
    glowColor: '#ec4899',
    aiRationale: 'Generated from your interest in multi-layered dream heists, non-linear architectural physics, intense psychological plots, and complex subconscious puzzle storytelling.',
    tasteMetrics: { scifi: 82, thriller: 96, visuals: 88, depth: 92 }
  }
};

export default function Home() {
  const [selectedVibe, setSelectedVibe] = useState<'scifi' | 'cyberpunk' | 'thriller'>('scifi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [savedToWatchlist, setSavedToWatchlist] = useState<Record<string, boolean>>({});
  const [particlePulse, setParticlePulse] = useState(0);

  const activeMovie = recommendations[selectedVibe];

  // Simulated Console Engine logs
  useEffect(() => {
    setIsProcessing(true);
    const logs = [
      `> [INIT] Loading latent movie factors (k=100)...`,
      `> [LOAD] Deep collaborative network weights initialized.`,
      `> [TFT] Map Taste profile: Sci-Fi[${activeMovie.tasteMetrics.scifi}%], Depth[${activeMovie.tasteMetrics.depth}%]`,
      `> [MATH] Running Cosine Similarity across 18,492 index entries...`,
      `> [DONE] Found nearest high-affinity neighbor: "${activeMovie.title}" (${activeMovie.match}% match, inference: 14.2ms)`
    ];

    setConsoleLogs([]);
    let currentLogIndex = 0;
    
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setConsoleLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        setIsProcessing(false);
        clearInterval(interval);
      }
    }, 150);

    setParticlePulse(prev => prev + 1);

    return () => clearInterval(interval);
  }, [selectedVibe, activeMovie.tasteMetrics.scifi, activeMovie.tasteMetrics.depth, activeMovie.title, activeMovie.match]);

  const toggleWatchlist = (id: string) => {
    setSavedToWatchlist(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="relative min-h-screen z-10 selection:bg-violet-500/30 selection:text-violet-200">
      
      {/* Background Atmosphere Layers */}
      <div className="cinematic-bg">
        <div className="glow-orb glow-orb-purple"></div>
        <div className="glow-orb glow-orb-cyan"></div>
        <div className="glow-orb glow-orb-center"></div>
        <div className="stars-overlay"></div>
        <div className="neon-grid"></div>
      </div>

      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                CineMind<span className="text-violet-500 font-extrabold text-2xl">.</span>AI
              </span>
              <span className="block text-[10px] text-slate-400 tracking-widest uppercase font-semibold">Recommendation Hub</span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#discover" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" /> Discover
            </a>
            <a href="#engine" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-violet-400" /> AI Engine
            </a>
            <a href="#trending" className="hover:text-white transition-colors flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-pink-400" /> Trending
            </a>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-cyan-500/20 text-cyan-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-glow-indicator"></span>
              Neural Core v2.4 Active
            </div>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:inline-flex text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Sign In
            </button>
            <button className="btn-gloss px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 border border-violet-500/30 hover:border-violet-500/60 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 active:scale-95 transition-all">
              Initialize Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:pt-16 lg:pt-20">
        
        {/* Top Announcement Badge */}
        <div className="flex justify-center md:justify-start mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-950/40 border border-violet-500/20 text-xs text-violet-300 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span className="font-medium tracking-wide">Next-Gen Cognitive Movie Recommendation Engine</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Premium Typography & CTAs */}
          <section className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Tagline / Subtitle */}
            <span className="text-sm font-extrabold tracking-widest text-cyan-400 uppercase mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-spin-slow" /> STOP SCROLLING. START WATCHING.
            </span>

            {/* Main Premium Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white mb-6">
              Discover Your Next <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-200 to-cyan-200 text-glow">
                Favorite Movie
              </span> <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">
                with Advanced AI
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mb-8 leading-relaxed font-light">
              Personalized movie recommendations powered by artificial intelligence. CineMind analyzes your unique emotional profile, mood, and viewing aesthetics to deliver perfect cinematic matches without the infinite scrolling fatigue.
            </p>

            {/* CTA Buttons Block */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12">
              <Link href="/movie/interstellar" className="w-full sm:w-auto">
                <button className="btn-gloss w-full px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 border border-violet-500/20 hover:border-violet-500/40 shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 flex items-center justify-center gap-2 group transition-all duration-300 hover:-translate-y-0.5">
                  <Film className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Explore Movies
                  <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              <button className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 backdrop-blur-md flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                Get AI Recommendations
              </button>
            </div>

            {/* Trust Indicators / Stats */}
            <div className="w-full border-t border-white/5 pt-8">
              <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-4">
                ENGINE TRUST INDICATORS
              </span>
              <div className="grid grid-cols-3 gap-6">
                
                {/* Metric 1 */}
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline">
                    99.4<span className="text-violet-500 text-base sm:text-lg">%</span>
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium text-center lg:text-left">
                    Predictive Accuracy
                  </span>
                </div>

                {/* Metric 2 */}
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline">
                    18K<span className="text-cyan-500 text-base sm:text-lg">+</span>
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium text-center lg:text-left">
                    Enriched Movies mapped
                  </span>
                </div>

                {/* Metric 3 */}
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline">
                    14<span className="text-pink-500 text-xs font-bold uppercase ml-0.5">ms</span>
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium text-center lg:text-left">
                    Neural Inference Time
                  </span>
                </div>

              </div>
            </div>

          </section>

          {/* RIGHT COLUMN: Cinematic Layout & Interactive AI Sandbox */}
          <section className="lg:col-span-6 relative flex flex-col items-center">
            
            {/* Glow backing element */}
            <div 
              className="absolute w-[80%] h-[80%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 rounded-full blur-[80px] opacity-20 transition-all duration-700" 
              style={{ backgroundColor: activeMovie.glowColor }}
            />

            {/* Sandbox Container */}
            <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 relative z-10 overflow-hidden border border-white/10 shadow-2xl">
              
              {/* Interactive Dashboard Title */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                    Neural Recommendation Sandbox
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Live Model</span>
                </div>
              </div>

              {/* Step 1: Mood/Vibe Selectors */}
              <div className="mb-6">
                <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">
                  1. Select Taste Vector Target:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setSelectedVibe('scifi')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border ${
                      selectedVibe === 'scifi' 
                        ? 'bg-violet-600/25 border-violet-500 text-white shadow-lg shadow-violet-500/10' 
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                    }`}
                  >
                    <span className="text-lg">🌌</span>
                    Cerebral Sci-Fi
                  </button>

                  <button 
                    onClick={() => setSelectedVibe('cyberpunk')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border ${
                      selectedVibe === 'cyberpunk' 
                        ? 'bg-cyan-600/25 border-cyan-500 text-white shadow-lg shadow-cyan-500/10' 
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                    }`}
                  >
                    <span className="text-lg">⚡</span>
                    Neon Cyberpunk
                  </button>

                  <button 
                    onClick={() => setSelectedVibe('thriller')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border ${
                      selectedVibe === 'thriller' 
                        ? 'bg-pink-600/25 border-pink-500 text-white shadow-lg shadow-pink-500/10' 
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                    }`}
                  >
                    <span className="text-lg">🌀</span>
                    Mind Thriller
                  </button>
                </div>
              </div>

              {/* Step 2: Glowing Recommendation Flow Visualizer */}
              <div className="relative h-12 w-full flex items-center justify-between px-6 bg-slate-950/60 border border-white/5 rounded-2xl mb-6 overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 z-10 font-medium">
                  <span className="text-base">👤</span> Taste Target
                </div>
                
                {/* SVG Connecting Flow Lines */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-full h-full px-20" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      d="M0 20 C 50 20, 50 20, 100 20 C 150 20, 150 20, 200 20" 
                      stroke="rgba(255, 255, 255, 0.08)" 
                      strokeWidth="2" 
                      strokeDasharray="4 4" 
                    />
                    
                    {/* Animated Flowing Gradient Laser Node */}
                    <motion.path 
                      key={particlePulse}
                      d="M0 20 C 50 20, 50 20, 100 20 C 150 20, 150 20, 200 20" 
                      stroke={`url(#laserGradient-${selectedVibe})`} 
                      strokeWidth="2.5" 
                      strokeDasharray="20 180"
                      initial={{ strokeDashoffset: 200 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />

                    <defs>
                      <linearGradient id={`laserGradient-scifi`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                        <stop offset="50%" stopColor="#c084fc" stopOpacity="1" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id={`laserGradient-cyberpunk`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                        <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                        <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id={`laserGradient-thriller`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
                        <stop offset="50%" stopColor="#f472b6" stopOpacity="1" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg border relative z-10 transition-all duration-300"
                  style={{ 
                    borderColor: `${activeMovie.glowColor}50`, 
                    boxShadow: `0 0 10px ${activeMovie.glowColor}25`,
                    backgroundColor: `${activeMovie.glowColor}10` 
                  }}
                >
                  <Cpu className="w-3.5 h-3.5 animate-pulse" style={{ color: activeMovie.glowColor }} />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 z-10 font-medium">
                  <span className="text-base">🎬</span> Match Found
                </div>
              </div>

              {/* Step 3: Dynamic Recommended Movie Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedVibe}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-white/10 overflow-hidden relative shadow-xl"
                  style={{ background: activeMovie.backdrop }}
                >
                  {/* Subtle Dark Overlay */}
                  <div className="absolute inset-0 bg-slate-950/70 z-0 backdrop-blur-[1px]" />

                  {/* Card Content */}
                  <div className="p-5 relative z-10 flex flex-col justify-between min-h-[220px]">
                    
                    {/* Top Row: Genres & Match Score */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {activeMovie.genres.map(g => (
                          <span 
                            key={g} 
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-white/10 border border-white/5"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                      
                      {/* Neon Match Circle */}
                      <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-full border border-white/10 shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeMovie.glowColor }} />
                        <span className="text-[10px] font-extrabold tracking-wide text-white uppercase">
                          {activeMovie.match}% Match
                        </span>
                      </div>
                    </div>

                    {/* Middle Section: Title & Stats */}
                    <div className="my-4">
                      <span className="text-[10px] text-cyan-400 tracking-wider font-extrabold uppercase mb-1 block">
                        TOP RECOMMENDATION
                      </span>
                      <h3 className="text-2xl font-black text-white leading-tight tracking-tight">
                        {activeMovie.title}
                      </h3>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-2 font-medium">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          {activeMovie.rating}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                        <span>{activeMovie.year}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                        <span>{activeMovie.runtime}</span>
                      </div>
                    </div>

                    {/* Bottom Section: AI explanation & Watchlist button */}
                    <div className="pt-3 border-t border-white/5 flex flex-col gap-3">
                      <p className="text-[11px] leading-relaxed text-slate-300 font-light italic">
                        &ldquo;{activeMovie.aiRationale}&rdquo;
                      </p>
                      
                      {/* Buttons */}
                      <div className="flex items-center gap-2 mt-1">
                        <Link href={`/movie/${activeMovie.id}`} className="flex-1">
                          <button className="w-full btn-gloss py-2 px-3 rounded-lg text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/5 hover:border-white/15 flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                            <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                            View Synopsis
                          </button>
                        </Link>
                        
                        <button 
                          onClick={() => toggleWatchlist(activeMovie.id)}
                          className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                            savedToWatchlist[activeMovie.id] 
                              ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40' 
                              : 'bg-violet-600/40 hover:bg-violet-600/60 border-violet-500/40 text-white'
                          } border`}
                        >
                          {savedToWatchlist[activeMovie.id] ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Add Watchlist
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              </AnimatePresence>

            </div>

            {/* FLOATING CARD 1: Real-time calculation log (Linear/Vercel Style) */}
            <div className="absolute -bottom-8 -left-8 w-60 glass-panel rounded-2xl p-4 border border-white/5 shadow-2xl z-20 hidden sm:block">
              <div className="flex items-center gap-1.5 mb-2 border-b border-white/5 pb-1.5">
                <Terminal className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Compute Console logs
                </span>
              </div>
              <div className="font-mono text-[9px] text-slate-300 leading-tight space-y-1">
                {consoleLogs.map((log, i) => (
                  <div key={i} className="truncate">
                    {log}
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex items-center gap-1 text-cyan-400">
                    <span>&gt; Running gradient descent...</span>
                    <span className="w-1.5 h-3 bg-cyan-400 animate-pulse inline-block"></span>
                  </div>
                )}
              </div>
            </div>

            {/* FLOATING CARD 2: User Taste Profile Chart (Spotify Style) */}
            <div className="absolute -top-6 -right-6 w-52 glass-panel rounded-2xl p-4 border border-white/5 shadow-2xl z-20 hidden md:block">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                    Taste Profile
                  </span>
                </div>
                <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-extrabold">Active</span>
              </div>
              
              <div className="space-y-2 mt-3">
                {/* Metric 1 */}
                <div>
                  <div className="flex justify-between text-[9px] font-semibold text-slate-300 mb-0.5">
                    <span>Sci-Fi / Space</span>
                    <span>{activeMovie.tasteMetrics.scifi}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-600 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${activeMovie.tasteMetrics.scifi}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Metric 2 */}
                <div>
                  <div className="flex justify-between text-[9px] font-semibold text-slate-300 mb-0.5">
                    <span>Suspense / Thrill</span>
                    <span>{activeMovie.tasteMetrics.thriller}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-600 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${activeMovie.tasteMetrics.thriller}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Metric 3 */}
                <div>
                  <div className="flex justify-between text-[9px] font-semibold text-slate-300 mb-0.5">
                    <span>Visual Composition</span>
                    <span>{activeMovie.tasteMetrics.visuals}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-600 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${activeMovie.tasteMetrics.visuals}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Metric 4 */}
                <div>
                  <div className="flex justify-between text-[9px] font-semibold text-slate-300 mb-0.5">
                    <span>Philosophical Depth</span>
                    <span>{activeMovie.tasteMetrics.depth}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-600 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${activeMovie.tasteMetrics.depth}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

              </div>
            </div>

          </section>

        </div>

        {/* Dynamic Interactive Flow Step Walkthrough Bar */}
        <div className="mt-20 border border-white/5 bg-slate-950/20 backdrop-blur-md rounded-2xl p-6 sm:p-8">
          <div className="text-center md:text-left mb-6">
            <h2 className="text-lg font-black text-white flex items-center justify-center md:justify-start gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Engine Pipeline Architecture
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-light">
              How our dual-layered recommendation algorithm solves the industry standard data scarcity problem.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 Card */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-violet-500/20 hover:bg-white/[0.03] transition-all">
              <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center text-sm font-black mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 flex items-center justify-between">
                Matrix Factorization
                <span className="text-[9px] bg-violet-600/10 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/20">Collaborative</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Our model utilizes latent dimensions to map complex user watch-patterns and interest profiles directly to movie vectors, discovering hidden structural preferences.
              </p>
            </div>

            {/* Step 2 Card */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-cyan-500/20 hover:bg-white/[0.03] transition-all">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-black mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 flex items-center justify-between">
                Content-Based Cosine
                <span className="text-[9px] bg-cyan-600/10 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20">Similarity</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Metadata is parsed including director profiles, cinematic color schemas, tag vectors, and soundscapes to resolve recommendation recommendations with high accuracy.
              </p>
            </div>

            {/* Step 3 Card */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-pink-500/20 hover:bg-white/[0.03] transition-all">
              <div className="w-8 h-8 rounded-lg bg-pink-600/10 border border-pink-500/20 text-pink-400 flex items-center justify-center text-sm font-black mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 flex items-center justify-between">
                Hybrid Core Arbitrage
                <span className="text-[9px] bg-pink-600/10 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/20">Real-time</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                A unified neural feedback filter resolves predictions dynamically. It mitigates the cold-start problem, instantly mapping onboarding choices in under 14 milliseconds.
              </p>
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
