/**
 * Supabase client — Phase 4 (пока stub).
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabaseConfig = {
  url: url ?? '',
  anonKey: anonKey ?? '',
};

/**
 * Phase 4: leaderboard submit через Edge Function.
 * Phase 1: возвращает ok=false, но без crash.
 */
export const submitRunToLeaderboard = async (_payload: {
  run_id: string;
  score: number;
  role_id: string;
  hash: string;
}): Promise<{ ok: boolean; error?: string }> => {
  if (!supabaseConfigured) {
    return { ok: false, error: 'Supabase not configured yet (Phase 4)' };
  }
  // Phase 4: fetch(`${url}/functions/v1/verify-run`, {...})
  return { ok: false, error: 'Not implemented in Phase 1' };
};