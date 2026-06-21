/**
 * Pickups — «плюсы в резюме». Увеличивают score, иногда лечат.
 */

export type PickupType = 'commit' | 'coffee' | 'system-design' | 'mentor' | 'remote-day';

export interface PickupConfig {
  type: PickupType;
  emoji: string;
  label: string;
  /** очков за подбор */
  score: number;
  /** восстанавливает HP если > 0 */
  heal: number;
  /** продлевает combo freeze на N мс */
  comboFreezeMs: number;
  weight: number;
}

export const PICKUPS: Record<PickupType, PickupConfig> = {
  commit: {
    type: 'commit',
    emoji: '✅',
    label: 'Good Commit',
    score: 10,
    heal: 0,
    comboFreezeMs: 0,
    weight: 6,
  },
  coffee: {
    type: 'coffee',
    emoji: '☕',
    label: 'Coffee',
    score: 15,
    heal: 1,
    comboFreezeMs: 0,
    weight: 3,
  },
  'system-design': {
    type: 'system-design',
    emoji: '🏗️',
    label: 'System Design',
    score: 50,
    heal: 0,
    comboFreezeMs: 2000,
    weight: 1,
  },
  mentor: {
    type: 'mentor',
    emoji: '🧑‍🏫',
    label: 'Mentorship',
    score: 25,
    heal: 0,
    comboFreezeMs: 1500,
    weight: 2,
  },
  'remote-day': {
    type: 'remote-day',
    emoji: '🏠',
    label: 'Remote Day',
    score: 20,
    heal: 0,
    comboFreezeMs: 1000,
    weight: 2,
  },
};

export const PICKUP_LIST: PickupConfig[] = Object.values(PICKUPS);

export const pickPickup = (): PickupConfig => {
  const totalWeight = PICKUP_LIST.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const p of PICKUP_LIST) {
    roll -= p.weight;
    if (roll <= 0) return p;
  }
  return PICKUP_LIST[0]!;
};