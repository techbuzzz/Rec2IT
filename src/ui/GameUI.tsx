import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/systems/store';
import { Menu } from './Menu';
import { Briefing } from './Briefing';
import { HUD } from './HUD';
import { QTEOverlay } from './QTEOverlay';
import { EndScene } from './EndScene';
import { ModifiersScreen } from './ModifiersScreen';
import { audioBus } from '@/systems/audioBus';

export const GameUI = () => {
  const scene = useGameStore((s) => s.scene);
  const showModifiers = useGameStore((s) => s.showModifiers);
  const qte = useGameStore((s) => s.qte);
  const moveLeft = useGameStore((s) => s.moveLeft);
  const moveRight = useGameStore((s) => s.moveRight);
  const jump = useGameStore((s) => s.jump);
  const slide = useGameStore((s) => s.slide);
  const startRun = useGameStore((s) => s.startRun);
  const endData = useGameStore((s) => s.endData);
  const roleId = useGameStore((s) => s.roleId);
  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);
  const isPaused = useGameStore((s) => s.isPaused);

  // Audio init on first interaction
  useEffect(() => {
    const init = () => {
      audioBus.init();
      window.removeEventListener('pointerdown', init);
      window.removeEventListener('keydown', init);
    };
    window.addEventListener('pointerdown', init, { once: true });
    window.addEventListener('keydown', init, { once: true });
    return () => {
      window.removeEventListener('pointerdown', init);
      window.removeEventListener('keydown', init);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // init audio context on first key
      audioBus.init();

      if (e.code === 'KeyR' && endData) {
        if (roleId) startRun(roleId);
        return;
      }

      if (scene !== 'run') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          moveRight();
          break;
        case 'Space':
          e.preventDefault();
          if (e.repeat) return;
          jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          if (e.repeat) return;
          slide();
          break;
        case 'KeyP':
        case 'Escape':
          isPaused ? resume() : pause();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scene, moveLeft, moveRight, jump, slide, startRun, endData, roleId, pause, resume, isPaused]);

  return (
    <>
      {scene === 'run' && <HUD />}

      <AnimatePresence mode="wait">
        {scene === 'menu' && <Menu key="menu" />}
        {scene === 'briefing' && <Briefing key="briefing" />}
        {scene === 'qte' && qte && <QTEOverlay key="qte" qte={qte.qte} startedAtMs={qte.startedAtMs} />}
        {scene === 'end' && <EndScene key="end" />}
      </AnimatePresence>

      {showModifiers && scene === 'briefing' && <ModifiersScreen />}
    </>
  );
};