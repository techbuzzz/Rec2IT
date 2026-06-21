/**
 * Tests for lib/utils.ts — formatting and URL helpers.
 */

import { describe, expect, it, vi } from 'vitest';

describe('formatNumber', async () => {
  const { formatNumber } = await import('@/lib/utils');

  it('rounds and formats integer with thousands separator', () => {
    const result = formatNumber(1234);
    // ru-RU uses non-breaking space (\xa0) as thousands separator
    expect(result.replace('\xa0', ' ')).toBe('1 234');
    expect(result.length).toBeGreaterThan(3);
  });

  it('rounds floats', () => {
    const result = formatNumber(1234.7);
    expect(result.replace('\xa0', ' ')).toBe('1 235');
    expect(result.length).toBeGreaterThan(3);
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatDuration', async () => {
  const { formatDuration } = await import('@/lib/utils');

  it('formats seconds only', () => {
    expect(formatDuration(45_000)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125_000)).toBe('2:05');
  });

  it('zero returns 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});

describe('formatDistance', async () => {
  const { formatDistance } = await import('@/lib/utils');

  it('rounds and appends м', () => {
    expect(formatDistance(123.4)).toBe('123м');
  });

  it('handles round numbers', () => {
    expect(formatDistance(500)).toBe('500м');
  });
});

describe('buildUtmUrl', async () => {
  it('adds utm params to base URL', async () => {
    const { buildUtmUrl } = await import('@/lib/utils');
    const url = buildUtmUrl('twitter', 'https://jobrun.gg');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('utm_source')).toBe('share');
    expect(parsed.searchParams.get('utm_medium')).toBe('twitter');
    expect(parsed.searchParams.get('utm_campaign')).toBe('phase3');
  });

  it('defaults base to env URL', async () => {
    const original = import.meta.env.VITE_PUBLIC_URL;
    import.meta.env.VITE_PUBLIC_URL = 'https://custom.com';
    const { buildUtmUrl } = await import('@/lib/utils');
    const url = buildUtmUrl('telegram');
    expect(url).toContain('custom.com');
    import.meta.env.VITE_PUBLIC_URL = original;
  });

  it('defaults base when env not set', async () => {
    const original = import.meta.env.VITE_PUBLIC_URL;
    delete import.meta.env.VITE_PUBLIC_URL;
    const { buildUtmUrl } = await import('@/lib/utils');
    const url = buildUtmUrl('telegram');
    expect(url).toContain('jobrun.gg');
    import.meta.env.VITE_PUBLIC_URL = original;
  });
});
