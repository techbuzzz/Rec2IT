/**
 * Telemetry — Plausible events (Phase 6).
 * Phase 1: console.log fallback чтобы было видно воронку.
 */

type EventName = 'load' | 'start' | 'qte_complete' | 'share' | 'leaderboard_submit' | 'death';

const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;

const send = (name: EventName, props?: Record<string, string | number>) => {
  // Plausible Cloud: POST to /api/event
  if (plausibleDomain && typeof window !== 'undefined') {
    void fetch('https://plausible.io/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        url: window.location.href,
        domain: plausibleDomain,
        props,
      }),
      mode: 'no-cors',
      keepalive: true,
    }).catch(() => {});
  } else {
    // dev fallback
    if (import.meta.env.DEV) {
      console.log(`[telemetry] ${name}`, props ?? '');
    }
  }
};

export const telemetry = {
  load: () => send('load'),
  start: (role: string) => send('start', { role }),
  qte_complete: (qteType: string, perfect: boolean) =>
    send('qte_complete', { qteType, perfect: perfect ? '1' : '0' }),
  share: (channel: string, score: number) => send('share', { channel, score }),
  leaderboard_submit: (score: number) => send('leaderboard_submit', { score }),
  death: (distance: number, score: number, role: string) =>
    send('death', { distance, score, role }),
};