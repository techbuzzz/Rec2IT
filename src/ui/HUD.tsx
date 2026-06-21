import { motion } from 'framer-motion';
import { useGameStore } from '@/systems/store';
import { getRole } from '@/data/roles';
import { formatNumber, formatDistance } from '@/lib/utils';

export const HUD = () => {
  const roleId = useGameStore((s) => s.roleId);
  const score = useGameStore((s) => s.score);
  const lives = useGameStore((s) => s.lives);
  const combo = useGameStore((s) => s.combo);
  const multiplier = useGameStore((s) => s.comboMultiplier);
  const distance = useGameStore((s) => s.distance);

  if (!roleId) return null;
  const role = getRole(roleId);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between pointer-events-none"
    >
      <div className="bg-bg-panel/80 backdrop-blur border border-white/10 rounded-xl px-4 py-2">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Score</div>
        <div className="text-2xl font-bold font-mono" style={{ color: role.accentColor }}>
          {formatNumber(score)}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="bg-bg-panel/80 backdrop-blur border border-white/10 rounded-xl px-4 py-2 text-center">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Distance</div>
          <div className="text-lg font-bold font-mono">{formatDistance(distance)}</div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${
            multiplier > 1.5 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/5 text-gray-400'
          }`}
        >
          ×{multiplier.toFixed(1)} combo {combo}
        </div>
      </div>

      <div className="bg-bg-panel/80 backdrop-blur border border-white/10 rounded-xl px-4 py-2 text-right">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Lives</div>
        <div className="text-2xl font-bold">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < lives ? '' : 'opacity-20'}>
              ❤
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};