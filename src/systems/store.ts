/**
 * Zustand store — единый state для Pixi Canvas + React HTML.
 * Phase 2: добавлен QTE-стейт + триггер каждые QTE_INTERVAL_M метров.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { RunScene, Lane, ActiveEntity, RunStats, EndScreenData, QTEActiveState } from './types';
import type { RoleId } from '@/data/roles';
import { getRole } from '@/data/roles';
import { QTE_INTERVAL_M, evaluateQTE, type QTE, type QTEResult } from '@/data/qtes';

interface GameStore {
  scene: RunScene;

  // Run state
  roleId: RoleId | null;
  isRunning: boolean;
  isPaused: boolean;

  // Player
  lane: Lane;
  isJumping: boolean;
  isSliding: boolean;
  jumpUntilMs: number;
  slideUntilMs: number;

  // World
  distance: number;
  score: number;
  lives: number;
  combo: number;
  comboMultiplier: number;
  comboFreezeUntilMs: number;
  speed: number;

  // Entities
  entities: ActiveEntity[];

  // QTE
  qte: QTEActiveState | null;
  nextQteDistance: number;

  // Stats
  stats: RunStats;

  // End
  endData: EndScreenData | null;

  // Actions
  startRun: (roleId: RoleId) => void;
  endRun: () => void;
  reset: () => void;
  pause: () => void;
  resume: () => void;

  // Player
  moveLeft: () => void;
  moveRight: () => void;
  jump: () => void;
  slide: () => void;

  // World
  tickDistance: (deltaMs: number) => void;
  addScore: (points: number) => void;
  collectPickup: (entityId: string) => void;
  hitObstacle: (entityId: string) => void;

  // Entities
  spawnEntity: (entity: ActiveEntity) => void;
  pruneEntities: (cutoffX: number) => void;

  // QTE
  triggerQTE: (qte: QTE) => void;
  resolveQTE: (result: QTEResult) => void;
  skipQTE: () => void;
}

const initialStats: RunStats = {
  perfect: 0,
  ok: 0,
  fail: 0,
  qtePerfect: 0,
  qteOk: 0,
  qteFail: 0,
  pickupsCollected: 0,
  obstaclesHit: 0,
  maxCombo: 0,
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    scene: 'menu',
    roleId: null,
    isRunning: false,
    isPaused: false,

    lane: 1,
    isJumping: false,
    isSliding: false,
    jumpUntilMs: 0,
    slideUntilMs: 0,

    distance: 0,
    score: 0,
    lives: 3,
    combo: 0,
    comboMultiplier: 1.0,
    comboFreezeUntilMs: 0,
    speed: 280,

    entities: [],
    qte: null,
    nextQteDistance: QTE_INTERVAL_M,
    stats: { ...initialStats },
    endData: null,

    startRun: (roleId) => {
      const role = getRole(roleId);
      set({
        scene: 'briefing',
        roleId,
        isRunning: false,
        isPaused: false,
        lane: 1,
        isJumping: false,
        isSliding: false,
        jumpUntilMs: 0,
        slideUntilMs: 0,
        distance: 0,
        score: 0,
        lives: role.startingLives,
        combo: 0,
        comboMultiplier: 1.0,
        comboFreezeUntilMs: 0,
        speed: role.baseSpeed,
        entities: [],
        qte: null,
        nextQteDistance: QTE_INTERVAL_M,
        stats: { ...initialStats },
        endData: null,
      });
    },

    endRun: () => {
      const { roleId, score, distance, stats, qte } = get();
      if (!roleId) return;
      const lastResult = qte?.lastResult ?? null;
      set({
        scene: 'end',
        isRunning: false,
        isPaused: false,
        endData: {
          score,
          distance,
          durationMs: (distance / Math.max(1, get().speed)) * 1000,
          roleId,
          endingId: getRole(roleId).defaultEndingId,
          stats: { ...stats },
          qteHistory: lastResult ? [lastResult] : [],
        },
      });
    },

    reset: () =>
      set({
        scene: 'menu',
        roleId: null,
        isRunning: false,
        isPaused: false,
        lane: 1,
        isJumping: false,
        isSliding: false,
        jumpUntilMs: 0,
        slideUntilMs: 0,
        distance: 0,
        score: 0,
        lives: 3,
        combo: 0,
        comboMultiplier: 1.0,
        comboFreezeUntilMs: 0,
        speed: 280,
        entities: [],
        qte: null,
        nextQteDistance: QTE_INTERVAL_M,
        stats: { ...initialStats },
        endData: null,
      }),

    pause: () => {
      if (get().isRunning && !get().qte) set({ isPaused: true });
    },
    resume: () => set({ isPaused: false }),

    moveLeft: () => set((s) => ({ lane: Math.max(0, s.lane - 1) as Lane })),
    moveRight: () => set((s) => ({ lane: Math.min(2, s.lane + 1) as Lane })),

    jump: () => {
      const now = performance.now();
      set({ isJumping: true, jumpUntilMs: now + 700 });
      setTimeout(() => {
        if (performance.now() >= get().jumpUntilMs) {
          set({ isJumping: false });
        }
      }, 720);
    },

    slide: () => {
      const now = performance.now();
      set({ isSliding: true, slideUntilMs: now + 600 });
      setTimeout(() => {
        if (performance.now() >= get().slideUntilMs) {
          set({ isSliding: false });
        }
      }, 620);
    },

    tickDistance: (deltaMs) => {
      const s = get();
      if (!s.isRunning || s.isPaused || s.qte) return;
      const meters = (s.speed * deltaMs) / 1000 / 50;
      set({ distance: s.distance + meters });
    },

    addScore: (points) => {
      const s = get();
      if (!s.isRunning) return;
      const mult = s.comboMultiplier;
      const earned = Math.round(points * mult);
      const newCombo = s.combo + 1;
      const role = s.roleId ? getRole(s.roleId) : null;
      const cap = role?.maxComboMultiplier ?? 3.0;
      const newMult = Math.min(cap, 1 + Math.floor(newCombo / 5) * 0.5);
      set({
        score: s.score + earned,
        combo: newCombo,
        comboMultiplier: newMult,
        stats: { ...s.stats, maxCombo: Math.max(s.stats.maxCombo, newCombo) },
      });
    },

    collectPickup: (entityId) => {
      const s = get();
      const entity = s.entities.find((e) => e.id === entityId);
      if (!entity || entity.kind !== 'pickup') return;
      set({
        entities: s.entities.filter((e) => e.id !== entityId),
        stats: { ...s.stats, pickupsCollected: s.stats.pickupsCollected + 1 },
      });
      get().addScore(15);
    },

    hitObstacle: (entityId) => {
      const s = get();
      const entity = s.entities.find((e) => e.id === entityId);
      if (!entity || entity.kind !== 'obstacle') return;

      if (s.isJumping || s.isSliding) {
        set({ entities: s.entities.filter((e) => e.id !== entityId) });
        return;
      }

      set({
        entities: s.entities.filter((e) => e.id !== entityId),
        lives: s.lives - 1,
        combo: 0,
        comboMultiplier: 1.0,
        stats: { ...s.stats, obstaclesHit: s.stats.obstaclesHit + 1, fail: s.stats.fail + 1 },
      });

      if (get().lives <= 0) {
        get().endRun();
      }
    },

    spawnEntity: (entity) => set((s) => ({ entities: [...s.entities, entity] })),
    pruneEntities: (cutoffX) =>
      set((s) => ({ entities: s.entities.filter((e) => e.x > cutoffX) })),

    triggerQTE: (qte) => {
      const s = get();
      if (!s.isRunning || s.qte) return;
      set({
        qte: {
          qte,
          startedAtMs: performance.now(),
          lastResult: null,
          triggerDistance: s.distance,
        },
        scene: 'qte',
        isPaused: true,
      });
    },

    resolveQTE: (result) => {
      const s = get();
      if (!s.qte) return;
      const stats = { ...s.stats };
      if (result.outcome === 'perfect') {
        stats.qtePerfect += 1;
        stats.perfect += 1;
      } else if (result.outcome === 'ok') {
        stats.qteOk += 1;
        stats.ok += 1;
      } else {
        stats.qteFail += 1;
        stats.fail += 1;
      }
      // combo: только perfect/ok увеличивают, fail сбрасывает
      const newCombo = result.outcome === 'fail' ? 0 : s.combo + 1;
      const role = s.roleId ? getRole(s.roleId) : null;
      const cap = role?.maxComboMultiplier ?? 3.0;
      const newMult = Math.min(
        cap,
        result.outcome === 'fail' ? 1.0 : 1 + Math.floor(newCombo / 5) * 0.5,
      );
      set({
        score: s.score + result.scoreDelta,
        combo: newCombo,
        comboMultiplier: newMult,
        stats,
        qte: { ...s.qte, lastResult: result },
      });
    },

    skipQTE: () => {
      const s = get();
      if (!s.qte) return;
      // при exit через ESC считаем fail
      const result = evaluateQTE(
        s.qte.qte,
        { kind: 'timeout' },
        performance.now() - s.qte.startedAtMs,
      );
      get().resolveQTE(result);
      set({
        qte: null,
        scene: 'run',
        isPaused: false,
        nextQteDistance: s.distance + QTE_INTERVAL_M,
      });
    },
  })),
);