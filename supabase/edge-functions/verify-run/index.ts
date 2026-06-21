// Edge Function: verify-run
// Деплой: supabase functions deploy verify-run
// Secrets: supabase secrets set RUN_SECRET=...

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RUN_SECRET = Deno.env.get('RUN_SECRET') || 'fallback-dev-secret';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RunPayload {
  run_id: string;
  role_id: string;
  score: number;
  distance: number;
  duration_ms: number;
  hash: string;
  modifiers?: { id: string }[];
  ending_id?: string;
  stats?: Record<string, any>;
}

// djb2 hash (должен совпадать с client antiCheat.ts)
const djb2 = (s: string): number => {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
};

const computeHash = (runId: string, score: number, roleId: string): string => {
  const payload = `${runId}|${score}|${roleId}|${RUN_SECRET}`;
  return djb2(payload).toString(16).padStart(8, '0');
};

const sha256 = async (s: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const getIpHash = async (req: Request): Promise<string> => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return sha256(`${ip}|${RUN_SECRET}`);
};

const VALID_ROLES = new Set([
  'junior-frontend', 'middle-backend', 'senior-fullstack',
  'devops', 'ml-engineer', 'product-manager', 'qa-engineer', 'mobile-developer',
]);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const payload: RunPayload = await req.json();

    // ============ BASIC VALIDATION ============
    if (
      !payload.run_id ||
      !payload.role_id ||
      typeof payload.score !== 'number' ||
      typeof payload.distance !== 'number' ||
      typeof payload.duration_ms !== 'number' ||
      !payload.hash
    ) {
      return json({ ok: false, error: 'invalid_payload' }, 400);
    }
    if (!VALID_ROLES.has(payload.role_id)) {
      return json({ ok: false, error: 'invalid_role' }, 400);
    }

    // ============ HASH CHECK ============
    const expected = computeHash(payload.run_id, payload.score, payload.role_id);
    if (expected !== payload.hash) {
      return json({ ok: false, error: 'hash_mismatch' }, 400);
    }

    // ============ RATIO CHECKS ============
    // Минимум 1 м/сек (idle), максимум 50 м/сек (cheat / teleport)
    const durationSec = Math.max(1, payload.duration_ms / 1000);
    const mps = payload.distance / durationSec;
    if (mps < 1 || mps > 50) {
      return json({ ok: false, error: 'distance_ratio_out_of_bounds', mps }, 400);
    }
    if (payload.score < 0 || payload.score > 1_000_000) {
      return json({ ok: false, error: 'score_out_of_bounds' }, 400);
    }
    // max score per meter (sanity: 100 очков/м)
    const scorePerMeter = payload.score / Math.max(1, payload.distance);
    if (scorePerMeter > 100) {
      return json({ ok: false, error: 'score_per_meter_too_high' }, 400);
    }

    // ============ RATE LIMIT ============
    // 1 run / 5 sec / IP
    const ipHash = await getIpHash(req);
    const fiveSecAgo = new Date(Date.now() - 5000).toISOString();
    const { count: recentCount } = await supabase
      .from('runs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gt('created_at', fiveSecAgo);
    if ((recentCount ?? 0) > 0) {
      return json({ ok: false, error: 'rate_limit' }, 429);
    }

    // ============ DUPLICATE CHECK ============
    const { data: existing } = await supabase
      .from('runs')
      .select('run_id')
      .eq('run_id', payload.run_id)
      .maybeSingle();
    if (existing) {
      return json({ ok: false, error: 'duplicate_run' }, 409);
    }

    // ============ INSERT ============
    const { error: runErr } = await supabase.from('runs').insert({
      run_id: payload.run_id,
      role_id: payload.role_id,
      score: payload.score,
      distance: payload.distance,
      duration_ms: payload.duration_ms,
      hash: payload.hash,
      ip_hash: ipHash,
      modifiers: payload.modifiers ?? [],
      ending_id: payload.ending_id ?? null,
      stats: payload.stats ?? {},
    });
    if (runErr) {
      console.error('runs insert failed', runErr);
      return json({ ok: false, error: 'insert_failed' }, 500);
    }

    const { error: anonErr } = await supabase.from('runs_anon').insert({
      run_id: payload.run_id,
      role_id: payload.role_id,
      score: payload.score,
      distance: Math.round(payload.distance),
    });
    if (anonErr) {
      console.error('runs_anon insert failed', anonErr);
      // не критично — runs уже в аудите
    }

    // ============ REBUILD LEADERBOARD ============
    const today = new Date().toISOString().slice(0, 10);
    const { error: rebuildErr } = await supabase.rpc('rebuild_leaderboard_daily', {
      p_role_id: payload.role_id,
      p_run_date: today,
    });
    if (rebuildErr) {
      console.warn('rebuild_leaderboard_daily failed', rebuildErr);
    }

    return json({ ok: true, run_id: payload.run_id, leaderboard_updated: !rebuildErr }, 200);
  } catch (err) {
    console.error('verify-run error', err);
    return json({ ok: false, error: 'internal_error', detail: String(err) }, 500);
  }
});

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });