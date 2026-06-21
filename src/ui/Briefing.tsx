import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/systems/store';
import { getRole } from '@/data/roles';

export const Briefing = () => {
  const roleId = useGameStore((s) => s.roleId);
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      // старт RunScene
      useGameStore.setState({ scene: 'run', isRunning: true });
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [count]);

  if (!roleId) return null;
  const role = getRole(roleId);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg/70 backdrop-blur-sm">
      <div className="text-center">
        <div className="text-7xl mb-6">{role.emoji}</div>
        <h2
          className="text-4xl font-extrabold mb-2"
          style={{ color: role.accentColor }}
        >
          {role.name}
        </h2>
        <p className="text-gray-400 mb-8">{role.tagline}</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-9xl font-extrabold text-white text-shadow-glow"
          >
            {count > 0 ? count : '🏃'}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};