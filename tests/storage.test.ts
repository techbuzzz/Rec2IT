/**
 * Tests for storage.ts — localStorage high-score helpers.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { localStorageMock.store[key] = val; }),
};

vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => {
  localStorageMock.store = {};
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
});

describe('getHighScore', () => {
  it('returns 0 when no key exists', async () => {
    const { getHighScore } = await import('@/systems/storage');
    expect(getHighScore('junior-frontend')).toBe(0);
  });

  it('returns parsed number when key exists', async () => {
    localStorageMock.store['jobrun.highscore.junior-frontend'] = '1234';
    const { getHighScore } = await import('@/systems/storage');
    expect(getHighScore('junior-frontend')).toBe(1234);
  });

  it('returns 0 on malformed value', async () => {
    localStorageMock.store['jobrun.highscore.junior-frontend'] = 'notanumber';
    const { getHighScore } = await import('@/systems/storage');
    expect(getHighScore('junior-frontend')).toBe(0);
  });

  it('handles getItem throwing', async () => {
    localStorageMock.getItem.mockImplementationOnce(() => { throw new Error('quota exceeded'); });
    const { getHighScore } = await import('@/systems/storage');
    expect(getHighScore('junior-frontend')).toBe(0);
  });
});

describe('setHighScore', () => {
  it('returns false when score is lower than existing', async () => {
    localStorageMock.store['jobrun.highscore.junior-frontend'] = '500';
    const { setHighScore } = await import('@/systems/storage');
    expect(setHighScore('junior-frontend', 300)).toBe(false);
  });

  it('returns false when score equals existing', async () => {
    localStorageMock.store['jobrun.highscore.junior-frontend'] = '500';
    const { setHighScore } = await import('@/systems/storage');
    expect(setHighScore('junior-frontend', 500)).toBe(false);
  });

  it('updates and returns true when new high score', async () => {
    const { setHighScore, getHighScore } = await import('@/systems/storage');
    const result = setHighScore('junior-frontend', 750);
    expect(result).toBe(true);
    expect(getHighScore('junior-frontend')).toBe(750);
  });

  it('handles setItem throwing', async () => {
    localStorageMock.setItem.mockImplementationOnce(() => { throw new Error('quota exceeded'); });
    const { setHighScore } = await import('@/systems/storage');
    expect(setHighScore('junior-frontend', 100)).toBe(false);
  });
});

describe('getAllHighScores', () => {
  it('returns record with 0 for all roles when empty', async () => {
    const { getAllHighScores } = await import('@/systems/storage');
    const scores = getAllHighScores();
    expect(Object.keys(scores).length).toBeGreaterThan(0);
    expect(Object.values(scores).every((v) => v === 0)).toBe(true);
  });

  it('populates scores for roles with stored values', async () => {
    const { setHighScore, getAllHighScores } = await import('@/systems/storage');
    setHighScore('senior-fullstack', 2000);
    const scores = getAllHighScores();
    expect(scores['senior-fullstack']).toBe(2000);
  });
});
