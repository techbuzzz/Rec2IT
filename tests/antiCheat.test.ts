/**
 * Anti-cheat tests — djb2 hash + payload validation (Phase 1 client-side stub).
 * Server-side HMAC verification is in the Supabase Edge Function.
 */

import { describe, it, expect } from 'vitest';
import {
  makeRunId,
  computeHash,
  validateRun,
  buildPayload,
  type RunPayload,
} from '@/systems/antiCheat';

describe('makeRunId', () => {
  it('starts with "run_"', () => {
    const id = makeRunId();
    expect(id).toMatch(/^run_/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => makeRunId()));
    expect(ids.size).toBe(100);
  });

  it('contains timestamp and random components', () => {
    const id = makeRunId();
    // Format: run_<timestamp36>_<random36>
    expect(id).toMatch(/^run_[a-z0-9]+_[a-z0-9]+$/);
  });
});

describe('computeHash', () => {
  it('returns 8-char hex string', () => {
    const hash = computeHash('run_test', 100, 'middle-backend');
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('is deterministic for same input', () => {
    const a = computeHash('run_test', 100, 'middle-backend');
    const b = computeHash('run_test', 100, 'middle-backend');
    expect(a).toBe(b);
  });

  it('different inputs produce different hashes', () => {
    const a = computeHash('run_a', 100, 'middle-backend');
    const b = computeHash('run_b', 100, 'middle-backend');
    const c = computeHash('run_a', 200, 'middle-backend');
    const d = computeHash('run_a', 100, 'senior-fullstack');
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
  });
});

describe('validateRun', () => {
  it('accepts valid payload', () => {
    const payload = buildPayload('middle-backend', 500, 1500, 90000);
    expect(validateRun(payload)).toBe(true);
  });

  it('rejects tampered score', () => {
    const payload = buildPayload('middle-backend', 500, 1500, 90000);
    const tampered: RunPayload = { ...payload, score: 99999 };
    expect(validateRun(tampered)).toBe(false);
  });

  it('rejects tampered hash', () => {
    const payload = buildPayload('middle-backend', 500, 1500, 90000);
    const tampered: RunPayload = { ...payload, hash: 'deadbeef' };
    expect(validateRun(tampered)).toBe(false);
  });

  it('rejects impossible speed (too slow)', () => {
    // 100m in 200s = 0.5 m/s — too slow
    const payload = buildPayload('middle-backend', 100, 100, 200000);
    expect(validateRun(payload)).toBe(false);
  });

  it('rejects impossible speed (too fast)', () => {
    // 1000m in 10s = 100 m/s — too fast
    const payload = buildPayload('middle-backend', 1000, 1000, 10000);
    expect(validateRun(payload)).toBe(false);
  });

  it('rejects absurd score-per-meter ratio', () => {
    // 1000m, 1M score = 1000 pts/m — exceeds cap of 100
    const payload = buildPayload('middle-backend', 1_000_000, 1000, 60000);
    expect(validateRun(payload)).toBe(false);
  });

  it('accepts edge of speed range', () => {
    // 50m in 50s = 1 m/s — minimum valid
    const payload = buildPayload('middle-backend', 50, 50, 50000);
    expect(validateRun(payload)).toBe(true);
  });
});

describe('buildPayload', () => {
  it('creates payload with all required fields', () => {
    const payload = buildPayload('junior-frontend', 200, 800, 60000);
    expect(payload.run_id).toBeTruthy();
    expect(payload.score).toBe(200);
    expect(payload.distance).toBe(800);
    expect(payload.duration_ms).toBe(60000);
    expect(payload.role_id).toBe('junior-frontend');
    expect(payload.hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('self-validates immediately after build', () => {
    const payload = buildPayload('qa-engineer', 350, 1000, 75000);
    expect(validateRun(payload)).toBe(true);
  });
});