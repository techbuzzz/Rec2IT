/**
 * LocalStorage helpers — high scores per role.
 */

import type { RoleId } from '@/data/roles';

const KEY_PREFIX = 'jobrun.highscore.';

export const getHighScore = (roleId: RoleId): number => {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + roleId);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
};

export const setHighScore = (roleId: RoleId, score: number): boolean => {
  try {
    const prev = getHighScore(roleId);
    if (score <= prev) return false;
    localStorage.setItem(KEY_PREFIX + roleId, String(score));
    return true;
  } catch {
    return false;
  }
};

export const getAllHighScores = (): Record<RoleId, number> => {
  return {
    'junior-frontend': getHighScore('junior-frontend'),
    'middle-backend': getHighScore('middle-backend'),
    'senior-fullstack': getHighScore('senior-fullstack'),
  };
};