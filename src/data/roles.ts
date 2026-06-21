/**
 * Roles — Phase 5: 8 ролей (3 базовых + 5 дополнительных).
 * Каждая роль = уникальный геймплей: скорость, жизни, спавн-density, QTE-сложность.
 */

export type RoleId =
  | 'junior-frontend'
  | 'middle-backend'
  | 'senior-fullstack'
  | 'devops'
  | 'ml-engineer'
  | 'product-manager'
  | 'qa-engineer'
  | 'mobile-developer';

export interface RoleConfig {
  id: RoleId;
  name: string;
  emoji: string;
  tagline: string;
  /** base pixels/sec */
  baseSpeed: number;
  /** max multiplier cap */
  maxComboMultiplier: number;
  /** жизни на старт */
  startingLives: number;
  /** частота спавна препятствий (мс) */
  spawnIntervalMs: number;
  /** QTE-сложность: 1=легко, 3=сложно */
  qteDifficulty: 1 | 2 | 3;
  /** цветовая схема HUD */
  accentColor: string;
  /** мемный финал по умолчанию */
  defaultEndingId: string;
}

export const ROLES: Record<RoleId, RoleConfig> = {
  'junior-frontend': {
    id: 'junior-frontend',
    name: 'Junior Frontend',
    emoji: '🎨',
    tagline: 'CSS баги, ревью PR, тикет на 3 спринта',
    baseSpeed: 280,
    maxComboMultiplier: 2.0,
    startingLives: 3,
    spawnIntervalMs: 1400,
    qteDifficulty: 1,
    accentColor: '#22c55e',
    defaultEndingId: 'junior-frontend-yesche-zelenyy',
  },
  'middle-backend': {
    id: 'middle-backend',
    name: 'Middle Backend',
    emoji: '⚙️',
    tagline: 'SQL-инъекции, REST vs gRPC, деплой в пятницу',
    baseSpeed: 320,
    maxComboMultiplier: 2.5,
    startingLives: 2,
    spawnIntervalMs: 1200,
    qteDifficulty: 2,
    accentColor: '#3b82f6',
    defaultEndingId: 'middle-backend-middle-mid-life',
  },
  'senior-fullstack': {
    id: 'senior-fullstack',
    name: 'Senior Full-Stack',
    emoji: '🧠',
    tagline: 'System design, архитектура, ментор джунам',
    baseSpeed: 360,
    maxComboMultiplier: 3.0,
    startingLives: 1,
    spawnIntervalMs: 1000,
    qteDifficulty: 3,
    accentColor: '#a855f7',
    defaultEndingId: 'senior-fullstack-pereros-vakansiyu',
  },
  'devops': {
    id: 'devops',
    name: 'DevOps / SRE',
    emoji: '🐳',
    tagline: 'K8s упал в 3 AM. Пейджер орёт. Беги чинить',
    baseSpeed: 400,
    maxComboMultiplier: 3.0,
    startingLives: 1,
    spawnIntervalMs: 850,
    qteDifficulty: 3,
    accentColor: '#f97316',
    defaultEndingId: 'devops-ezhegodnyy-onkoll',
  },
  'ml-engineer': {
    id: 'ml-engineer',
    name: 'ML Engineer',
    emoji: '🤖',
    tagline: 'Модель не сходится. Loss в nan. Дедлайн вчера',
    baseSpeed: 300,
    maxComboMultiplier: 2.5,
    startingLives: 2,
    spawnIntervalMs: 1100,
    qteDifficulty: 3,
    accentColor: '#ec4899',
    defaultEndingId: 'ml-engineer-gpt-zamenil',
  },
  'product-manager': {
    id: 'product-manager',
    name: 'Product Manager',
    emoji: '📊',
    tagline: 'Stakeholder сказал «просто MVP». Roadmap на 47 страниц',
    baseSpeed: 260,
    maxComboMultiplier: 2.0,
    startingLives: 3,
    spawnIntervalMs: 1300,
    qteDifficulty: 2,
    accentColor: '#14b8a6',
    defaultEndingId: 'product-manager-roadmap-bez-srokov',
  },
  'qa-engineer': {
    id: 'qa-engineer',
    name: 'QA Engineer',
    emoji: '🧪',
    tagline: 'Найден баг в проде. Открыт тикет. Закрыт wontfix',
    baseSpeed: 290,
    maxComboMultiplier: 2.5,
    startingLives: 2,
    spawnIntervalMs: 1250,
    qteDifficulty: 2,
    accentColor: '#eab308',
    defaultEndingId: 'qa-engineer-wontfix',
  },
  'mobile-developer': {
    id: 'mobile-developer',
    name: 'Mobile Developer',
    emoji: '📱',
    tagline: 'App Store reject. Снова. Сертификат протух',
    baseSpeed: 310,
    maxComboMultiplier: 2.5,
    startingLives: 2,
    spawnIntervalMs: 1150,
    qteDifficulty: 2,
    accentColor: '#06b6d4',
    defaultEndingId: 'mobile-developer-app-store-reject',
  },
};

export const ROLE_LIST: RoleConfig[] = Object.values(ROLES);

export const getRole = (id: RoleId): RoleConfig => ROLES[id];