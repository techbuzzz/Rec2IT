/**
 * Roguelike modifiers — Phase 5.
 * Перед каждым run показываем 2 случайных модификатора (1 buff + 1 debuff).
 * Каждый модификатор меняет spawner density, speed, multiplier, lives.
 */

import type { RoleId } from './roles';

export type ModifierEffect = 'spawn_density' | 'speed' | 'multiplier' | 'starting_lives' | 'qte_difficulty';

export interface Modifier {
  id: string;
  emoji: string;
  name: string;
  flavor: string;
  effect: ModifierEffect;
  /** multiplier (1.0 = no change) */
  factor: number;
  /** additive bonus (e.g. +0.5 lives) — used for starting_lives */
  bonus?: number;
  isBuff: boolean;
  roles?: RoleId[]; // если указано — только для этих ролей
}

export const MODIFIERS: Modifier[] = [
  {
    id: 'overtime_expected',
    emoji: '⏰',
    name: 'Ожидаются овертаймы',
    flavor: 'Компания «ценит» твоё время. Спавн ×1.4.',
    effect: 'spawn_density',
    factor: 1.4,
    isBuff: false,
  },
  {
    id: 'toxic_pm',
    emoji: '🌶️',
    name: 'Токсичный PM',
    flavor: 'Daily standup в 9:00. Решения меняются ежедневно.',
    effect: 'spawn_density',
    factor: 1.2,
    isBuff: false,
  },
  {
    id: 'remote_revoked',
    emoji: '🏢',
    name: 'Удалёнка отозвана',
    flavor: 'Приказ сверху: «Все в офис». Скорость -20%.',
    effect: 'speed',
    factor: 0.8,
    isBuff: false,
  },
  {
    id: 'layoff_season',
    emoji: '📄',
    name: 'Сезон сокращений',
    flavor: 'HR рассылает письма. -1 жизнь, но ×2 к комбо.',
    effect: 'starting_lives',
    factor: 1,
    bonus: -1,
    isBuff: false,
  },
  {
    id: 'usd_salary',
    emoji: '💰',
    name: 'Зарплата в USD',
    flavor: 'Платят в долларах. Все пикапы дают ×2 очков.',
    effect: 'multiplier',
    factor: 2.0,
    isBuff: true,
  },
  {
    id: 'open_source',
    emoji: '🌟',
    name: 'Open-source проект',
    flavor: 'Контрибьюторы со всего мира. +1 жизнь, скорость -15%.',
    effect: 'starting_lives',
    factor: 1,
    bonus: 1,
    isBuff: true,
  },
  {
    id: 'senior_intern',
    emoji: '🎓',
    name: 'Intern под крылом',
    flavor: 'Ты — наставник. Multiplier +0.5 к комбо.',
    effect: 'multiplier',
    factor: 1.25,
    isBuff: true,
    roles: ['senior-fullstack', 'devops', 'ml-engineer', 'mobile-developer'],
  },
  {
    id: 'demo_day',
    emoji: '🎤',
    name: 'Demo Day',
    flavor: 'Завтра показ инвесторам. QTE сложнее, но комбо ×1.5.',
    effect: 'qte_difficulty',
    factor: 1.3,
    isBuff: true,
  },
];

/** Pick 2 random modifiers для run — стремимся к 1 buff + 1 debuff. */
export const pickModifiersForRun = (roleId: RoleId): [Modifier, Modifier] => {
  const available = MODIFIERS.filter((m) => !m.roles || m.roles.includes(roleId));
  const buffs = available.filter((m) => m.isBuff);
  const debuffs = available.filter((m) => !m.isBuff);

  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

  const buff = buffs.length > 0 ? pickRandom(buffs) : pickRandom(available.filter((m) => m.isBuff));
  const debuff = debuffs.length > 0 ? pickRandom(debuffs) : pickRandom(available.filter((m) => !m.isBuff));

  return [buff ?? MODIFIERS[0]!, debuff ?? MODIFIERS[1]!];
};

export interface ModifiersApplied {
  speedFactor: number;
  spawnDensityFactor: number;
  multiplierBonus: number;
  livesBonus: number;
  qteDifficultyFactor: number;
}

export const applyModifiers = (mods: Modifier[]): ModifiersApplied => {
  const result: ModifiersApplied = {
    speedFactor: 1,
    spawnDensityFactor: 1,
    multiplierBonus: 0,
    livesBonus: 0,
    qteDifficultyFactor: 1,
  };
  for (const m of mods) {
    switch (m.effect) {
      case 'spawn_density':
        result.spawnDensityFactor *= m.factor;
        break;
      case 'speed':
        result.speedFactor *= m.factor;
        break;
      case 'multiplier':
        result.multiplierBonus += m.factor - 1; // +0.25 для factor 1.25
        break;
      case 'starting_lives':
        result.livesBonus += m.bonus ?? 0;
        break;
      case 'qte_difficulty':
        result.qteDifficultyFactor *= m.factor;
        break;
    }
  }
  return result;
};