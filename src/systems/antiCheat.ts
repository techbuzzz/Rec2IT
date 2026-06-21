/**
 * Anti-cheat — Phase 1 stub (Phase 4 = Edge Function + HMAC).
 * Сейчас: hash для само-валидации + payload для будущей отправки.
 */

export interface RunPayload {
  run_id: string;
  score: number;
  distance: number;
  duration_ms: number;
  role_id: string;
  hash: string;
}

const SECRET = (import.meta.env.VITE_RUN_SECRET as string) || 'local-dev-secret';

const djb2 = (s: string): number => {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
};

export const makeRunId = (): string => {
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const computeHash = (runId: string, score: number, roleId: string): string => {
  const payload = `${runId}|${score}|${roleId}|${SECRET}`;
  return djb2(payload).toString(16).padStart(8, '0');
};

export const validateRun = (payload: RunPayload): boolean => {
  const expected = computeHash(payload.run_id, payload.score, payload.role_id);
  if (expected !== payload.hash) return false;

  const ratio = payload.distance / (payload.duration_ms / 1000);
  if (ratio < 1 || ratio > 50) return false;

  const scorePerMeter = payload.score / Math.max(1, payload.distance);
  if (scorePerMeter > 100) return false;

  return true;
};

export const buildPayload = (
  roleId: string,
  score: number,
  distance: number,
  durationMs: number,
): RunPayload => {
  const run_id = makeRunId();
  return {
    run_id,
    score,
    distance,
    duration_ms: durationMs,
    role_id: roleId,
    hash: computeHash(run_id, score, roleId),
  };
};