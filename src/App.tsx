import { GameCanvas } from './ui/GameCanvas';
import { GameUI } from './ui/GameUI';
import { telemetry } from '@/systems/telemetry';
import { useEffect } from 'react';

export const App = () => {
  useEffect(() => {
    telemetry.load();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <GameCanvas />
      <GameUI />
    </div>
  );
};