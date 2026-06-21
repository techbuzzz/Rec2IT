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
// DEVOPS / SRE (qteDifficulty: 3 — инфра, k8s)
// ============================================================
const DEVOPS_QTES: QTE[] = [
  {
    id: 'devops-k8s-bug',
    type: 'spot-bug',
    prompt: 'Найди: под ушёл в CrashLoopBackOff',
    flavor: 'Production incident. Почини манифест.',
    code: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n      - name: api\n        image: api:v1.2.3\n        ports:\n        - containerPort: 8080\n        env:\n        - name: LOG_LEVEL\n          value: "debgu"',
    bugRegions: [{ start: 290, end: 297, reason: '"debgu" → "debug"' }],
    duration: 7000,
    perfectScore: 70,
    okScore: 35,
    failPenalty: -20,
  },
  {
    id: 'devops-pick-region',
    type: 'single-choice',
    prompt: 'Где НЕ стоит держать stateful сервис?',
    flavor: 'Архитектурные антипаттерны.',
    options: [
      { id: 'a', label: 'Managed PostgreSQL', correct: false },
      { id: 'b', label: 'EKS pod с emptyDir', correct: true },
      { id: 'c', label: 'RDS Multi-AZ', correct: false },
    ],
    duration: 5000,
    perfectScore: 60,
    okScore: 30,
    failPenalty: -20,
  },
  {
    id: 'devops-hold-incident',
    type: 'hold',
    prompt: 'Удерживай incident call',
    flavor: 'Postmortem пишется, пока боль свежа.',
    action: '🚨 Incident',
    holdMs: 2000,
    okTolerance: 500,
    duration: 5000,
    perfectScore: 65,
    okScore: 30,
    failPenalty: -20,
  },
  {
    id: 'devops-order-pipeline',
    type: 'sequence',
    prompt: 'Расставь CI/CD пайплайн',
    flavor: 'Standard 12-factor pipeline.',
    correctOrder: ['commit', 'lint', 'test', 'build', 'scan', 'deploy'],
    items: [
      { id: 'deploy', label: '🚀 Deploy' },
      { id: 'lint', label: '🧹 Lint' },
      { id: 'build', label: '📦 Build' },
      { id: 'test', label: '✅ Test' },
      { id: 'scan', label: '🔒 Scan' },
      { id: 'commit', label: '💾 Commit' },
    ],
    duration: 12000,
    perfectScore: 90,
    okScore: 45,
    failPenalty: -20,
  },
  {
    id: 'devops-slider-replicas',
    type: 'slider',
    prompt: 'Auto-scale replicas target: 8',
    flavor: 'HPA настраивается.',
    metric: '📊 Replicas',
    target: 8,
    perfectTolerance: 2,
    okTolerance: 6,
    duration: 5000,
    perfectScore: 60,
    okScore: 30,
    failPenalty: -20,
  },
];

// ============================================================
// ML ENGINEER (qteDifficulty: 3 — модель, данные)
// ============================================================
const ML_QTES: QTE[] = [
  {
    id: 'ml-tf-bug',
    type: 'spot-bug',
    prompt: 'Найди: loss в NaN',
    flavor: 'Тренировка падает. Дедлайн горит.',
    code: 'import tensorflow as tf\n\nmodel = tf.keras.Sequential([\n  tf.keras.layers.Dense(128, activation="relu"),\n  tf.keras.layers.Dense(10, activation="softmax")\n])\n\nmodel.compile(\n  optimizer="adam",\n  loss="binary_crossentropy",\n  metrics=["accuracy"]\n)',
    bugRegions: [
      { start: 195, end: 230, reason: '"binary_crossentropy" для 10-классовой классификации — нужен "categorical_crossentropy"' },
    ],
    duration: 8000,
    perfectScore: 75,
    okScore: 40,
    failPenalty: -20,
  },
  {
    id: 'ml-pick-augmentation',
    type: 'single-choice',
    prompt: 'Когда НЕ применять data augmentation?',
    flavor: 'ML hygiene.',
    options: [
      { id: 'a', label: 'Мало данных (1000 примеров)', correct: false },
      { id: 'b', label: 'Данные уже искусственно сгенерированы', correct: true },
      { id: 'c', label: 'Имеются label noise', correct: false },
    ],
    duration: 6000,
    perfectScore: 65,
    okScore: 30,
    failPenalty: -20,
  },
  {
    id: 'ml-hold-train',
    type: 'hold',
    prompt: 'Удерживай training',
    flavor: '10 эпох. Модель учится.',
    action: '🎓 Train',
    holdMs: 2500,
    okTolerance: 600,
    duration: 6000,
    perfectScore: 70,
    okScore: 35,
    failPenalty: -20,
  },
  {
    id: 'ml-order-pipeline',
    type: 'sequence',
    prompt: 'Расставь ML-пайплайн',
    flavor: 'Data → Model → Deploy.',
    correctOrder: ['collect', 'clean', 'train', 'eval', 'serve'],
    items: [
      { id: 'serve', label: '🚀 Serve' },
      { id: 'eval', label: '📊 Evaluate' },
      { id: 'train', label: '🎓 Train' },
      { id: 'collect', label: '📥 Collect' },
      { id: 'clean', label: '🧹 Clean' },
    ],
    duration: 10000,
    perfectScore: 80,
    okScore: 40,
    failPenalty: -20,
  },
  {
    id: 'ml-slider-lr',
    type: 'slider',
    prompt: 'Learning rate: 0.001',
    flavor: 'Найди оптимальный шаг.',
    metric: '📈 LR',
    target: 1, // 0.001 * 1000 для UI
    perfectTolerance: 1,
    okTolerance: 5,
    duration: 6000,
    perfectScore: 65,
    okScore: 30,
    failPenalty: -20,
  },
];

// ============================================================
// PRODUCT MANAGER (qteDifficulty: 2 — приоритезация)
// ============================================================
const PM_QTES: QTE[] = [
  {
    id: 'pm-bug-spec',
    type: 'spot-bug',
    prompt: 'Найди: плохая формулировка требования',
    flavor: 'Vague spec → баги в разработке.',
    code: 'User Story:\nAs a user, I want the system\nto be fast and user-friendly\nand modern and cool.',
    bugRegions: [
      { start: 0, end: 80, reason: 'Нет конкретных метрик, нетестируемые критерии' },
    ],
    duration: 7000,
    perfectScore: 55,
    okScore: 25,
    failPenalty: -15,
  },
  {
    id: 'pm-pick-metric',
    type: 'single-choice',
    prompt: 'Какая метрика — North Star?',
    flavor: 'PM думает метриками.',
    options: [
      { id: 'a', label: 'DAU (Daily Active Users)', correct: true },
      { id: 'b', label: 'Количество строк кода', correct: false },
      { id: 'c', label: 'Цвет кнопки на лендинге', correct: false },
    ],
    duration: 5000,
    perfectScore: 50,
    okScore: 25,
    failPenalty: -15,
  },
  {
    id: 'pm-hold-stakeholder',
    type: 'hold',
    prompt: 'Удерживай stakeholder call',
    flavor: 'Слушай боль. Не перебивай.',
    action: '🤝 Sync',
    holdMs: 1800,
    okTolerance: 400,
    duration: 4500,
    perfectScore: 55,
    okScore: 25,
    failPenalty: -15,
  },
  {
    id: 'pm-order-rice',
    type: 'sequence',
    prompt: 'Расставь RICE-приоритизацию',
    flavor: 'Reach · Impact · Confidence · Effort',
    correctOrder: ['reach', 'impact', 'confidence', 'effort'],
    items: [
      { id: 'effort', label: '💪 Effort' },
      { id: 'impact', label: '💥 Impact' },
      { id: 'confidence', label: '🎯 Confidence' },
      { id: 'reach', label: '👥 Reach' },
    ],
    duration: 10000,
    perfectScore: 65,
    okScore: 30,
    failPenalty: -15,
  },
  {
    id: 'pm-slider-conversion',
    type: 'slider',
    prompt: 'Целевая конверсия: 3.5%',
    flavor: 'Funnel optimization.',
    metric: '📈 CR %',
    target: 35, // 3.5 * 10
    perfectTolerance: 5,
    okTolerance: 15,
    duration: 6000,
    perfectScore: 50,
    okScore: 25,
    failPenalty: -15,
  },
];

// ============================================================
// QA ENGINEER (qteDifficulty: 2 — тесты, баги)
// ============================================================
const QA_QTES: QTE[] = [
  {
    id: 'qa-bug-test',
    type: 'spot-bug',
    prompt: 'Найди: flaky test',
    flavor: 'Тест проходит только иногда.',
    code: 'test("creates user", async () => {\n  const id = Date.now();\n  const user = await db.create({ id, name: "Alice" });\n  expect(user.id).toBe(12345);\n});',
    bugRegions: [
      { start: 95, end: 100, reason: 'Хардкоженный id вместо id из результата' },
    ],
    duration: 7000,
    perfectScore: 60,
    okScore: 30,
    failPenalty: -15,
  },
  {
    id: 'qa-pick-coverage',
    type: 'single-choice',
    prompt: 'Что важнее 100% coverage?',
    flavor: 'QA метрики ≠ качество.',
    options: [
      { id: 'a', label: 'Покрытие edge cases', correct: true },
      { id: 'b', label: 'Покрытие всех строк', correct: false },
      { id: 'c', label: 'Количество тестов', correct: false },
    ],
    duration: 5000,
    perfectScore: 50,
    okScore: 25,
    failPenalty: -15,
  },
  {
    id: 'qa-hold-regression',
    type: 'hold',
    prompt: 'Удерживай regression suite',
    flavor: 'Полный прогон. 2 часа. Можно кофе.',
    action: '🧪 Test',
    holdMs: 2200,
    okTolerance: 500,
    duration: 5500,
    perfectScore: 60,
    okScore: 30,
    failPenalty: -15,
  },
  {
    id: 'qa-order-bug',
    type: 'sequence',
    prompt: 'Жизненный цикл бага',
    flavor: 'From new to closed.',
    correctOrder: ['new', 'triaged', 'in_progress', 'fix', 'verified'],
    items: [
      { id: 'fix', label: '🔧 Fixed' },
      { id: 'verified', label: '✓ Verified' },
      { id: 'in_progress', label: '⚙️ In progress' },
      { id: 'new', label: '🆕 New' },
      { id: 'triaged', label: '🏷️ Triaged' },
    ],
    duration: 9000,
    perfectScore: 65,
    okScore: 30,
    failPenalty: -15,
  },
  {
    id: 'qa-slider-priority',
    type: 'slider',
    prompt: 'Severity баг-тикета: P1',
    flavor: 'P0 — продакшен лежит. P1 — серьёзно.',
    metric: '🚦 P',
    target: 1,
    perfectTolerance: 0,
    okTolerance: 1,
    duration: 5000,
    perfectScore: 50,
    okScore: 25,
    failPenalty: -15,
  },
];

// ============================================================
// MOBILE DEVELOPER (qteDifficulty: 2 — платформы, build)
// ============================================================
const MOBILE_QTES: QTE[] = [
  {
    id: 'mobile-bug-render',
    type: 'spot-bug',
    prompt: 'Найди: причина фризов UI',
    flavor: '60fps пожелание, 12fps реальность.',
    code: 'class FeedController {\n  loadItems() {\n    const items = await api.fetch();\n    for (let i = 0; i < items.length; i++) {\n      this.items.push(items[i]);\n    }\n    this.render();\n  }\n}',
    bugRegions: [
      { start: 130, end: 175, reason: 'Sync render в main thread без батчинга' },
    ],
    duration: 7000,
    perfectScore: 55,
    okScore: 30,
    failPenalty: -15,
  },
  {
    id: 'mobile-pick-store',
    type: 'single-choice',
    prompt: 'Где нельзя хранить API ключ?',
    flavor: 'App rejected. Секреты в открытом виде.',
    options: [
      { id: 'a', label: 'Keychain (iOS)', correct: false },
      { id: 'b', label: 'BuildConstants.kt', correct: true },
      { id: 'c', label: 'Encrypted SharedPrefs', correct: false },
    ],
    duration: 5000,
    perfectScore: 50,
    okScore: 25,
    failPenalty: -15,
  },
  {
    id: 'mobile-hold-build',
    type: 'hold',
    prompt: 'Удерживай build',
    flavor: 'Gradle 12 минут. Не прерывай.',
    action: '🏗 Build',
    holdMs: 2200,
    okTolerance: 500,
    duration: 5500,
    perfectScore: 55,
    okScore: 25,
    failPenalty: -15,
  },
  {
    id: 'mobile-order-release',
    type: 'sequence',
    prompt: 'Расставь релиз-пайплайн',
    flavor: 'From code to App Store.',
    correctOrder: ['code', 'test', 'archive', 'sign', 'upload', 'review'],
    items: [
      { id: 'review', label: '👀 Review' },
      { id: 'upload', label: '☁️ Upload' },
      { id: 'sign', label: '🔏 Sign' },
      { id: 'code', label: '💻 Code' },
      { id: 'archive', label: '📦 Archive' },
      { id: 'test', label: '✅ Test' },
    ],
    duration: 10000,
    perfectScore: 70,
    okScore: 35,
    failPenalty: -15,
  },
  {
    id: 'mobile-slider-fps',
    type: 'slider',
    prompt: 'Target FPS: 60',
    flavor: 'Smooth scroll budget.',
    metric: '🎬 FPS',
    target: 60,
    perfectTolerance: 5,
    okTolerance: 15,
    duration: 5000,
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
  'devops': DEVOPS_QTES,
  'ml-engineer': ML_QTES,
  'product-manager': PM_QTES,
  'qa-engineer': QA_QTES,
  'mobile-developer': MOBILE_QTES,
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