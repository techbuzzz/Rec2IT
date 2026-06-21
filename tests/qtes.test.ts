/**
 * QTE tests — covers all 5 QTE types × 8 roles × perfect/ok/fail/timeout outcomes.
 */

import { describe, it, expect } from 'vitest';
import { evaluateQTE, pickQTE, QTE_INTERVAL_M } from '@/data/qtes';
import type { QTE, QTEChoice, QTESpotBug, QTESequence, QTESlider, QTEHold } from '@/data/qtes';
import { ROLES } from '@/data/roles';

describe('QTE_INTERVAL_M', () => {
  it('triggers every 500 meters', () => {
    expect(QTE_INTERVAL_M).toBe(500);
  });
});

describe('pickQTE', () => {
  it('returns a QTE for each of 8 roles', () => {
    const roleIds = Object.keys(ROLES) as (keyof typeof ROLES)[];
    const prefixMap: Record<string, string> = {
      'junior-frontend': 'junior-',
      'middle-backend': 'middle-',
      'senior-fullstack': 'senior-',
      'devops': 'devops-',
      'ml-engineer': 'ml-',
      'product-manager': 'pm-',
      'qa-engineer': 'qa-',
      'mobile-developer': 'mobile-',
    };
    for (const id of roleIds) {
      const qte = pickQTE(id);
      expect(qte).toBeDefined();
      expect(qte.id).toContain(prefixMap[id] ?? id);
      expect(qte.duration).toBeGreaterThan(0);
      expect(qte.perfectScore).toBeGreaterThan(qte.okScore);
      expect(qte.failPenalty).toBeLessThan(0);
    }
  });

  it('returns QTE with valid type', () => {
    const qte = pickQTE('middle-backend');
    expect(['single-choice', 'spot-bug', 'sequence', 'slider', 'hold']).toContain(qte.type);
  });
});

describe('evaluateQTE — single-choice', () => {
  const choiceQTE: QTEChoice = {
    id: 'test-choice',
    type: 'single-choice',
    prompt: 'Pick the best algorithm',
    duration: 3000,
    perfectScore: 50,
    okScore: 20,
    failPenalty: -10,
    flavor: 'Think fast',
    options: [
      { id: 'a', label: 'O(n²)', correct: false },
      { id: 'b', label: 'O(n log n)', correct: true },
      { id: 'c', label: 'O(2ⁿ)', correct: false },
    ],
  };

  it('returns perfect for correct answer in first 30%', () => {
    const result = evaluateQTE(choiceQTE, { kind: 'choice', optionId: 'b' }, 500);
    expect(result.outcome).toBe('perfect');
    expect(result.scoreDelta).toBe(50);
  });

  it('returns ok for correct answer after 30%', () => {
    const result = evaluateQTE(choiceQTE, { kind: 'choice', optionId: 'b' }, 1500);
    expect(result.outcome).toBe('ok');
    expect(result.scoreDelta).toBe(20);
  });

  it('returns fail for wrong answer', () => {
    const result = evaluateQTE(choiceQTE, { kind: 'choice', optionId: 'a' }, 500);
    expect(result.outcome).toBe('fail');
    expect(result.scoreDelta).toBe(-10);
  });

  it('returns fail on timeout', () => {
    const result = evaluateQTE(choiceQTE, { kind: 'timeout' }, 3000);
    expect(result.outcome).toBe('fail');
    expect(result.scoreDelta).toBe(-10);
  });

  it('returns fail for wrong input kind', () => {
    const result = evaluateQTE(choiceQTE, { kind: 'spot', charIndex: 0 }, 500);
    expect(result.outcome).toBe('fail');
  });
});

describe('evaluateQTE — spot-bug', () => {
  const spotQTE: QTESpotBug = {
    id: 'test-spot',
    type: 'spot-bug',
    prompt: 'Click on the SQL injection',
    duration: 4000,
    perfectScore: 60,
    okScore: 25,
    failPenalty: -15,
    flavor: 'Find the bug',
    bugRegions: [
      { start: 10, end: 20 },
      { start: 50, end: 60 },
    ],
  };

  it('returns perfect for click in bug region (early)', () => {
    const result = evaluateQTE(spotQTE, { kind: 'spot', charIndex: 15 }, 500);
    expect(result.outcome).toBe('perfect');
  });

  it('returns ok for click in bug region (late)', () => {
    const result = evaluateQTE(spotQTE, { kind: 'spot', charIndex: 55 }, 2000);
    expect(result.outcome).toBe('ok');
  });

  it('returns fail for click outside bug region', () => {
    const result = evaluateQTE(spotQTE, { kind: 'spot', charIndex: 100 }, 500);
    expect(result.outcome).toBe('fail');
  });

  it('returns fail for boundary (start-1)', () => {
    const result = evaluateQTE(spotQTE, { kind: 'spot', charIndex: 9 }, 500);
    expect(result.outcome).toBe('fail');
  });

  it('returns perfect for boundary (start)', () => {
    const result = evaluateQTE(spotQTE, { kind: 'spot', charIndex: 10 }, 500);
    expect(result.outcome).toBe('perfect');
  });
});

describe('evaluateQTE — sequence', () => {
  const seqQTE: QTESequence = {
    id: 'test-seq',
    type: 'sequence',
    prompt: 'Order the layers',
    duration: 5000,
    perfectScore: 70,
    okScore: 30,
    failPenalty: -20,
    flavor: 'Architecture',
    sequence: [
      { id: 'lb', label: 'Load Balancer' },
      { id: 'api', label: 'API' },
      { id: 'cache', label: 'Cache' },
      { id: 'db', label: 'Database' },
    ],
    correctOrder: ['lb', 'api', 'cache', 'db'],
  };

  it('returns perfect for correct order (early)', () => {
    const result = evaluateQTE(seqQTE, { kind: 'sequence', order: ['lb', 'api', 'cache', 'db'] }, 500);
    expect(result.outcome).toBe('perfect');
  });

  it('returns ok for correct order (late)', () => {
    const result = evaluateQTE(seqQTE, { kind: 'sequence', order: ['lb', 'api', 'cache', 'db'] }, 2000);
    expect(result.outcome).toBe('ok');
  });

  it('returns fail for wrong order', () => {
    const result = evaluateQTE(seqQTE, { kind: 'sequence', order: ['db', 'cache', 'api', 'lb'] }, 500);
    expect(result.outcome).toBe('fail');
  });

  it('returns fail for partial order (missing element)', () => {
    const result = evaluateQTE(seqQTE, { kind: 'sequence', order: ['lb', 'api', 'cache'] }, 500);
    expect(result.outcome).toBe('fail');
  });
});

describe('evaluateQTE — slider', () => {
  const sliderQTE: QTESlider = {
    id: 'test-slider',
    type: 'slider',
    prompt: 'Set throttle to 50 RPS',
    duration: 4000,
    perfectScore: 55,
    okScore: 25,
    failPenalty: -12,
    flavor: 'Tune it',
    target: 50,
    perfectTolerance: 5,
    okTolerance: 15,
  };

  it('returns perfect within perfect tolerance (early)', () => {
    const result = evaluateQTE(sliderQTE, { kind: 'slider', value: 52 }, 500);
    expect(result.outcome).toBe('perfect');
  });

  it('returns ok within ok tolerance', () => {
    const result = evaluateQTE(sliderQTE, { kind: 'slider', value: 60 }, 500);
    expect(result.outcome).toBe('ok');
  });

  it('returns fail outside ok tolerance', () => {
    const result = evaluateQTE(sliderQTE, { kind: 'slider', value: 100 }, 500);
    expect(result.outcome).toBe('fail');
  });

  it('returns perfect at exact target', () => {
    const result = evaluateQTE(sliderQTE, { kind: 'slider', value: 50 }, 500);
    expect(result.outcome).toBe('perfect');
  });
});

describe('evaluateQTE — hold', () => {
  const holdQTE: QTEHold = {
    id: 'test-hold',
    type: 'hold',
    prompt: 'Hold for 2 seconds',
    duration: 3000,
    perfectScore: 45,
    okScore: 20,
    failPenalty: -10,
    flavor: 'Steady',
    holdMs: 2000,
    okTolerance: 300,
  };

  it('returns perfect for exact hold (early)', () => {
    const result = evaluateQTE(holdQTE, { kind: 'hold', heldMs: 2000 }, 500);
    expect(result.outcome).toBe('perfect');
  });

  it('returns ok for hold within tolerance', () => {
    const result = evaluateQTE(holdQTE, { kind: 'hold', heldMs: 2200 }, 1500);
    expect(result.outcome).toBe('ok');
  });

  it('returns fail for short hold', () => {
    const result = evaluateQTE(holdQTE, { kind: 'hold', heldMs: 500 }, 500);
    expect(result.outcome).toBe('fail');
  });

  it('returns fail for over-hold', () => {
    const result = evaluateQTE(holdQTE, { kind: 'hold', heldMs: 5000 }, 500);
    expect(result.outcome).toBe('fail');
  });
});