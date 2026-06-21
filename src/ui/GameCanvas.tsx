/**
 * GameCanvas — host для PixiJS Application. Управляет swap сцен.
 * Graceful fallback: если Pixi init падает (no WebGL, headless), React UI продолжает работать.
 */

import { useEffect, useRef, useState } from 'react';
import { PixiApp } from '@/scenes/PixiApp';
import { BootScene } from '@/scenes/BootScene';
import { RunScene } from '@/scenes/RunScene';
import { useGameStore } from '@/systems/store';
import { WORLD } from '@/scenes/world';

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PixiApp | null>(null);
  const [pixiFailed, setPixiFailed] = useState(false);
  const scene = useGameStore((s) => s.scene);
  const isRunning = useGameStore((s) => s.isRunning);
  const isPaused = useGameStore((s) => s.isPaused);

  // init PixiApp один раз
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const app = new PixiApp(canvasRef.current);
      appRef.current = app;
      app
        .ready()
        .then(() => {
          app.setScene(new BootScene(() => useGameStore.setState({ scene: 'menu' })));
        })
        .catch((err) => {
          console.warn('[Pixi] init failed, continuing without Canvas:', err);
          setPixiFailed(true);
          // всё равно переходим в меню
          useGameStore.setState({ scene: 'menu' });
        });
    } catch (err) {
      console.warn('[Pixi] constructor failed:', err);
      setPixiFailed(true);
      useGameStore.setState({ scene: 'menu' });
    }
    return () => {
      try {
        appRef.current?.destroy();
      } catch {
        /* ignore */
      }
      appRef.current = null;
    };
  }, []);

  // swap scenes on state change
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    if (scene === 'run' && isRunning) {
      try {
        app.setScene(new RunScene());
      } catch (err) {
        console.warn('[Pixi] RunScene failed:', err);
      }
    }
  }, [scene, isRunning]);

  const aspect = WORLD.WIDTH / WORLD.HEIGHT;

  if (pixiFailed) {
    // HTML-only fallback (headless / no-WebGL)
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-bg">
        <div
          className="relative shadow-2xl shadow-black/50 bg-gradient-to-b from-bg-panel to-bg-card flex items-center justify-center"
          style={{
            width: 'min(100vw, calc(100vh * ' + aspect + '))',
            height: 'min(100vh, calc(100vw / ' + aspect + '))',
            maxWidth: '100vw',
            maxHeight: '100vh',
          }}
        >
          <div className="text-center text-gray-600 text-sm">
            <div className="text-4xl mb-2 opacity-50">🏃</div>
            <div>PixiJS не активен (headless / no WebGL)</div>
          </div>
        </div>
      </div>
    );
  }

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
        {scene !== 'run' && <div className="absolute inset-0 bg-bg rounded-2xl" />}
        {scene === 'run' && isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-4xl font-bold">
            PAUSED
          </div>
        )}
      </div>
    </div>
  );
};