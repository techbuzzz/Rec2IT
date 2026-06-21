/**
 * Roles — стартовый набор 3, расширение до 8 в Phase 5.
 * Конфиг влияет на spawner density, base score, lane layout.
 */

export type RoleId = 'junior-frontend' | 'middle-backend' | 'senior-fullstack';

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
    defaultEndingId: 'junior-too-green',
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
    defaultEndingId: 'middle-mid-life',
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
    defaultEndingId: 'senior-overqualified',
  },
};

export const ROLE_LIST: RoleConfig[] = Object.values(ROLES);

export const getRole = (id: RoleId): RoleConfig => ROLES[id];