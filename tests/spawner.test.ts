/**
 * Spawner tests — entity spawn cadence, lane selection, distance-based speedup.
 */

import { describe, it, expect } from 'vitest';
import { spawnerStep } from '@/systems/spawner';
import type { ActiveEntity } from '@/systems/types';

describe('spawnerStep', () => {
  const empty: ActiveEntity[] = [];

  it('returns new entity and interval', () => {
    const result = spawnerStep(empty, 100, 1500);
    expect(result.entities).toHaveLength(1);
    expect(result.nextIntervalMs).toBeGreaterThan(0);
  });

  it('new entity is spawned off-screen right', () => {
    const result = spawnerStep(empty, 100, 1500);
    const entity = result.entities[0]!;
    expect(entity.x).toBeGreaterThanOrEqual(1200);
  });

  it('spawn interval scales with distance (faster at higher distance)', () => {
    const early = spawnerStep(empty, 100, 1500);
    const late = spawnerStep(empty, 4000, 1500);
    expect(late.nextIntervalMs).toBeLessThan(early.nextIntervalMs);
  });

  it('interval never below 50% of base', () => {
    const result = spawnerStep(empty, 50000, 1000); // very far
    expect(result.nextIntervalMs).toBeGreaterThanOrEqual(500);
  });

  it('new entity has unique id', () => {
    const r1 = spawnerStep(empty, 100, 1500);
    const r2 = spawnerStep(empty, 100, 1500);
    expect(r1.entities[0]!.id).not.toBe(r2.entities[0]!.id);
  });

  it('kind is either obstacle or pickup', () => {
    for (let i = 0; i < 20; i++) {
      const result = spawnerStep(empty, 100, 1500);
      const entity = result.entities[0]!;
      expect(['obstacle', 'pickup']).toContain(entity.kind);
    }
  });

  it('lane is 0, 1, or 2', () => {
    for (let i = 0; i < 20; i++) {
      const result = spawnerStep(empty, 100, 1500);
      const entity = result.entities[0]!;
      expect([0, 1, 2]).toContain(entity.lane);
    }
  });
});