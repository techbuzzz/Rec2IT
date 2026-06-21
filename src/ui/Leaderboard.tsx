/**
 * Leaderboard — top-10 daily / all-time per role.
 * Phase 4. Без Supabase env — показывает "не настроено".
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getTopRuns, supabaseConfigured, type LeaderboardEntry } from '@/lib/supabase';
import type { RoleId } from '@/data/roles';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  roleId: RoleId;
  mode: 'daily' | 'alltime';
  refreshKey?: number;
}

export const Leaderboard = ({ roleId, mode, refreshKey = 0 }: Props) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const since = mode === 'daily'
      ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : undefined;
    getTopRuns(roleId, since, 10).then((data) => {
      if (cancelled) return;
      setEntries(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [roleId, mode, refreshKey]);

  if (!supabaseConfigured) {
    return (
      <div className="text-xs text-gray-600 text-center p-4 bg-bg-panel/50 rounded-lg">
        Leaderboard не настроен (Phase 4).<br />
        Добавь <code className="text-gray-400">VITE_SUPABASE_URL</code> + <code className="text-gray-400">VITE_SUPABASE_ANON_KEY</code> в <code className="text-gray-400">.env</code>.
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-gray-500 text-center p-4">Загрузка…</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center p-4">
        Пока никто не пробежал эту роль. Будь первым 🏃
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => (
        <motion.div
          key={entry.run_id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: entry.rank * 0.04 }}
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-lg',
            entry.rank === 1 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-bg-panel/50',
          )}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm w-6 text-right">
              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
            </span>
            <div>
              <div className="font-mono font-bold text-sm">{formatNumber(entry.score)}</div>
              <div className="text-xs text-gray-500">{Math.round(entry.distance)}м</div>
            </div>
          </div>
          <div className="text-xs text-gray-600 font-mono">
            {entry.run_id.slice(-6)}
          </div>
        </motion.div>
      ))}
    </div>
  );
};