/**
 * AudioBus — Web Audio API synthesis, без файлов.
 * Phase 1: stub с инициализацией по первому user gesture.
 */

class AudioBus {
  private ctx: AudioContext | null = null;
  private muted = false;

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
  }

  setMuted(m: boolean) {
    this.muted = m;
  }

  isMuted() {
    return this.muted;
  }

  private ensure(): AudioContext | null {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  jump() {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  pickup() {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  hit() {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    // noise burst
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  death() {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.4);
  }
}

export const audioBus = new AudioBus();