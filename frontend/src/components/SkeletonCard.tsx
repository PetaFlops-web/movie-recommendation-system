function SkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/5 h-[260px] flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-14 bg-white/5 rounded-full shimmer-bg" />
          <div className="h-4 w-12 bg-white/5 rounded-full shimmer-bg" />
        </div>
        <div className="h-5 w-3/4 bg-white/5 rounded shimmer-bg" />
        <div className="h-3 w-1/2 bg-white/5 rounded shimmer-bg" />
        <div className="space-y-1.5 pt-2">
          <div className="h-2 w-full bg-white/5 rounded shimmer-bg" />
          <div className="h-2 w-2/3 bg-white/5 rounded shimmer-bg" />
        </div>
      </div>
      <div className="h-8 w-full bg-white/5 rounded shimmer-bg" />
    </div>
  );
}

export default SkeletonCard;