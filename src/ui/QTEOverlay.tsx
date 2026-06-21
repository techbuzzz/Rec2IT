/**
 * QTE модалки — 5 типов с реальной логикой.
 *
 * single-choice: 3 кнопки
 * spot-bug: клик в зоне с багом (highlight через offset)
 * sequence: drag-and-drop reorder (через 2 клика — swap)
 * slider: range input с target indicator
 * hold: button hold N ms с progress bar
 */

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/systems/store';
import { evaluateQTE, type QTE, type QTEResult } from '@/data/qtes';
import { audioBus } from '@/systems/audioBus';
import { telemetry } from '@/systems/telemetry';
import { cn } from '@/lib/utils';

interface Props {
  qte: QTE;
  startedAtMs: number;
}

const useCountdown = (durationMs: number, startedAtMs: number) => {
  const [remaining, setRemaining] = useState(durationMs);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() - startedAtMs;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);
      if (left > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, startedAtMs]);
  return remaining;
};

const ProgressBar = ({ remaining, total }: { remaining: number; total: number }) => {
  const pct = (remaining / total) * 100;
  const perfect = pct > 70;
  return (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={cn(
          'h-full rounded-full',
          perfect ? 'bg-accent-good' : pct > 30 ? 'bg-accent-warn' : 'bg-accent-bad',
        )}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
};

const SingleChoice = ({ qte, onResolve }: { qte: Extract<QTE, { type: 'single-choice' }>; onResolve: (r: QTEResult) => void }) => {
  return (
    <div className="grid grid-cols-1 gap-3 mt-4">
      {qte.options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onResolve(evaluateQTE(qte, { kind: 'choice', optionId: opt.id }, performance.now() - performance.now()))}
          className="bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 rounded-xl p-4 text-left transition-all"
        >
          <span className="font-mono text-xs text-gray-500 mr-2">{opt.id.toUpperCase()}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

const SpotBug = ({ qte, onResolve, startedAtMs }: { qte: Extract<QTE, { type: 'spot-bug' }>; onResolve: (r: QTEResult) => void; startedAtMs: number }) => {
  const codeRef = useRef<HTMLPreElement>(null);
  const handleClick = (e: React.MouseEvent<HTMLPreElement>) => {
    const pre = codeRef.current;
    if (!pre) return;
    const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
    let charIndex = 0;
    if (range && pre.contains(range.startContainer)) {
      charIndex = getCharIndex(pre, range.startContainer, range.startOffset);
    } else {
      // fallback: position-based
      charIndex = Math.floor((e.nativeEvent.offsetX / pre.offsetWidth) * qte.code.length);
    }
    onResolve(evaluateQTE(qte, { kind: 'spot', charIndex }, performance.now() - startedAtMs));
  };
  return (
    <pre
      ref={codeRef}
      onClick={handleClick}
      className="mt-4 bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm whitespace-pre overflow-x-auto cursor-crosshair select-none"
    >
      {qte.code}
    </pre>
  );
};

const getCharIndex = (root: Node, node: Node, offset: number): number => {
  let count = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null = walker.nextNode();
  while (n) {
    if (n === node) return count + offset;
    count += n.textContent?.length ?? 0;
    n = walker.nextNode();
  }
  return count;
};

const Sequence = ({ qte, onResolve, startedAtMs }: { qte: Extract<QTE, { type: 'sequence' }>; onResolve: (r: QTEResult) => void; startedAtMs: number }) => {
  const [order, setOrder] = useState<string[]>(qte.items.map((i) => i.id));
  const [picked, setPicked] = useState<string | null>(null);
  const itemsById = Object.fromEntries(qte.items.map((i) => [i.id, i]));

  const tap = (id: string) => {
    if (picked === null) {
      setPicked(id);
    } else if (picked === id) {
      setPicked(null);
    } else {
      const newOrder = [...order];
      const a = newOrder.indexOf(picked);
      const b = newOrder.indexOf(id);
      if (a >= 0 && b >= 0) {
        [newOrder[a], newOrder[b]] = [newOrder[b]!, newOrder[a]!];
        setOrder(newOrder);
      }
      setPicked(null);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-gray-500">Тапни два элемента, чтобы поменять местами. Порядок важен.</p>
      <div className="space-y-2">
        {order.map((id) => (
          <button
            key={id}
            onClick={() => tap(id)}
            className={cn(
              'w-full p-3 rounded-xl border text-left transition-all',
              picked === id
                ? 'bg-blue-500/20 border-blue-400'
                : 'bg-white/5 border-white/10 hover:border-white/30',
            )}
          >
            {itemsById[id]?.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => onResolve(evaluateQTE(qte, { kind: 'sequence', order }, performance.now() - startedAtMs))}
        className="w-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl"
      >
        Готово →
      </button>
    </div>
  );
};

const Slider = ({ qte, onResolve, startedAtMs }: { qte: Extract<QTE, { type: 'slider' }>; onResolve: (r: QTEResult) => void; startedAtMs: number }) => {
  const [val, setVal] = useState(50);
  return (
    <div className="mt-6">
      <div className="text-center text-3xl font-bold font-mono mb-2">{val}</div>
      <div className="text-center text-xs text-gray-500 mb-3">цель: {qte.target}</div>
      <input
        type="range"
        min={0}
        max={100}
        value={val}
        onChange={(e) => setVal(parseInt(e.target.value, 10))}
        className="w-full h-3 rounded-full appearance-none bg-white/10 accent-blue-500"
      />
      <button
        onClick={() => onResolve(evaluateQTE(qte, { kind: 'slider', value: val }, performance.now() - startedAtMs))}
        className="w-full mt-6 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl"
      >
        Зафиксировать ✓
      </button>
    </div>
  );
};

const Hold = ({ qte, onResolve, startedAtMs }: { qte: Extract<QTE, { type: 'hold' }>; onResolve: (r: QTEResult) => void; startedAtMs: number }) => {
  const [holding, setHolding] = useState(false);
  const [heldMs, setHeldMs] = useState(0);
  const startedRef = useRef<number>(0);

  useEffect(() => {
    if (!holding) return;
    const start = performance.now();
    startedRef.current = start;
    const tick = () => {
      const elapsed = performance.now() - start;
      setHeldMs(elapsed);
      if (elapsed < qte.holdMs + qte.okTolerance + 500) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, [holding, qte.holdMs, qte.okTolerance]);

  const release = () => {
    setHolding(false);
    onResolve(evaluateQTE(qte, { kind: 'hold', heldMs }, performance.now() - startedAtMs));
  };

  const pct = Math.min(100, (heldMs / qte.holdMs) * 100);
  return (
    <div className="mt-6">
      <button
        onMouseDown={() => setHolding(true)}
        onMouseUp={release}
        onMouseLeave={release}
        onTouchStart={() => setHolding(true)}
        onTouchEnd={release}
        className={cn(
          'w-full py-8 rounded-2xl font-bold text-2xl transition-all',
          holding
            ? 'bg-gradient-to-br from-yellow-500 to-red-500 text-white scale-95'
            : 'bg-white/5 border border-white/10 hover:border-white/30',
        )}
      >
        {holding ? '⏳ Удерживай…' : qte.action}
      </button>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-3">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-red-500"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>
      <p className="text-xs text-gray-500 text-center mt-2">
        Удержи {qte.holdMs}мс (допуск ±{qte.okTolerance}мс)
      </p>
    </div>
  );
};

export const QTEOverlay = ({ qte, startedAtMs }: Props) => {
  const resolveQTE = useGameStore((s) => s.resolveQTE);
  const skipQTE = useGameStore((s) => s.skipQTE);
  const remaining = useCountdown(qte.duration, startedAtMs);

  // timeout
  useEffect(() => {
    if (remaining > 0) return;
    const result = evaluateQTE(qte, { kind: 'timeout' }, performance.now() - startedAtMs);
    handleResolve(result);
  }, [remaining]);

  const handleResolve = (result: QTEResult) => {
    if (result.outcome === 'perfect') audioBus.qtePerfect();
    else if (result.outcome === 'ok') audioBus.qteOk();
    else audioBus.qteFail();
    telemetry.qte_complete(qte.id, result.outcome === 'perfect');
    resolveQTE(result);
    // exit после короткой паузы для анимации
    setTimeout(() => {
      useGameStore.setState((s) => ({
        qte: null,
        scene: 'run',
        isPaused: false,
        nextQteDistance: s.distance + 500,
      }));
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
    >
      <div className="w-full max-w-2xl bg-bg-card border border-white/20 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-1">
              {qte.type.replace('-', ' ')}
            </div>
            <h2 className="text-2xl font-bold">{qte.prompt}</h2>
          </div>
          <button
            onClick={skipQTE}
            className="text-gray-500 hover:text-white text-sm"
            title="Сдаться (fail)"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-400 italic mb-4">{qte.flavor}</p>
        <ProgressBar remaining={remaining} total={qte.duration} />

        {qte.type === 'single-choice' && <SingleChoice qte={qte} onResolve={handleResolve} />}
        {qte.type === 'spot-bug' && <SpotBug qte={qte} onResolve={handleResolve} startedAtMs={startedAtMs} />}
        {qte.type === 'sequence' && <Sequence qte={qte} onResolve={handleResolve} startedAtMs={startedAtMs} />}
        {qte.type === 'slider' && <Slider qte={qte} onResolve={handleResolve} startedAtMs={startedAtMs} />}
        {qte.type === 'hold' && <Hold qte={qte} onResolve={handleResolve} startedAtMs={startedAtMs} />}
      </div>
    </motion.div>
  );
};