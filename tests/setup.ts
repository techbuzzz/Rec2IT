/**
 * Vitest setup — mocks and polyfills for jsdom environment.
 */

// Web Audio API mock (jsdom doesn't implement it)
class MockAudioParam {
  value = 0;
  setValueAtTime(_v: number, _t: number) {}
  linearRampToValueAtTime(_v: number, _t: number) {}
  exponentialRampToValueAtTime(_v: number, _t: number) {}
  setTargetAtTime(_v: number, _t: number, _tau: number) {}
  cancelScheduledValues(_t: number) {}
}

class MockOscillator {
  type: OscillatorType = 'sine';
  frequency = new MockAudioParam();
  connect(_node: unknown) {}
  start(_when?: number) {}
  stop(_when?: number) {}
}

class MockGainNode {
  gain = new MockAudioParam();
  connect(_node: unknown) {}
}

class MockBufferSource {
  buffer: AudioBuffer | null = null;
  connect(_node: unknown) {}
  start(_when?: number) {}
  stop(_when?: number) {}
}

class MockAudioBuffer {
  constructor(_channels: number, _length: number, _sampleRate: number) {}
  getChannelData(_ch: number): Float32Array {
    return new Float32Array(0);
  }
}

class MockAudioContext {
  currentTime = 0;
  destination = {};
  state: 'running' | 'suspended' | 'closed' = 'running';
  sampleRate = 44100;

  createOscillator(): MockOscillator { return new MockOscillator(); }
  createGain(): MockGainNode { return new MockGainNode(); }
  createBufferSource(): MockBufferSource { return new MockBufferSource(); }
  createBuffer(_channels: number, length: number, sampleRate: number): MockAudioBuffer {
    return new MockAudioBuffer(_channels, length, sampleRate);
  }
  resume(): Promise<void> { return Promise.resolve(); }
  suspend(): Promise<void> { return Promise.resolve(); }
  close(): Promise<void> { return Promise.resolve(); }
}

// @ts-expect-error - global stub for tests
global.AudioContext = MockAudioContext;
// @ts-expect-error - alias
global.window.AudioContext = MockAudioContext;

// Web Crypto polyfill (jsdom is incomplete)
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: false,
  });
}

// ResizeObserver mock (Pixi v8 needs it)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error - global stub
global.ResizeObserver = MockResizeObserver;
// @ts-expect-error - alias
global.window.ResizeObserver = MockResizeObserver;

// matchMedia mock
Object.defineProperty(global.window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Suppress expected console warnings from Pixi v8 in jsdom
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args[0]?.toString() ?? '';
  if (
    msg.includes('PixiJS') ||
    msg.includes('WebGL') ||
    msg.includes('plugin') ||
    msg.includes('canvas')
  ) {
    return;
  }
  originalWarn(...args as Parameters<typeof originalWarn>);
};

// Setup env for tests
process.env.NODE_ENV = 'test';
process.env.VITE_RUN_SECRET = 'test-secret-for-unit-tests';