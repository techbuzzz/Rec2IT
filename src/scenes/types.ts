/**
 * Scene interface.
 */

import type { Container } from 'pixi.js';

export interface Scene {
  readonly container: Container;
  destroy(): void;
}