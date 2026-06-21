/**
 * Unit tests for Zustand game store.
 * Tests all actions, state transitions, QTE flow, and scoring logic.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '@/systems/store';
import { ROLES } from '@/data/roles';
import { QTE_INTERVAL_M } from '@/data/qtes';
import type { Lane, ActiveEntity } from '@/systems/types';

// helpers ---------------------------------------------------------------------

function makeObstacle(id: string, lane: Lane): ActiveEntity {
  return { id, kind: 'obstacle', type: 'redFlag', lane, x: 200, y: 0 };
}

function makePickup(id: string, lane: Lane): ActiveEntity {
  return { id, kind: 'pickup', type: 'coffee', lane, x: 200, y: 0 };
}

// mock performance.now() and setTimeout globally for all tests
let perfOffset = 0;
let timers: Array<{ fn: () => void; ms: number }> = [];

vi.stubGlobal('performance', {
  now: () => 1000 + perfOffset,
});

beforeEach(() => {
  timers = [];
  perfOffset = 0;
  vi.useFakeTimers({ shouldAdvanceTime: false });
  // Intercept setTimeout to capture for manual advance
  vi.spyOn(global, 'setTimeout').mockImplementation((fn: () => void, ms?: number) => {
    const id = Symbol();
    timers.push({ fn, ms: ms ?? 0 });
    return id as unknown as ReturnType<typeof setTimeout>;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// teardown between tests -------------------------------------------------------
beforeEach(() => useGameStore.getState().reset());

// initial state ----------------------------------------------------------------
describe('initial state', () => {
  it('starts on menu scene', () => {
    const s = useGameStore.getState();
    expect(s.scene).toBe('menu');
    expect(s.isRunning).toBe(false);
    expect(s.isPaused).toBe(false);
  });

  it('has 3 lives by default', () => {
    expect(useGameStore.getState().lives).toBe(3);
  });

  it('has empty entities and no active QTE', () => {
    const s = useGameStore.getState();
    expect(s.entities).toEqual([]);
    expect(s.qte).toBeNull();
  });

  it('stats start at zero', () => {
    const s = useGameStore.getState().stats;
    expect(s.perfect).toBe(0);
    expect(s.ok).toBe(0);
    expect(s.fail).toBe(0);
    expect(s.qtePerfect).toBe(0);
    expect(s.qteOk).toBe(0);
    expect(s.qteFail).toBe(0);
    expect(s.pickupsCollected).toBe(0);
    expect(s.obstaclesHit).toBe(0);
    expect(s.maxCombo).toBe(0);
  });
});

// startRun --------------------------------------------------------------------
describe('startRun', () => {
  it('sets scene to briefing', () => {
    useGameStore.getState().startRun('junior-frontend');
    expect(useGameStore.getState().scene).toBe('briefing');
  });

  it('sets roleId', () => {
    useGameStore.getState().startRun('senior-fullstack');
    expect(useGameStore.getState().roleId).toBe('senior-fullstack');
  });

  it('resets distance, score, combo', () => {
    useGameStore.getState().startRun('junior-frontend');
    const s = useGameStore.getState();
    expect(s.distance).toBe(0);
    expect(s.score).toBe(0);
    expect(s.combo).toBe(0);
    expect(s.comboMultiplier).toBe(1.0);
  });

  it('sets lives from role config', () => {
    useGameStore.getState().startRun('junior-frontend');
    expect(useGameStore.getState().lives).toBe(ROLES['junior-frontend'].startingLives);
    useGameStore.getState().reset();
    useGameStore.getState().startRun('senior-fullstack');
    expect(useGameStore.getState().lives).toBe(ROLES['senior-fullstack'].startingLives);
  });

  it('sets speed from role config', () => {
    useGameStore.getState().startRun('senior-fullstack');
    expect(useGameStore.getState().speed).toBe(ROLES['senior-fullstack'].baseSpeed);
  });

  it('resets stats', () => {
    useGameStore.getState().addScore(100); // non-running — won't work
    useGameStore.getState().startRun('junior-frontend');
    const s = useGameStore.getState().stats;
    expect(s.pickupsCollected).toBe(0);
    expect(s.obstaclesHit).toBe(0);
    expect(s.maxCombo).toBe(0);
  });

  it('nextQteDistance starts at QTE_INTERVAL_M', () => {
    useGameStore.getState().startRun('junior-frontend');
    expect(useGameStore.getState().nextQteDistance).toBe(QTE_INTERVAL_M);
  });

  it('shows modifiers screen', () => {
    useGameStore.getState().startRun('junior-frontend');
    expect(useGameStore.getState().showModifiers).toBe(true);
  });

  it('sets isRunning=false (briefing phase)', () => {
    useGameStore.getState().startRun('junior-frontend');
    expect(useGameStore.getState().isRunning).toBe(false);
  });
});

// reset -----------------------------------------------------------------------
describe('reset', () => {
  it('returns to menu', () => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.getState().reset();
    expect(useGameStore.getState().scene).toBe('menu');
  });

  it('clears roleId', () => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.getState().reset();
    expect(useGameStore.getState().roleId).toBeNull();
  });

  it('resets all score fields', () => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.getState().reset();
    const s = useGameStore.getState();
    expect(s.score).toBe(0);
    expect(s.distance).toBe(0);
    expect(s.combo).toBe(0);
    expect(s.lives).toBe(3);
  });
});

// pause / resume --------------------------------------------------------------
describe('pause', () => {
  it('does nothing when not running', () => {
    useGameStore.getState().pause();
    expect(useGameStore.getState().isPaused).toBe(false);
  });

  it('does nothing when QTE is active', () => {
    useGameStore.getState().startRun('junior-frontend');
    // Simulate isRunning manually for this edge case test
    useGameStore.setState({ isRunning: true, qte: { qte: null as any, startedAtMs: 0, lastResult: null, triggerDistance: 0 } });
    useGameStore.getState().pause();
    expect(useGameStore.getState().isPaused).toBe(false);
  });
});

describe('resume', () => {
  it('resumes from paused', () => {
    useGameStore.setState({ isPaused: true });
    useGameStore.getState().resume();
    expect(useGameStore.getState().isPaused).toBe(false);
  });
});

// lane movement ----------------------------------------------------------------
describe('lane movement', () => {
  beforeEach(() => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.setState({ isRunning: true });
  });

  it('moveLeft: lane decreases', () => {
    useGameStore.setState({ lane: 1 });
    useGameStore.getState().moveLeft();
    expect(useGameStore.getState().lane).toBe(0);
  });

  it('moveLeft: does not go below 0', () => {
    useGameStore.setState({ lane: 0 });
    useGameStore.getState().moveLeft();
    expect(useGameStore.getState().lane).toBe(0);
  });

  it('moveRight: lane increases', () => {
    useGameStore.setState({ lane: 1 });
    useGameStore.getState().moveRight();
    expect(useGameStore.getState().lane).toBe(2);
  });

  it('moveRight: does not go above 2', () => {
    useGameStore.setState({ lane: 2 });
    useGameStore.getState().moveRight();
    expect(useGameStore.getState().lane).toBe(2);
  });
});

// jump / slide ----------------------------------------------------------------
describe('jump', () => {
  beforeEach(() => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.setState({ isRunning: true });
  });

  it('sets isJumping=true', () => {
    useGameStore.getState().jump();
    expect(useGameStore.getState().isJumping).toBe(true);
  });

  it('sets jumpUntilMs in the future', () => {
    useGameStore.getState().jump();
    expect(useGameStore.getState().jumpUntilMs).toBeGreaterThan(performance.now());
  });
});

describe('slide', () => {
  beforeEach(() => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.setState({ isRunning: true });
  });

  it('sets isSliding=true', () => {
    useGameStore.getState().slide();
    expect(useGameStore.getState().isSliding).toBe(true);
  });

  it('sets slideUntilMs in the future', () => {
    useGameStore.getState().slide();
    expect(useGameStore.getState().slideUntilMs).toBeGreaterThan(performance.now());
  });
});

// tickDistance ----------------------------------------------------------------
describe('tickDistance', () => {
  beforeEach(() => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.setState({ isRunning: true });
  });

  it('adds distance based on speed', () => {
    useGameStore.setState({ speed: 280 });
    useGameStore.getState().tickDistance(1000);
    // speed 280, deltaMs 1000, divide by 50 → 5.6m
    expect(useGameStore.getState().distance).toBeCloseTo(5.6, 1);
  });

  it('does nothing when paused', () => {
    useGameStore.setState({ isPaused: true, distance: 0 });
    useGameStore.getState().tickDistance(1000);
    expect(useGameStore.getState().distance).toBe(0);
  });

  it('does nothing when not running', () => {
    useGameStore.setState({ isRunning: false, distance: 0 });
    useGameStore.getState().tickDistance(1000);
    expect(useGameStore.getState().distance).toBe(0);
  });

  it('does nothing when QTE is active', () => {
    useGameStore.setState({ qte: { qte: null as any, startedAtMs: 0, lastResult: null, triggerDistance: 0 } });
    useGameStore.getState().tickDistance(1000);
    expect(useGameStore.getState().distance).toBe(0);
  });
});

// addScore --------------------------------------------------------------------
describe('addScore', () => {
  beforeEach(() => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.setState({ isRunning: true });
  });

  it('adds points when running', () => {
    useGameStore.setState({ score: 0, combo: 0, comboMultiplier: 1.0 });
    useGameStore.getState().addScore(100);
    expect(useGameStore.getState().score).toBe(100);
  });

  it('respects combo multiplier', () => {
    useGameStore.setState({ score: 0, combo: 4, comboMultiplier: 1.5 });
    useGameStore.getState().addScore(100);
    expect(useGameStore.getState().score).toBe(150);
  });

  it('does nothing when not running', () => {
    useGameStore.setState({ isRunning: false, score: 0 });
    useGameStore.getState().addScore(100);
    expect(useGameStore.getState().score).toBe(0);
  });

  it('caps combo multiplier at role max', () => {
    useGameStore.setState({ combo: 10, comboMultiplier: 5.0, score: 0 });
    useGameStore.getState().addScore(100);
    // senior maxComboMultiplier is 3.0, floor(10/5)*0.5 = 1+1 = 2 → 2.0 capped at 3.0
    // but combo 10 → 1+floor(10/5)*0.5 = 1+2 = 3.0, capped at role cap
    expect(useGameStore.getState().comboMultiplier).toBeLessThanOrEqual(3.0);
  });

  it('increments combo', () => {
    useGameStore.setState({ combo: 2 });
    useGameStore.getState().addScore(50);
    expect(useGameStore.getState().combo).toBe(3);
  });

  it('tracks maxCombo in stats', () => {
    useGameStore.setState({ combo: 0, stats: { ...useGameStore.getState().stats, maxCombo: 0 } });
    useGameStore.getState().addScore(50);
    expect(useGameStore.getState().stats.maxCombo).toBe(1);
  });
});

// collectPickup ---------------------------------------------------------------
describe('collectPickup', () => {
  beforeEach(() => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.setState({ isRunning: true });
  });

  it('removes entity from list', () => {
    useGameStore.setState({ entities: [makePickup('p1', 1)] });
    useGameStore.getState().collectPickup('p1');
    expect(useGameStore.getState().entities.find((e) => e.id === 'p1')).toBeUndefined();
  });

  it('increments pickupsCollected stat', () => {
    useGameStore.setState({ entities: [makePickup('p1', 1)] });
    useGameStore.getState().collectPickup('p1');
    expect(useGameStore.getState().stats.pickupsCollected).toBe(1);
  });

  it('calls addScore', () => {
    useGameStore.setState({ entities: [makePickup('p1', 1)], score: 0 });
    useGameStore.getState().collectPickup('p1');
    expect(useGameStore.getState().score).toBeGreaterThan(0);
  });

  it('ignores obstacles', () => {
    useGameStore.setState({ entities: [makeObstacle('o1', 1)] });
    useGameStore.getState().collectPickup('o1');
    expect(useGameStore.getState().entities).toHaveLength(1);
  });

  it('ignores unknown id', () => {
    useGameStore.setState({ entities: [makePickup('p1', 1)] });
    useGameStore.getState().collectPickup('nonexistent');
    expect(useGameStore.getState().entities).toHaveLength(1);
  });
});

// hitObstacle -----------------------------------------------------------------
describe('hitObstacle', () => {
  beforeEach(() => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.setState({ isRunning: true, lives: 3, combo: 5, comboMultiplier: 2.0 });
  });

  it('removes obstacle from list', () => {
    useGameStore.setState({ entities: [makeObstacle('o1', 1)] });
    useGameStore.getState().hitObstacle('o1');
    expect(useGameStore.getState().entities).toHaveLength(0);
  });

  it('decrements lives', () => {
    useGameStore.setState({ entities: [makeObstacle('o1', 1)] });
    useGameStore.getState().hitObstacle('o1');
    expect(useGameStore.getState().lives).toBe(2);
  });

  it('resets combo on hit', () => {
    useGameStore.setState({ entities: [makeObstacle('o1', 1)], combo: 5, comboMultiplier: 2.0 });
    useGameStore.getState().hitObstacle('o1');
    expect(useGameStore.getState().combo).toBe(0);
    expect(useGameStore.getState().comboMultiplier).toBe(1.0);
  });

  it('increments obstaclesHit and fail stats', () => {
    useGameStore.setState({ entities: [makeObstacle('o1', 1)] });
    useGameStore.getState().hitObstacle('o1');
    expect(useGameStore.getState().stats.obstaclesHit).toBe(1);
    expect(useGameStore.getState().stats.fail).toBe(1);
  });

  it('jump avoids obstacle (no life loss)', () => {
    useGameStore.setState({ isJumping: true, lives: 3, entities: [makeObstacle('o1', 1)] });
    useGameStore.getState().hitObstacle('o1');
    expect(useGameStore.getState().lives).toBe(3);
  });

  it('slide avoids obstacle (no life loss)', () => {
    useGameStore.setState({ isSliding: true, lives: 3, entities: [makeObstacle('o1', 1)] });
    useGameStore.getState().hitObstacle('o1');
    expect(useGameStore.getState().lives).toBe(3);
  });

  it('endRun when lives reach 0', () => {
    useGameStore.setState({ lives: 1, entities: [makeObstacle('o1', 1)] });
    useGameStore.getState().hitObstacle('o1');
    expect(useGameStore.getState().scene).toBe('end');
  });

  it('ignores pickups', () => {
    useGameStore.setState({ entities: [makePickup('p1', 1)] });
    useGameStore.getState().hitObstacle('p1');
    expect(useGameStore.getState().lives).toBe(3);
  });
});

// entity management ------------------------------------------------------------
describe('spawnEntity / pruneEntities', () => {
  it('spawnEntity adds entity', () => {
    useGameStore.getState().spawnEntity(makeObstacle('o1', 1));
    expect(useGameStore.getState().entities).toHaveLength(1);
  });

  it('spawnEntity preserves existing', () => {
    useGameStore.getState().spawnEntity(makeObstacle('o1', 1));
    useGameStore.getState().spawnEntity(makePickup('p1', 0));
    expect(useGameStore.getState().entities).toHaveLength(2);
  });

  it('pruneEntities removes entities left of cutoff', () => {
    useGameStore.setState({
      entities: [
        { ...makeObstacle('o1', 1), x: 50 },
        { ...makeObstacle('o2', 1), x: 200 },
      ],
    });
    useGameStore.getState().pruneEntities(100);
    expect(useGameStore.getState().entities.find((e) => e.id === 'o1')).toBeUndefined();
    expect(useGameStore.getState().entities.find((e) => e.id === 'o2')).toBeDefined();
  });
});

// QTE flow --------------------------------------------------------------------
describe('QTE — trigger / resolve / skip', () => {
  beforeEach(() => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.setState({ isRunning: true });
  });

  it('triggerQTE: sets qte state and pauses', () => {
    const mockQTE = {
      id: 'junior-css-center',
      type: 'spot-bug' as const,
      prompt: 'Find the bug',
      flavor: 'flavor',
      duration: 7000,
      perfectScore: 70,
      okScore: 35,
      failPenalty: -20,
      code: 'console.log("buggy")',
      bugRegions: [],
    };
    useGameStore.getState().triggerQTE(mockQTE as any);
    const s = useGameStore.getState();
    expect(s.qte).not.toBeNull();
    expect(s.qte!.qte).toBe(mockQTE);
    expect(s.scene).toBe('qte');
    expect(s.isPaused).toBe(true);
  });

  it('triggerQTE: does nothing when not running', () => {
    useGameStore.setState({ isRunning: false });
    const s = useGameStore.getState();
    const before = s.qte;
    useGameStore.getState().triggerQTE({ id: 'x', type: 'single-choice', prompt: '', options: [], duration: 5000, perfectScore: 50, okScore: 25, failPenalty: -10 } as any);
    expect(useGameStore.getState().qte).toBe(before);
  });

  it('triggerQTE: does nothing when QTE already active', () => {
    useGameStore.setState({ qte: { qte: null as any, startedAtMs: 0, lastResult: null, triggerDistance: 0 } });
    const before = useGameStore.getState().qte;
    useGameStore.getState().triggerQTE({ id: 'x', type: 'single-choice', prompt: '', options: [], duration: 5000, perfectScore: 50, okScore: 25, failPenalty: -10 } as any);
    expect(useGameStore.getState().qte).toBe(before);
  });

  it('resolveQTE: perfect updates stats and score', () => {
    useGameStore.setState({ score: 0, qte: { qte: null as any, startedAtMs: 0, lastResult: null, triggerDistance: 0 }, stats: { ...useGameStore.getState().stats, qtePerfect: 0, perfect: 0 } });
    useGameStore.getState().resolveQTE({ qteId: 'x', outcome: 'perfect', scoreDelta: 70 });
    const s = useGameStore.getState();
    expect(s.stats.qtePerfect).toBe(1);
    expect(s.stats.perfect).toBe(1);
    expect(s.score).toBe(70);
  });

  it('resolveQTE: ok updates stats', () => {
    useGameStore.setState({ score: 0, qte: { qte: null as any, startedAtMs: 0, lastResult: null, triggerDistance: 0 }, stats: { ...useGameStore.getState().stats, qteOk: 0, ok: 0 } });
    useGameStore.getState().resolveQTE({ qteId: 'x', outcome: 'ok', scoreDelta: 35 });
    const s = useGameStore.getState();
    expect(s.stats.qteOk).toBe(1);
    expect(s.stats.ok).toBe(1);
    expect(s.score).toBe(35);
  });

  it('resolveQTE: fail resets combo', () => {
    useGameStore.setState({ combo: 5, comboMultiplier: 2.0, qte: { qte: null as any, startedAtMs: 0, lastResult: null, triggerDistance: 0 }, stats: { ...useGameStore.getState().stats, qteFail: 0, fail: 0 } });
    useGameStore.getState().resolveQTE({ qteId: 'x', outcome: 'fail', scoreDelta: -20 });
    const s = useGameStore.getState();
    expect(s.combo).toBe(0);
    expect(s.comboMultiplier).toBe(1.0);
    expect(s.stats.qteFail).toBe(1);
  });

  it('resolveQTE: increments combo on perfect/ok', () => {
    useGameStore.setState({ combo: 2, qte: { qte: null as any, startedAtMs: 0, lastResult: null, triggerDistance: 0 }, stats: { ...useGameStore.getState().stats } });
    useGameStore.getState().resolveQTE({ qteId: 'x', outcome: 'perfect', scoreDelta: 70 });
    expect(useGameStore.getState().combo).toBe(3);
  });

  it('resolveQTE: does nothing when no active QTE', () => {
    useGameStore.setState({ qte: null, score: 100 });
    useGameStore.getState().resolveQTE({ qteId: 'x', outcome: 'perfect', scoreDelta: 70 });
    expect(useGameStore.getState().score).toBe(100);
  });

  it('skipQTE: treats as timeout fail', () => {
    const mockQTE = {
      id: 'junior-css-center',
      type: 'single-choice' as const,
      prompt: 'Test',
      options: [{ id: 'a', label: 'A', correct: false }],
      duration: 5000,
      perfectScore: 50,
      okScore: 25,
      failPenalty: -10,
    };
    useGameStore.setState({
      qte: { qte: mockQTE as any, startedAtMs: 0, lastResult: null, triggerDistance: 0 },
      stats: { ...useGameStore.getState().stats, qteFail: 0 },
      distance: 500,
    });
    useGameStore.getState().skipQTE();
    expect(useGameStore.getState().scene).toBe('run');
    expect(useGameStore.getState().isPaused).toBe(false);
    expect(useGameStore.getState().qte).toBeNull();
    expect(useGameStore.getState().stats.qteFail).toBe(1);
    expect(useGameStore.getState().nextQteDistance).toBe(500 + QTE_INTERVAL_M);
  });
});

// endRun ----------------------------------------------------------------------
describe('endRun', () => {
  it('sets scene to end', () => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.getState().endRun();
    expect(useGameStore.getState().scene).toBe('end');
  });

  it('populates endData', () => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.setState({ score: 500, distance: 300 });
    useGameStore.getState().endRun();
    const s = useGameStore.getState();
    expect(s.endData).not.toBeNull();
    expect(s.endData!.score).toBe(500);
    expect(s.endData!.distance).toBe(300);
    expect(s.endData!.roleId).toBe('junior-frontend');
  });

  it('does nothing without roleId', () => {
    useGameStore.getState().endRun();
    expect(useGameStore.getState().scene).toBe('menu');
  });
});

// modifiers -------------------------------------------------------------------
describe('applyModifiers', () => {
  beforeEach(() => {
    useGameStore.getState().startRun('junior-frontend');
    useGameStore.setState({ isRunning: true });
  });

  it('sets activeModifiers', () => {
    const mods = [{ id: 'test', name: 'Test', emoji: '🧪', flavor: 'f', effect: { kind: 'speed', value: 1.5 } }];
    useGameStore.getState().applyModifiers(mods as any);
    expect(useGameStore.getState().activeModifiers).toEqual(mods);
  });

  it('hides modifiers screen after apply', () => {
    useGameStore.setState({ showModifiers: true });
    useGameStore.getState().applyModifiers([]);
    expect(useGameStore.getState().showModifiers).toBe(false);
  });

  it('does nothing without roleId', () => {
    useGameStore.setState({ roleId: null });
    useGameStore.getState().applyModifiers([{ id: 'test', name: 'Test', emoji: '🧪', flavor: 'f', effect: { kind: 'speed', value: 1.5 } }] as any);
    expect(useGameStore.getState().activeModifiers).toEqual([]);
  });
});

describe('showModifiersScreen / hideModifiersScreen', () => {
  it('showModifiersScreen sets flag true', () => {
    useGameStore.getState().showModifiersScreen();
    expect(useGameStore.getState().showModifiers).toBe(true);
  });

  it('hideModifiersScreen sets flag false', () => {
    useGameStore.setState({ showModifiers: true });
    useGameStore.getState().hideModifiersScreen();
    expect(useGameStore.getState().showModifiers).toBe(false);
  });
});
