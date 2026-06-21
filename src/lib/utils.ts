import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatNumber = (n: number): string => Math.round(n).toLocaleString('ru-RU');

export const formatDuration = (ms: number): string => {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatDistance = (m: number): string => `${Math.round(m)}м`;

export const buildUtmUrl = (
  channel: string,
  base: string = (import.meta.env.VITE_PUBLIC_URL as string) || 'https://jobrun.gg',
): string => {
  const url = new URL(base);
  url.searchParams.set('utm_source', 'share');
  url.searchParams.set('utm_medium', channel);
  url.searchParams.set('utm_campaign', 'phase3');
  return url.toString();
};