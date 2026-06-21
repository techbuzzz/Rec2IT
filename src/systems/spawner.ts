/**
 * Spawner — ритм препятствий и pickups.
 * Phase 1: deterministic-ish weighted random.
 */

import type { Lane, ActiveEntity } from './types';
import { pickObstacle } from '@/data/obstacles';
import { pickPickup } from '@/data/pickups';

let entityCounter = 0;

const generateId = (kind: 'obstacle' | 'pickup') =>
  `${kind}-${Date.now().toString(36)}-${entityCounter++}`;

const freeLanes = (entities: ActiveEntity[]): Lane[] => {
  const occupied = new Set(entities.map((e) => e.lane));
  return ([0, 1, 2] as Lane[]).filter((l) => !occupied.has(l));
};

const pickFreeLane = (entities: ActiveEntity[]): Lane => {
  const free = freeLanes(entities);
  if (free.length === 0) return 1;
  return free[Math.floor(Math.random() * free.length)]!;
};

export interface SpawnPlan {
  /** ms until next spawn */
  interval: number;
}

export const spawnerStep = (
  entities: ActiveEntity[],
  distance: number,
  baseIntervalMs: number,
): { entities: ActiveEntity[]; nextIntervalMs: number } => {
  // difficulty scaling: faster spawns after 1000m
  const speedup = Math.max(0.5, 1 - distance / 5000);
  const intervalMs = baseIntervalMs * speedup;

  // 35% chance pickup, 65% obstacle
  const isPickup = Math.random() < 0.35;
  const lane = pickFreeLane(entities);
  const id = generateId(isPickup ? 'pickup' : 'obstacle');
  const x = 1200 + Math.random() * 200; // off-screen right

  const entity: ActiveEntity = {
    id,
    kind: isPickup ? 'pickup' : 'obstacle',
    lane,
    x,
    type: isPickup ? pickPickup().type : pickObstacle().type,
  };

  return {
    entities: [...entities, entity],
    nextIntervalMs: intervalMs,
  };
};