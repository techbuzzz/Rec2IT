/**
 * Game state types.
 * Один файл — единый источник правды для Canvas/HTML слоёв.
 */

import type { RoleId } from '@/data/roles';
import type { ObstacleType } from '@/data/obstacles';
import type { PickupType } from '@/data/pickups';

export type RunScene = 'menu' | 'briefing' | 'run' | 'qte' | 'end';

export type Lane = 0 | 1 | 2;

export interface ActiveEntity {
  id: string;
  kind: 'obstacle' | 'pickup';
  lane: Lane;
  /** world position from spawn (px) */
  x: number;
  /** тип из data/obstacles или data/pickups */
  type: ObstacleType | PickupType;
}

export interface RunStats {
  perfect: number;
  ok: number;
  fail: number;
  pickupsCollected: number;
  obstaclesHit: number;
  maxCombo: number;
}

export interface EndScreenData {
  score: number;
  distance: number;
  durationMs: number;
  roleId: RoleId;
  endingId: string;
  stats: RunStats;
}