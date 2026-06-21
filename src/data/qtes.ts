/**
 * QTE templates — Phase 2 stubs (QTE scene появится в Phase 2).
 * Phase 1: типы объявлены, но триггер каждые 500м выключен.
 */

export type QTEType = 'single-choice' | 'spot-bug' | 'sequence' | 'slider' | 'hold';

export interface QTETemplate {
  type: QTEType;
  prompt: string;
  duration: number; // ms
  /** только для Phase 2 — пока stub */
}

export const QTE_SAMPLES: Record<string, QTETemplate> = {
  'junior-css-debug': {
    type: 'spot-bug',
    prompt: 'Найди: div {display: flex; justify-content: cneter; align-items: center;}',
    duration: 8000,
  },
  'middle-sql-injection': {
    type: 'single-choice',
    prompt: 'SELECT * FROM users WHERE id = ?',
    duration: 5000,
  },
  'senior-system-design': {
    type: 'sequence',
    prompt: 'Построй порядок: Load Balancer → Cache → DB → Queue',
    duration: 10000,
  },
};

/** дистанция между QTE-триггерами (м) */
export const QTE_INTERVAL_M = 500;