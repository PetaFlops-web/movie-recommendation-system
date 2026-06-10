'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { checkHealth, HealthStatus } from '@/app/lib/api';

function StatusDot({ status }: { status: string }) {
  const isHealthy = status === 'connected' || status === 'healthy' || status === 'ok';
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        isHealthy ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]'
      }`}
    />
  );
}

export default function HealthIndicator() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const allHealthy = health
    ? (health.api === 'healthy' || health.api === 'ok') &&
      (health.database === 'connected' || health.database === 'ok') &&
      (health.ml_service === 'connected' || health.ml_service === 'ok' || health.ml_service === 'healthy')
    : false;

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={fetchStatus}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all hover:bg-white/5"
        title="System status (click to refresh)"
      >
        <Activity className={`w-3 h-3 ${allHealthy ? 'text-green-400' : health ? 'text-red-400' : 'text-slate-500'}`} />
        {isLoading ? (
          <div className="loading-spinner w-2.5 h-2.5 border-[1.5px]" />
        ) : health ? (
          <span className={allHealthy ? 'text-green-400' : 'text-red-400'}>
            {allHealthy ? 'Online' : 'Degraded'}
          </span>
        ) : (
          <span className="text-slate-500">Offline</span>
        )}
      </button>

      <AnimatePresence>
        {showTooltip && health && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 glass-panel rounded-xl border border-brand-300/20 shadow-2xl p-3 z-50"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              System Status
            </p>
            <div className="space-y-1.5">
              {[
                { label: 'API Server', status: health.api },
                { label: 'Database', status: health.database },
                { label: 'ML Service', status: health.ml_service },
              ].map(({ label, status }) => {
                const ok = status === 'connected' || status === 'healthy' || status === 'ok';
                return (
                  <div key={label} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={status} />
                      <span className="text-slate-300">{label}</span>
                    </div>
                    {ok ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!health && !isLoading && showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 glass-panel rounded-xl border border-red-500/20 shadow-2xl p-3 z-50"
        >
          <div className="flex items-center gap-2 text-[11px]">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-red-300">Tidak dapat terhubung ke server</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
