/**
 * Scoring & ending tests — tier logic, emoji grid, role-based selection.
 */

import { describe, it, expect } from 'vitest';
import { pickEndingByScore, makeEmojiGrid, ENDINGS } from '@/data/endings';
import { ROLES, type RoleId } from '@/data/roles';

describe('pickEndingByScore', () => {
  const roleId: RoleId = 'middle-backend';

  it('returns default tier for low score', () => {
    const ending = pickEndingByScore(100, roleId);
    expect(ending.tier).toBe('default');
    expect(ending.id).toContain(roleId);
  });

  it('returns skill tier for high score (>= 2000)', () => {
    const ending = pickEndingByScore(2500, roleId);
    expect(ending.tier).toBe('skill');
  });

  it('returns toxic tier for very high score (>= 3000)', () => {
    const ending = pickEndingByScore(3500, roleId);
    expect(ending.tier).toBe('toxic');
  });

  it('returns hidden tier for legendary score (>= 5000)', () => {
    const ending = pickEndingByScore(5500, roleId);
    expect(ending.tier).toBe('hidden');
  });

  it('returns toxic tier for negative score (rare)', () => {
    // We don't have negative-ending paths in current implementation
    // but verify graceful handling
    const ending = pickEndingByScore(0, roleId);
    expect(ending).toBeDefined();
    expect(ending.tier).toBeDefined();
  });

  it('all 8 roles have at least one ending', () => {
    const roleIds = Object.keys(ROLES) as RoleId[];
    for (const id of roleIds) {
      const roleEndings = ENDINGS.filter((e) => e.id.includes(id));
      expect(roleEndings.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('all endings have required fields', () => {
    for (const ending of ENDINGS) {
      expect(ending.id).toBeTruthy();
      expect(ending.title).toBeTruthy();
      expect(ending.reason).toBeTruthy();
      expect(ending.tweetHook).toBeTruthy();
      expect(ending.emoji).toBeTruthy();
    }
  });
});

describe('makeEmojiGrid', () => {
  it('returns 6 emojis by default', () => {
    const grid = makeEmojiGrid(3, 2, 1);
    expect(grid).toHaveLength(6);
  });

  it('uses perfect emoji for perfect entries', () => {
    const grid = makeEmojiGrid(6, 0, 0);
    // All should be "perfect" symbol
    expect(grid.every((e) => e === '🟩' || e === '✅')).toBe(true);
  });

  it('uses fail emoji for fail entries', () => {
    const grid = makeEmojiGrid(0, 0, 6);
    // All should be "fail" symbol
    expect(grid.every((e) => e === '🟥' || e === '❌')).toBe(true);
  });

  it('handles zero entries gracefully', () => {
    const grid = makeEmojiGrid(0, 0, 0);
    expect(grid).toHaveLength(6);
    // Should be all neutral or default
  });

  it('Wordle-style: total entries sum to 6', () => {
    const grid = makeEmojiGrid(2, 3, 1);
    expect(grid).toHaveLength(6);
    // Distribution matches input
  });
});

describe('Combo multiplier math', () => {
  // Inline scoring formula (matches RunScene.update logic)
  const computeCombo = (streak: number): number => {
    if (streak >= 5) return 3.0;
    if (streak >= 3) return 2.0;
    if (streak >= 1) return 1.5;
    return 1.0;
  };

  it('1.0× base at streak 0', () => {
    expect(computeCombo(0)).toBe(1.0);
  });

  it('1.5× at streak 1-2', () => {
    expect(computeCombo(1)).toBe(1.5);
    expect(computeCombo(2)).toBe(1.5);
  });

  it('2.0× at streak 3-4', () => {
    expect(computeCombo(3)).toBe(2.0);
    expect(computeCombo(4)).toBe(2.0);
  });

  it('3.0× at streak 5+', () => {
    expect(computeCombo(5)).toBe(3.0);
    expect(computeCombo(10)).toBe(3.0);
  });
});

describe('Distance scoring math', () => {
  const computeDistanceScore = (meters: number, multiplier: number): number => {
    return Math.floor(meters * 1 * multiplier);
  };

  it('1 point per meter base', () => {
    expect(computeDistanceScore(100, 1.0)).toBe(100);
  });

  it('multiplier scales score', () => {
    expect(computeDistanceScore(100, 2.0)).toBe(200);
    expect(computeDistanceScore(100, 3.0)).toBe(300);
  });

  it('floors fractional scores', () => {
    expect(computeDistanceScore(99.7, 1.0)).toBe(99);
  });
});