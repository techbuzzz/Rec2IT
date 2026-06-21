/**
 * GameCanvas — host для PixiJS Application. Управляет swap сцен.
 */

import { useEffect, useRef } from 'react';
import { PixiApp } from '@/scenes/PixiApp';
import { BootScene } from '@/scenes/BootScene';
import { RunScene } from '@/scenes/RunScene';
import { useGameStore } from '@/systems/store';
import { WORLD } from '@/scenes/world';

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PixiApp | null>(null);
  const scene = useGameStore((s) => s.scene);
  const isRunning = useGameStore((s) => s.isRunning);
  const isPaused = useGameStore((s) => s.isPaused);

  // init PixiApp один раз
  useEffect(() => {
    if (!canvasRef.current) return;
    const app = new PixiApp(canvasRef.current);
    appRef.current = app;
    app.ready().then(() => {
      app.setScene(new BootScene(() => useGameStore.setState({ scene: 'menu' })));
    });
    return () => {
      app.destroy();
      appRef.current = null;
    };
  }, []);

  // swap scenes on state change
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    if (scene === 'menu' || scene === 'briefing' || scene === 'end') {
      // можно оставить BootScene как фон или вообще скрыть canvas
      // Phase 1: показываем статичный bg через CSS overlay, canvas пустой
    }
    if (scene === 'run' && isRunning) {
      app.setScene(new RunScene());
    }
  }, [scene, isRunning]);

  // CSS scale — игра 1200×720, viewport responsive
  const aspect = WORLD.WIDTH / WORLD.HEIGHT;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg">
      <div
        className="relative shadow-2xl shadow-black/50"
        style={{
          width: 'min(100vw, calc(100vh * ' + aspect + '))',
          height: 'min(100vh, calc(100vw / ' + aspect + '))',
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full rounded-2xl"
          style={{ imageRendering: 'pixelated' }}
        />
        {scene !== 'run' && (
          <div className="absolute inset-0 bg-bg rounded-2xl">
            {/* menu/briefing/end рисуются как React overlay выше */}
          </div>
        )}
        {scene === 'run' && isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-4xl font-bold">
            PAUSED
          </div>
        )}
      </div>
    </div>
  );
};