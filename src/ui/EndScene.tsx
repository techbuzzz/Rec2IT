import { motion } from 'framer-motion';
import { useGameStore } from '@/systems/store';
import { getRole } from '@/data/roles';
import { setHighScore, getHighScore } from '@/systems/storage';
import { Button } from './shadcn/Button';
import { ShareCard } from './ShareCard';
import { telemetry } from '@/systems/telemetry';

export const EndScene = () => {
  const endData = useGameStore((s) => s.endData);
  const startRun = useGameStore((s) => s.startRun);
  const reset = useGameStore((s) => s.reset);

  if (!endData) return null;
  const role = getRole(endData.roleId);

  const isNewHigh = setHighScore(endData.roleId, endData.score);
  const prevHi = getHighScore(endData.roleId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center p-6 bg-bg/85 backdrop-blur"
    >
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ShareCard data={endData} />
        </motion.div>

        {isNewHigh && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.5 }}
            className="text-center mt-4 text-yellow-400 font-bold text-lg"
          >
            🏆 НОВЫЙ РЕКОРД!
          </motion.div>
        )}
        {!isNewHigh && (
          <div className="text-center mt-4 text-gray-500 text-sm">
            High score: {prevHi.toLocaleString('ru-RU')} ({role.name})
          </div>
        )}

        <div className="flex gap-3 mt-6 justify-center">
          <Button
            onClick={() => {
              telemetry.share('restart-click', endData.score);
              startRun(endData.roleId);
            }}
          >
            🔁 Заново
          </Button>
          <Button variant="ghost" onClick={reset}>
            🏠 В меню
          </Button>
        </div>
      </div>
    </motion.div>
  );
};