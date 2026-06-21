import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { useGameStore } from '@/systems/store';
import './index.css';

// Expose store for E2E testing / dev tools
if (import.meta.env.DEV || import.meta.env.MODE === 'production') {
  (window as unknown as { __GAME_STORE__: typeof useGameStore }).__GAME_STORE__ = useGameStore;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);