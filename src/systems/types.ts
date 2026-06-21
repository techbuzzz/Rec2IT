/**
 * Game state types.
 */

import type { RoleId } from '@/data/roles';
import type { ObstacleType } from '@/data/obstacles';
import type { PickupType } from '@/data/pickups';
import type { QTE, QTEResult } from '@/data/qtes';

export type RunScene = 'menu' | 'briefing' | 'run' | 'qte' | 'end';

export type Lane = 0 | 1 | 2;

export interface ActiveEntity {
  id: string;
  kind: 'obstacle' | 'pickup';
  lane: Lane;
  x: number;
  type: ObstacleType | PickupType;
}

export interface RunStats {
  perfect: number;
  ok: number;
  fail: number;
  qtePerfect: number;
  qteOk: number;
  qteFail: number;
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
  /** список QTE-результатов для replay/debug */
  qteHistory: QTEResult[];
}

export interface QTEActiveState {
  qte: QTE;
  startedAtMs: number;
  /** последний QTE-результат (если был) */
  lastResult: QTEResult | null;
  /** дистанция на которой триггернулся (для UI) */
  triggerDistance: number;
}