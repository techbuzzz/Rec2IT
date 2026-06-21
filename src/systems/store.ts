/**
 * Zustand store — единый state для Pixi Canvas + React HTML.
 * Phase 1: core loop без QTE (QTE появится в Phase 2 как modal).
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { RunScene, Lane, ActiveEntity, RunStats, EndScreenData } from './types';
import type { RoleId } from '@/data/roles';
import { getRole } from '@/data/roles';

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
  distance: number; // meters
  score: number;
  lives: number;
  combo: number;
  comboMultiplier: number;
  comboFreezeUntilMs: number;
  speed: number; // px/sec

  // Entities
  entities: ActiveEntity[];

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

  // Player actions
  moveLeft: () => void;
  moveRight: () => void;
  jump: () => void;
  slide: () => void;

  // World ticks
  tickDistance: (deltaMs: number) => void;
  addScore: (points: number) => void;
  collectPickup: (entityId: string) => void;
  hitObstacle: (entityId: string) => void;

  // Entities
  spawnEntity: (entity: ActiveEntity) => void;
  pruneEntities: (cutoffX: number) => void;
}

const initialStats: RunStats = {
  perfect: 0,
  ok: 0,
  fail: 0,
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
        stats: { ...initialStats },
        endData: null,
      });
    },

    endRun: () => {
      const { roleId, score, distance, stats } = get();
      if (!roleId) return;
      set({
        scene: 'end',
        isRunning: false,
        endData: {
          score,
          distance,
          durationMs: (distance / get().speed) * 1000,
          roleId,
          endingId: getRole(roleId).defaultEndingId,
          stats: { ...stats },
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
        stats: { ...initialStats },
        endData: null,
      }),

    pause: () => set({ isPaused: true }),
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
      if (!s.isRunning || s.isPaused) return;
      const meters = (s.speed * deltaMs) / 1000 / 50; // 50px = 1 meter
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
      const pickupConfig = s.entities; // already pruned
      void pickupConfig;

      set({
        entities: s.entities.filter((e) => e.id !== entityId),
      });
      get().addScore(15);
    },

    hitObstacle: (entityId) => {
      const s = get();
      const entity = s.entities.find((e) => e.id === entityId);
      if (!entity || entity.kind !== 'obstacle') return;

      // jump/slide immunity
      if (s.isJumping || s.isSliding) {
        set({
          entities: s.entities.filter((e) => e.id !== entityId),
        });
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
      set((s) => ({
        entities: s.entities.filter((e) => e.x > cutoffX),
      })),
  })),
);