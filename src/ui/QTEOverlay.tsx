/**
 * QTEOverlay — Phase 2 stub. Phase 1 показывает placeholder.
 */

import { motion } from 'framer-motion';
import { useGameStore } from '@/systems/store';

export const QTEOverlay = () => {
  const distance = useGameStore((s) => s.distance);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-bg-card border border-white/20 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">🚧</div>
        <h3 className="text-2xl font-bold mb-2">QTE-сцена</h3>
        <p className="text-gray-400 mb-4">
          Триггер каждые 500м. Полная реализация — Phase 2.
        </p>
        <p className="text-xs text-gray-500 font-mono">
          distance: {Math.round(distance)}m (Phase 1: QTE отключены)
        </p>
      </div>
    </motion.div>
  );
};