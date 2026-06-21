/**
 * ModifiersScreen — показывает 2 случайных модификатора перед run.
 * Игрок принимает оба (toggle all/no отказ) и стартует.
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { pickModifiersForRun, type Modifier } from '@/data/modifiers';
import { useGameStore } from '@/systems/store';
import { getRole } from '@/data/roles';
import { Button } from './shadcn/Button';
import { cn } from '@/lib/utils';

export const ModifiersScreen = () => {
  const roleId = useGameStore((s) => s.roleId);
  const [modifiers] = useState<[Modifier, Modifier] | []>(
    roleId ? pickModifiersForRun(roleId) : [],
  );
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const applyModifiers = useGameStore((s) => s.applyModifiers);

  if (!roleId || modifiers.length === 0) return null;
  const role = getRole(roleId);
  const [m1, m2] = modifiers;

  if (accepted === true) {
    // apply + go to briefing
    applyModifiers([m1, m2]);
    setTimeout(() => useGameStore.setState({ scene: 'briefing', showModifiers: false }), 100);
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-bg/80 backdrop-blur p-6"
    >
      <div className="w-full max-w-3xl">
        <div className="text-center mb-6">
          <div className="text-xs uppercase tracking-widest text-yellow-400 font-bold mb-1">
            📰 News Flash
          </div>
          <h2 className="text-3xl font-extrabold">
            События в индустрии сегодня
          </h2>
          <p className="text-gray-400 mt-2">
            Два roguelike-модификатора повлияют на твой {role.name} run.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[m1, m2].map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className={cn(
                'rounded-2xl border-2 p-5',
                m.isBuff
                  ? 'border-green-500/40 bg-green-500/5'
                  : 'border-red-500/40 bg-red-500/5',
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-4xl">{m.emoji}</div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 font-bold">
                    {m.isBuff ? '✓ Buff' : '✗ Debuff'}
                  </div>
                  <h3 className="text-lg font-bold">{m.name}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-400">{m.flavor}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            size="lg"
            onClick={() => setAccepted(true)}
            className="bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg shadow-orange-500/30"
          >
            Принять вызов →
          </Button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-3">
          Модификаторы случайны на каждый run. Re-roll: F5.
        </p>
      </div>
    </motion.div>
  );
};