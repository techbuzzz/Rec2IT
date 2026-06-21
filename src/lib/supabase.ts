/**
 * Supabase client + leaderboard submit.
 * Phase 4: реальная интеграция с Edge Function.
 * Без env (VITE_SUPABASE_URL/_KEY) — graceful no-op.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RunPayload } from '@/systems/antiCheat';
import { telemetry } from '@/systems/telemetry';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

export const supabaseConfigured = Boolean(url && anonKey);

let _client: SupabaseClient | null = null;
export const supabaseClient = (): SupabaseClient | null => {
  if (!supabaseConfigured) return null;
  if (!_client) {
    _client = createClient(url, anonKey);
  }
  return _client;
};

export interface LeaderboardEntry {
  run_id: string;
  score: number;
  distance: number;
  run_date: string;
  rank: number;
}

const EDGE_FUNCTION_PATH = '/functions/v1/verify-run';

/**
 * Submit run к Edge Function.
 * Возвращает { ok, error?, run_id? }.
 */
export const submitRunToLeaderboard = async (
  payload: RunPayload & { modifiers?: { id: string }[]; ending_id?: string; stats?: Record<string, unknown> },
): Promise<{ ok: boolean; error?: string; run_id?: string }> => {
  if (!supabaseConfigured) {
    return { ok: false, error: 'Supabase not configured (set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)' };
  }
  try {
    const res = await fetch(`${url}${EDGE_FUNCTION_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error ?? `http_${res.status}` };
    }
    const data = (await res.json()) as { ok: boolean; run_id?: string; error?: string };
    if (data.ok) {
      telemetry.leaderboard_submit(payload.score);
    }
    return data;
  } catch (err) {
    return { ok: false, error: `network: ${String(err)}` };
  }
};

/**
 * Top-10 для роли. Без Supabase — возвращает пустой массив.
 */
export const getTopRuns = async (
  roleId: string,
  sinceDate?: string,
  limit = 10,
): Promise<LeaderboardEntry[]> => {
  if (!supabaseConfigured) return [];
  const client = supabaseClient();
  if (!client) return [];
  const { data, error } = await client.rpc('get_top_runs', {
    p_role_id: roleId,
    p_since_date: sinceDate ?? null,
    p_limit: limit,
  });
  if (error) {
    console.warn('get_top_runs failed', error);
    return [];
  }
  return (data ?? []) as LeaderboardEntry[];
};