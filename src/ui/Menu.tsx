import { motion } from 'framer-motion';
import { ROLE_LIST, getRole, type RoleId } from '@/data/roles';
import { Card } from './shadcn/Card';
import { Button } from './shadcn/Button';
import { useGameStore } from '@/systems/store';
import { getHighScore } from '@/systems/storage';
import { formatNumber } from '@/lib/utils';

export const Menu = () => {
  const startRun = useGameStore((s) => s.startRun);
  const reset = useGameStore((s) => s.reset);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-transparent via-bg/50 to-bg/90"
    >
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-3 text-shadow-glow">
          Job Interview Runner
          <span className="block text-2xl md:text-3xl font-bold text-blue-400 mt-2">2026</span>
        </h1>
        <p className="text-lg text-gray-400">
          200 кандидатов на вакансию. ИИ-фильтры. Фейковые офферы.{' '}
          <span className="text-white">Пробеги этот цирк.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl mb-8">
        {ROLE_LIST.map((role, idx) => {
          const hi = getHighScore(role.id as RoleId);
          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
            >
              <Card accent={role.accentColor} className="cursor-pointer h-full">
                <div className="text-5xl mb-3">{role.emoji}</div>
                <h3 className="text-xl font-bold mb-1" style={{ color: role.accentColor }}>
                  {role.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4 min-h-[40px]">{role.tagline}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>❤ {role.startingLives} HP</span>
                  <span>⚡ {role.baseSpeed}px/s</span>
                  <span>×{role.maxComboMultiplier} cap</span>
                </div>
                <div className="text-xs text-gray-500 mb-4">
                  High score:{' '}
                  <span className="text-white font-mono font-bold">
                    {formatNumber(hi)}
                  </span>
                </div>
                <Button
                  size="md"
                  className="w-full"
                  onClick={() => {
                    startRun(role.id as RoleId);
                  }}
                >
                  Бежать собес →
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="text-xs text-gray-600 mt-4">
        Controls: ← → swap lanes · Space jump · ↓ slide · R restart
      </div>

      {useGameStore.getState().endData && (
        <Button variant="ghost" size="sm" onClick={reset} className="mt-2">
          Clear last run
        </Button>
      )}
      {/* suppress unused warning for getRole helper if not used yet */}
      <span className="hidden">{getRole('junior-frontend').name}</span>
    </motion.div>
  );
};