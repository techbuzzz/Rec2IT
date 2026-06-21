import { Component, type ReactNode } from 'react';
import { GameCanvas } from './ui/GameCanvas';
import { GameUI } from './ui/GameUI';
import { telemetry } from '@/systems/telemetry';
import { useEffect } from 'react';

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    console.error('[App ErrorBoundary]', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-bg text-white">
          <div className="text-center max-w-md p-6">
            <div className="text-4xl mb-4">💥</div>
            <h2 className="text-2xl font-bold mb-2">Что-то сломалось</h2>
            <p className="text-sm text-gray-400 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App = () => {
  useEffect(() => {
    telemetry.load();
  }, []);

  return (
    <ErrorBoundary>
      <div className="absolute inset-0 overflow-hidden">
        <GameCanvas />
        <GameUI />
      </div>
    </ErrorBoundary>
  );
};