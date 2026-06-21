/**
 * PixiApp — единая точка PixiJS Application.
 * Scene switching через swap container.
 */

import { Application } from 'pixi.js';
import { WORLD } from './world';
import type { Scene } from './types';

export class PixiApp {
  readonly app: Application;
  private current: Scene | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.app = new Application();
    void this.app.init({
      canvas,
      width: WORLD.WIDTH,
      height: WORLD.HEIGHT,
      backgroundColor: 0x0a0a0f,
      antialias: true,
      resolution: Math.min(2, window.devicePixelRatio || 1),
      autoDensity: true,
    });
  }

  async ready(): Promise<void> {
    await this.app.init;
  }

  setScene(scene: Scene) {
    if (this.current) {
      this.app.stage.removeChild(this.current.container);
      this.current.destroy();
    }
    this.current = scene;
    this.app.stage.addChild(scene.container);
  }

  destroy() {
    if (this.current) this.current.destroy();
    void this.app.destroy(true, { children: true });
  }
}