/**
 * Obstacles — «красные флаги» найма 2026.
 * Spawner выбирает случайный тип, проверяет lane-свободность.
 */

export type ObstacleType =
  | 'red-flag'
  | 'impostor-syndrome'
  | 'layoff-memo'
  | 'culture-fit'
  | 'legacy-code';

export interface ObstacleConfig {
  type: ObstacleType;
  emoji: string;
  label: string;
  /** damage on hit */
  damage: number;
  /** относительный вес спавна (больше = чаще) */
  weight: number;
  /** занимает lanes: 1 = одна полоса, 3 = блокирует все */
  width: number;
}

export const OBSTACLES: Record<ObstacleType, ObstacleConfig> = {
  'red-flag': {
    type: 'red-flag',
    emoji: '🚩',
    label: 'Red Flag',
    damage: 1,
    weight: 5,
    width: 1,
  },
  'impostor-syndrome': {
    type: 'impostor-syndrome',
    emoji: '🎭',
    label: 'Impostor Syndrome',
    damage: 1,
    weight: 4,
    width: 1,
  },
  'layoff-memo': {
    type: 'layoff-memo',
    emoji: '📄',
    label: 'Layoff Memo',
    damage: 2,
    weight: 2,
    width: 1,
  },
  'culture-fit': {
    type: 'culture-fit',
    emoji: '🤝',
    label: 'Culture Fit',
    damage: 1,
    weight: 3,
    width: 1,
  },
  'legacy-code': {
    type: 'legacy-code',
    emoji: '🗑️',
    label: 'Legacy Code',
    damage: 1,
    weight: 3,
    width: 1,
  },
};

export const OBSTACLE_LIST: ObstacleConfig[] = Object.values(OBSTACLES);

/** weighted random pick */
export const pickObstacle = (): ObstacleConfig => {
  const totalWeight = OBSTACLE_LIST.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const o of OBSTACLE_LIST) {
    roll -= o.weight;
    if (roll <= 0) return o;
  }
  return OBSTACLE_LIST[0]!;
};