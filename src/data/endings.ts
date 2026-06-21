/**
 * Endings — мемные финалы. Phase 2: 8 финалов × 3 роли = 24 комбинации.
 * Tier-логика: score-based + role-specific fallback.
 */

import type { RoleId } from './roles';

export type EndingTier = 'default' | 'skill' | 'toxic' | 'hidden';

export interface EndingTemplate {
  id: string;
  tier: EndingTier;
  emoji: string;
  title: string;
  reason: string;
  tweetHook: string;
}

const COMMON_ENDINGS: Omit<EndingTemplate, 'id'>[] = [
  {
    tier: 'default',
    emoji: '🌱',
    title: 'Ещё зелёный',
    reason: 'HR сказал «вернитесь через год, наберётесь опыта».',
    tweetHook: 'Ещё зелёный. Не взяли.',
  },
  {
    tier: 'default',
    emoji: '😐',
    title: 'Middle mid-life',
    reason: 'Middle middle. Не junior, не senior. Середина.',
    tweetHook: 'Middle middle. Классика.',
  },
  {
    tier: 'skill',
    emoji: '🎓',
    title: 'Перерос вакансию',
    reason: 'Ты senior, они искали middle. Не твой уровень.',
    tweetHook: 'Перерос. Проблема их, не моя.',
  },
  {
    tier: 'toxic',
    emoji: '🌶️',
    title: 'Токсичная кухня',
    reason: 'Культурный код не совпал. Ты слишком много улыбался.',
    tweetHook: 'Culture fit не прошёл. Уволился на 2-й день.',
  },
  {
    tier: 'skill',
    emoji: '🪤',
    title: 'Алгоритмическая ловушка',
    reason: 'Перевернуть строку — окей. LRU за 15 минут в Zoom — нет.',
    tweetHook: 'Алгоритмы — моя боль. И моя сила. Когда готов.',
  },
  {
    tier: 'default',
    emoji: '👻',
    title: 'Призрак',
    reason: 'HR не отвечает 3 недели. Вакансия висит. Жизнь идёт.',
    tweetHook: 'Ghosted. Классика найма 2026.',
  },
  {
    tier: 'toxic',
    emoji: '🎪',
    title: 'Фейковый оффер',
    reason: 'Оффер дали. Забрали. Дали снова. Забрали.',
    tweetHook: 'Оффер yo-yo. Дотянешь?',
  },
  {
    tier: 'hidden',
    emoji: '🏆',
    title: 'Легенда 5000м',
    reason: '5 км без единой ошибки. Ты сломал симулятор найма.',
    tweetHook: '5 км без ошибок. Я сломал найм 2026.',
  },
];

/** ID = `${roleId}-${slug}`, всего 24 */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-|-$/g, '');

const ROLES: RoleId[] = ['junior-frontend', 'middle-backend', 'senior-fullstack'];

export const ENDINGS: EndingTemplate[] = ROLES.flatMap((role) =>
  COMMON_ENDINGS.map((e) => ({
    ...e,
    id: `${role}-${slugify(e.title)}`,
  })),
);

/** Score → ending: hidden при 5000+, toxic при 3000+, skill при 2000+, иначе default. */
export const pickEndingByScore = (score: number, roleId: RoleId): EndingTemplate => {
  const roleEndings = ENDINGS.filter((e) => e.id.startsWith(roleId));
  if (score >= 5000) return roleEndings.find((e) => e.tier === 'hidden')!;
  if (score >= 3000) return roleEndings.find((e) => e.tier === 'toxic')!;
  if (score >= 2000) return roleEndings.find((e) => e.tier === 'skill')!;
  // default: ищем default-тир; fallback на первый
  return roleEndings.find((e) => e.tier === 'default') ?? roleEndings[0]!;
};

/** 6 emoji-квадратов Wordle-style: позиции «плюсов» в резюме */
export const makeEmojiGrid = (perfect: number, ok: number, fail: number): string[] => {
  const cells: string[] = [];
  for (let i = 0; i < perfect; i++) cells.push('🟩');
  for (let i = 0; i < ok; i++) cells.push('🟨');
  for (let i = 0; i < fail; i++) cells.push('🟥');
  while (cells.length < 6) cells.push('⬜');
  return cells.slice(0, 6);
};