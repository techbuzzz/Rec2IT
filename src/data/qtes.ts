/**
 * QTE templates — Phase 2: 5 типов промптов с реальной механикой.
 *
 * single-choice — 1 из 3 вариантов (Coding round: pick correct algorithm)
 * spot-bug      — клик по экрану в зоне с багом в коде
 * sequence      — drag-to-reorder (System design: LB → API → Cache → DB)
 * slider        — drag slider to target value (Throttling slider)
 * hold          — удерживать кнопку N мс (Stamina / long compile)
 *
 * QTE-инстанс = { id, type, prompt, duration, options?, target?, bugRegions?, sequence?, reward }
 */

import type { RoleId } from './roles';

export type QTEType = 'single-choice' | 'spot-bug' | 'sequence' | 'slider' | 'hold';

export interface QTEBase {
  id: string;
  type: QTEType;
  prompt: string;
  /** ms */
  duration: number;
  /** очков за perfect (в окне 30% времени) */
  perfectScore: number;
  /** очков за ok (успел, но не идеально) */
  okScore: number;
  /** штраф за fail (отрицательный) */
  failPenalty: number;
  /** мемный flavor text для подсказки */
  flavor: string;
}

export interface QTEChoice extends QTEBase {
  type: 'single-choice';
  options: { id: string; label: string; correct: boolean }[];
}

export interface QTESpotBug extends QTEBase {
  type: 'spot-bug';
  /** код, в котором ищем баг */
  code: string;
  /** символьные зоны с багами (start, end) */
  bugRegions: { start: number; end: number; reason: string }[];
}

export interface QTESequence extends QTEBase {
  type: 'sequence';
  /** правильный порядок id */
  correctOrder: string[];
  /** доступные элементы с лейблами */
  items: { id: string; label: string }[];
}

export interface QTESlider extends QTEBase {
  type: 'slider';
  /** целевое значение (0-100) */
  target: number;
  /** допуск perfect (5), ok (15) */
  perfectTolerance: number;
  okTolerance: number;
  /** label слайдера */
  metric: string;
}

export interface QTEHold extends QTEBase {
  type: 'hold';
  /** сколько мс удерживать (perfect) */
  holdMs: number;
  /** допуск ok: ±150ms */
  okTolerance: number;
  /** label */
  action: string;
}

export type QTE = QTEChoice | QTESpotBug | QTESequence | QTESlider | QTEHold;

export interface QTEResult {
  qteId: string;
  outcome: 'perfect' | 'ok' | 'fail';
  scoreDelta: number;
}

// ============================================================
// JUNIOR FRONTEND (qteDifficulty: 1 — простые промпты)
// ============================================================
const JUNIOR_QTES: QTE[] = [
  {
    id: 'junior-css-center',
    type: 'spot-bug',
    prompt: 'Найди баг: блок не по центру',
    flavor: 'Типичный CSS-flex. Вёрстка ломается на проде.',
    code: 'div.box {\n  display: flex;\n  justify-content: cneter;\n  align-items: center;\n  height: 100vh;\n}',
    bugRegions: [{ start: 47, end: 53, reason: '"cneter" → "center"' }],
    duration: 8000,
    perfectScore: 50,
    okScore: 25,
    failPenalty: -10,
  },
  {
    id: 'junior-pick-css',
    type: 'single-choice',
    prompt: 'Какое свойство центрирует flex-элемент по главной оси?',
    flavor: 'Спросят на первом же собесе.',
    options: [
      { id: 'a', label: 'align-items: center', correct: false },
      { id: 'b', label: 'justify-content: center', correct: true },
      { id: 'c', label: 'place-self: center', correct: false },
    ],
    duration: 6000,
    perfectScore: 40,
    okScore: 20,
    failPenalty: -10,
  },
  {
    id: 'junior-hold-deploy',
    type: 'hold',
    prompt: 'Удерживай «деплой» — не отпускай',
    flavor: 'CI/CD pipeline идёт. Не дёрни рубильник.',
    action: '🚀 Деплой',
    holdMs: 1500,
    okTolerance: 400,
    duration: 4000,
    perfectScore: 45,
    okScore: 20,
    failPenalty: -10,
  },
  {
    id: 'junior-order-pipeline',
    type: 'sequence',
    prompt: 'Собери порядок: деплой фронта',
    flavor: 'Без CI никуда. Расставь шаги.',
    correctOrder: ['lint', 'test', 'build', 'deploy'],
    items: [
      { id: 'deploy', label: '🚀 Deploy' },
      { id: 'lint', label: '🧹 Lint' },
      { id: 'build', label: '📦 Build' },
      { id: 'test', label: '✅ Test' },
    ],
    duration: 10000,
    perfectScore: 55,
    okScore: 25,
    failPenalty: -10,
  },
  {
    id: 'junior-slider-brightness',
    type: 'slider',
    prompt: 'Выкрути яркость на 73%',
    flavor: 'UI на тёмной стороне. Найди баланс.',
    metric: '☀️ Яркость',
    target: 73,
    perfectTolerance: 5,
    okTolerance: 15,
    duration: 6000,
    perfectScore: 40,
    okScore: 20,
    failPenalty: -10,
  },
];

// ============================================================
// MIDDLE BACKEND (qteDifficulty: 2 — SQL/REST/API)
// ============================================================
const MIDDLE_QTES: QTE[] = [
  {
    id: 'middle-sql-injection',
    type: 'spot-bug',
    prompt: 'Найди SQL-инъекцию',
    flavor: 'Классика OWASP Top 10. Не пропусти.',
    code: 'app.get("/user", (req, res) => {\n  const id = req.query.id;\n  db.query(`SELECT * FROM users WHERE id = ${id}`);\n});',
    bugRegions: [{ start: 67, end: 110, reason: 'Конкатенация вместо параметризованного запроса' }],
    duration: 8000,
    perfectScore: 60,
    okScore: 30,
    failPenalty: -15,
  },
  {
    id: 'middle-pick-rest',
    type: 'single-choice',
    prompt: 'Какой статус-код для «уже существует»?',
    flavor: 'REST-конвенции. Не путай с 200/201.',
    options: [
      { id: 'a', label: '200 OK', correct: false },
      { id: 'b', label: '409 Conflict', correct: true },
      { id: 'c', label: '422 Unprocessable', correct: false },
    ],
    duration: 6000,
    perfectScore: 50,
    okScore: 25,
    failPenalty: -15,
  },
  {
    id: 'middle-hold-migration',
    type: 'hold',
    prompt: 'Удерживай миграцию',
    flavor: 'DDL на проде. Не прерывай.',
    action: '💾 Migrate',
    holdMs: 2000,
    okTolerance: 500,
    duration: 5000,
    perfectScore: 55,
    okScore: 25,
    failPenalty: -15,
  },
  {
    id: 'middle-order-microservice',
    type: 'sequence',
    prompt: 'Расставь: load → process → store',
    flavor: 'Pipeline для высокой нагрузки.',
    correctOrder: ['lb', 'queue', 'worker', 'db'],
    items: [
      { id: 'worker', label: '⚙️ Worker' },
      { id: 'db', label: '💾 Database' },
      { id: 'lb', label: '🌐 Load Balancer' },
      { id: 'queue', label: '📨 Queue' },
    ],
    duration: 10000,
    perfectScore: 70,
    okScore: 30,
    failPenalty: -15,
  },
  {
    id: 'middle-slider-throttle',
    type: 'slider',
    prompt: 'Выставь rate limit 42 rps',
    flavor: 'Защити API от перегрузки.',
    metric: '🚦 Rate Limit',
    target: 42,
    perfectTolerance: 4,
    okTolerance: 12,
    duration: 6000,
    perfectScore: 50,
    okScore: 25,
    failPenalty: -15,
  },
];

// ============================================================
// SENIOR FULL-STACK (qteDifficulty: 3 — system design)
// ============================================================
const SENIOR_QTES: QTE[] = [
  {
    id: 'senior-system-bug',
    type: 'spot-bug',
    prompt: 'Найди race condition',
    flavor: 'Distributed systems. Где-то теряется событие.',
    code: 'async function processOrder(id) {\n  const order = await db.get(id);\n  if (order.status === "new") {\n    await charge(order);\n    order.status = "paid";\n    await db.save(order);\n  }\n}',
    bugRegions: [
      { start: 95, end: 170, reason: 'Нет блокировки — два запроса пройдут if' },
    ],
    duration: 8000,
    perfectScore: 80,
    okScore: 40,
    failPenalty: -20,
  },
  {
    id: 'senior-pick-cache',
    type: 'single-choice',
    prompt: 'Когда НЕ нужен Redis?',
    flavor: 'Senior знает, когда НЕ overengineering.',
    options: [
      { id: 'a', label: 'Session store для 100 RPS', correct: false },
      { id: 'b', label: 'Real-time pub/sub в чате', correct: false },
      { id: 'c', label: 'Простой счётчик просмотров на 10 в день', correct: true },
    ],
    duration: 6000,
    perfectScore: 70,
    okScore: 35,
    failPenalty: -20,
  },
  {
    id: 'senior-hold-rollback',
    type: 'hold',
    prompt: 'Удерживай rollback',
    flavor: 'Откат миграции на 50ГБ. Долго.',
    action: '⏪ Rollback',
    holdMs: 2500,
    okTolerance: 600,
    duration: 6000,
    perfectScore: 75,
    okScore: 35,
    failPenalty: -20,
  },
  {
    id: 'senior-order-system',
    type: 'sequence',
    prompt: 'Собери порядок high-load системы',
    flavor: 'Архитектура Twitter-уровня.',
    correctOrder: ['cdn', 'lb', 'api', 'cache', 'queue', 'db'],
    items: [
      { id: 'cache', label: '⚡ Cache' },
      { id: 'db', label: '💾 DB' },
      { id: 'api', label: '🛠 API' },
      { id: 'queue', label: '📨 Queue' },
      { id: 'lb', label: '🌐 LB' },
      { id: 'cdn', label: '📡 CDN' },
    ],
    duration: 12000,
    perfectScore: 100,
    okScore: 50,
    failPenalty: -20,
  },
  {
    id: 'senior-slider-replicas',
    type: 'slider',
    prompt: 'Баланс latency vs cost: 67',
    flavor: 'Capacity planning. Архитектор выбирает.',
    metric: '📊 Реплик',
    target: 67,
    perfectTolerance: 3,
    okTolerance: 10,
    duration: 6000,
    perfectScore: 70,
    okScore: 35,
    failPenalty: -20,
  },
];

const QTE_BANK: Record<RoleId, QTE[]> = {
  'junior-frontend': JUNIOR_QTES,
  'middle-backend': MIDDLE_QTES,
  'senior-fullstack': SENIOR_QTES,
};

/** Случайный QTE для роли (без повторов подряд через sessionStorage). */
const recentKey = (roleId: RoleId) => `jobrun.recentQte.${roleId}`;

export const pickQTE = (roleId: RoleId): QTE => {
  const bank = QTE_BANK[roleId];
  const recent = (() => {
    try {
      return JSON.parse(sessionStorage.getItem(recentKey(roleId)) || '[]') as string[];
    } catch {
      return [];
    }
  })();
  const fresh = bank.filter((q) => !recent.includes(q.id));
  const pool = fresh.length > 0 ? fresh : bank;
  const qte = pool[Math.floor(Math.random() * pool.length)]!;
  const updated = [...recent, qte.id].slice(-3);
  try {
    sessionStorage.setItem(recentKey(roleId), JSON.stringify(updated));
  } catch {
    /* sessionStorage full */
  }
  return qte;
};

/** дистанция между QTE-триггерами (м) */
export const QTE_INTERVAL_M = 500;

/** Оценка QTE-результата: сравнивает ввод с таргетом, возвращает outcome. */
export const evaluateQTE = (
  qte: QTE,
  input:
    | { kind: 'choice'; optionId: string }
    | { kind: 'spot'; charIndex: number }
    | { kind: 'sequence'; order: string[] }
    | { kind: 'slider'; value: number }
    | { kind: 'hold'; heldMs: number }
    | { kind: 'timeout' },
  elapsedMs: number,
): QTEResult => {
  if (input.kind === 'timeout') {
    return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
  }
  // perfect window: first 30% of duration
  const perfectWindow = qte.duration * 0.3;
  const inPerfectTime = elapsedMs <= perfectWindow;

  switch (qte.type) {
    case 'single-choice': {
      if (input.kind !== 'choice') return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
      const opt = qte.options.find((o) => o.id === input.optionId);
      if (opt?.correct) {
        return inPerfectTime
          ? { qteId: qte.id, outcome: 'perfect', scoreDelta: qte.perfectScore }
          : { qteId: qte.id, outcome: 'ok', scoreDelta: qte.okScore };
      }
      return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
    }
    case 'spot-bug': {
      if (input.kind !== 'spot') return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
      const hit = qte.bugRegions.some((r) => input.charIndex >= r.start && input.charIndex <= r.end);
      if (hit) {
        return inPerfectTime
          ? { qteId: qte.id, outcome: 'perfect', scoreDelta: qte.perfectScore }
          : { qteId: qte.id, outcome: 'ok', scoreDelta: qte.okScore };
      }
      return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
    }
    case 'sequence': {
      if (input.kind !== 'sequence') return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
      const correct = input.order.length === qte.correctOrder.length &&
        input.order.every((id, i) => id === qte.correctOrder[i]);
      if (correct) {
        return inPerfectTime
          ? { qteId: qte.id, outcome: 'perfect', scoreDelta: qte.perfectScore }
          : { qteId: qte.id, outcome: 'ok', scoreDelta: qte.okScore };
      }
      return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
    }
    case 'slider': {
      if (input.kind !== 'slider') return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
      const delta = Math.abs(input.value - qte.target);
      if (delta <= qte.perfectTolerance) {
        return inPerfectTime
          ? { qteId: qte.id, outcome: 'perfect', scoreDelta: qte.perfectScore }
          : { qteId: qte.id, outcome: 'ok', scoreDelta: qte.okScore };
      }
      if (delta <= qte.okTolerance) {
        return { qteId: qte.id, outcome: 'ok', scoreDelta: qte.okScore };
      }
      return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
    }
    case 'hold': {
      if (input.kind !== 'hold') return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
      const delta = Math.abs(input.heldMs - qte.holdMs);
      if (delta <= qte.okTolerance) {
        return inPerfectTime
          ? { qteId: qte.id, outcome: 'perfect', scoreDelta: qte.perfectScore }
          : { qteId: qte.id, outcome: 'ok', scoreDelta: qte.okScore };
      }
      return { qteId: qte.id, outcome: 'fail', scoreDelta: qte.failPenalty };
    }
  }
};