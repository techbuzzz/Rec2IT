/**
 * Endings — мемные финалы по performance tiers.
 * 8 финалов × 3 роли = 24 комбинации. Phase 1 — только шаблоны.
 */

export type EndingTier = 'default' | 'skill' | 'toxic' | 'hidden';

export interface EndingTemplate {
  id: string;
  tier: EndingTier;
  emoji: string;
  title: string;
  reason: string;
  /** префикс твита */
  tweetHook: string;
}

export const ENDINGS: EndingTemplate[] = [
  {
    id: 'junior-too-green',
    tier: 'default',
    emoji: '🌱',
    title: '«Ещё зелёный»',
    reason: 'HR сказал «вернитесь через год, наберётесь опыта».',
    tweetHook: 'Ещё зелёный. Не взяли.',
  },
  {
    id: 'middle-mid-life',
    tier: 'default',
    emoji: '😐',
    title: '«Mid mid-life»',
    reason: 'Middle middle. Не junior, не senior. Середина.',
    tweetHook: 'Middle middle. Классика.',
  },
  {
    id: 'senior-overqualified',
    tier: 'skill',
    emoji: '🎓',
    title: '«Перерос вакансию»',
    reason: 'Ты senior, они искали middle. Не твой уровень.',
    tweetHook: 'Перерос. Проблема их, не моя.',
  },
  {
    id: 'culture-mismatch',
    tier: 'toxic',
    emoji: '🌶️',
    title: '«Токсичная кухня»',
    reason: 'Культурный код не совпал. Ты слишком много улыбался.',
    tweetHook: 'Culture fit не прошёл. Уволился на 2-й день.',
  },
  {
    id: 'algorithm-trap',
    tier: 'skill',
    emoji: '🪤',
    title: '«Алгоритмическая ловушка»',
    reason: 'Перевернуть строку — окей. LRU за 15 минут в Zoom — нет.',
    tweetHook: 'Алгоритмы — моя боль. И моя сила. Когда готов.',
  },
  {
    id: 'ghosted',
    tier: 'default',
    emoji: '👻',
    title: '«Призрак»',
    reason: 'HR не отвечает 3 недели. Вакансия висит. Жизнь идёт.',
    tweetHook: 'Ghosted. Классика найма 2026.',
  },
  {
    id: 'fake-offer',
    tier: 'toxic',
    emoji: '🎪',
    title: '«Фейковый оффер»',
    reason: 'Оффер дали. Забрали. Дали снова. Забрали.',
    tweetHook: 'Оффер yo-yo. Дотянешь?',
  },
  {
    id: 'dream-offer',
    tier: 'hidden',
    emoji: '🏆',
    title: '«Легенда 5000м»',
    reason: '5 км без единой ошибки. Ты сломал симулятор найма.',
    tweetHook: '5 км без ошибок. Я сломал найм 2026.',
  },
];

export const pickEndingByScore = (score: number, roleId: string): EndingTemplate => {
  if (score >= 5000) return ENDINGS.find((e) => e.id === 'dream-offer')!;
  if (score >= 3000) return ENDINGS.find((e) => e.id === 'fake-offer')!;
  if (score >= 2000) return ENDINGS.find((e) => e.id === 'culture-mismatch')!;
  if (roleId === 'junior-frontend') return ENDINGS.find((e) => e.id === 'junior-too-green')!;
  if (roleId === 'middle-backend') return ENDINGS.find((e) => e.id === 'middle-mid-life')!;
  return ENDINGS.find((e) => e.id === 'senior-overqualified')!;
};

/** 6 emoji-квадратов Wordle-style: позиции «плюсов» в резюме */
export const makeEmojiGrid = (perfect: number, ok: number, fail: number): string[] => {
  const cells: string[] = [];
  for (let i = 0; i < perfect; i++) cells.push('🟩');
  for (let i = 0; i < ok; i++) cells.push('🟨');
  for (let i = 0; i < fail; i++) cells.push('⬜');
  while (cells.length < 6) cells.push('⬜');
  return cells.slice(0, 6);
};