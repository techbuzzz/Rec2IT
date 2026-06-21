/**
 * Audio tests — Web Audio API synthesis (mocked AudioContext).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { audioBus } from '@/systems/audioBus';

describe('audioBus', () => {
  beforeEach(() => {
    audioBus.setMuted(false);
    audioBus.init();
  });

  it('initializes without error', () => {
    expect(() => audioBus.init()).not.toThrow();
  });

  it('mute state works', () => {
    audioBus.setMuted(true);
    expect(audioBus.isMuted()).toBe(true);
    audioBus.setMuted(false);
    expect(audioBus.isMuted()).toBe(false);
  });

  it('all sound methods are no-ops when muted', () => {
    audioBus.setMuted(true);
    expect(() => {
      audioBus.jump();
      audioBus.pickup();
      audioBus.step();
      audioBus.qtePerfect();
      audioBus.qteOk();
      audioBus.qteFail();
      audioBus.hit();
      audioBus.death();
    }).not.toThrow();
    audioBus.setMuted(false);
  });

  it('all sound methods run without error when not muted', () => {
    audioBus.setMuted(false);
    expect(() => {
      audioBus.jump();
      audioBus.pickup();
      audioBus.step();
      audioBus.qtePerfect();
      audioBus.qteOk();
      audioBus.qteFail();
      audioBus.hit();
      audioBus.death();
    }).not.toThrow();
  });

  it('qtePerfect creates 3 oscillators (C-major chord)', () => {
    const oscSpy = vi.spyOn(global.AudioContext.prototype, 'createOscillator');
    audioBus.qtePerfect();
    expect(oscSpy).toHaveBeenCalledTimes(3);
    oscSpy.mockRestore();
  });

  it('qteFail creates 2 oscillators (dissonance)', () => {
    const oscSpy = vi.spyOn(global.AudioContext.prototype, 'createOscillator');
    audioBus.qteFail();
    expect(oscSpy).toHaveBeenCalledTimes(2);
    oscSpy.mockRestore();
  });

  it('hit() uses AudioBuffer (noise burst)', () => {
    const bufSpy = vi.spyOn(global.AudioContext.prototype, 'createBuffer');
    audioBus.hit();
    expect(bufSpy).toHaveBeenCalled();
    bufSpy.mockRestore();
  });
});