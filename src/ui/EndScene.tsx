import { motion } from 'framer-motion';
import { useState } from 'react';
import { useGameStore } from '@/systems/store';
import { getRole } from '@/data/roles';
import { setHighScore, getHighScore } from '@/systems/storage';
import { buildPayload } from '@/systems/antiCheat';
import { submitRunToLeaderboard, supabaseConfigured } from '@/lib/supabase';
import { Button } from './shadcn/Button';
import { ShareCard } from './ShareCard';
import { Leaderboard } from './Leaderboard';
import { telemetry } from '@/systems/telemetry';

export const EndScene = () => {
  const endData = useGameStore((s) => s.endData);
  const startRun = useGameStore((s) => s.startRun);
  const reset = useGameStore((s) => s.reset);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [lbRefresh, setLbRefresh] = useState(0);

  if (!endData) return null;
  const role = getRole(endData.roleId);

  const isNewHigh = setHighScore(endData.roleId, endData.score);
  const prevHi = getHighScore(endData.roleId);

  const handleSubmit = async () => {
    if (!endData) return;
    setSubmitting(true);
    setSubmitResult(null);
    const payload = buildPayload(
      endData.roleId,
      endData.score,
      endData.distance,
      endData.durationMs,
    );
    const result = await submitRunToLeaderboard({
      ...payload,
      ending_id: endData.endingId,
      stats: endData.stats as unknown as Record<string, unknown>,
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitResult('✓ Отправлено в leaderboard');
      setLbRefresh((k) => k + 1);
    } else {
      setSubmitResult(`✗ ${result.error ?? 'unknown error'}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center p-6 bg-bg/85 backdrop-blur overflow-y-auto"
    >
      <div className="w-full max-w-xl my-auto">
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

        {/* Leaderboard submit (Phase 4) */}
        <div className="mt-4 bg-bg-card/60 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold">🏅 Leaderboard · {role.name}</h4>
            {supabaseConfigured && !submitResult && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="text-xs bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold"
              >
                {submitting ? '⏳' : '📤'} Submit
              </button>
            )}
          </div>
          {submitResult && (
            <div
              className={`text-xs mb-2 ${
                submitResult.startsWith('✓') ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {submitResult}
            </div>
          )}
          <Leaderboard roleId={endData.roleId} mode="daily" refreshKey={lbRefresh} />
        </div>

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