/**
 * ShareCard v2 — Phase 3.
 *
 * Структура:
 * 1. Видимая интерактивная карточка (UI для пользователя)
 * 2. Скрытая off-screen карточка 1200x630 для PNG-рендера
 * 3. Кнопки: Twitter / Telegram / Copy / Download PNG / Web Share API
 *
 * Использует html-to-image (легче html2canvas, лучше с эмодзи).
 */

import { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { EndScreenData } from '@/systems/types';
import { getRole } from '@/data/roles';
import { pickEndingByScore, makeEmojiGrid } from '@/data/endings';
import { formatNumber, formatDuration } from '@/lib/utils';
import { telemetry } from '@/systems/telemetry';
import { motion } from 'framer-motion';

interface ShareCardProps {
  data: EndScreenData;
}

const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL as string) || 'https://jobrun.gg';

const buildUtmUrl = (channel: string) => {
  const url = new URL(PUBLIC_URL);
  url.searchParams.set('utm_source', 'share');
  url.searchParams.set('utm_medium', channel);
  url.searchParams.set('utm_campaign', 'phase3');
  return url.toString();
};

const ShareCardCanvas = ({
  data,
  emojiCells,
  ending,
  tweetText,
  innerRef,
}: {
  data: EndScreenData;
  emojiCells: string[];
  ending: ReturnType<typeof pickEndingByScore>;
  tweetText: string;
  innerRef: React.Ref<HTMLDivElement>;
}) => {
  const role = getRole(data.roleId);
  return (
    <div
      ref={innerRef}
      style={{
        width: 1200,
        height: 630,
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 60,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 72 }}>{role.emoji}</div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: role.accentColor }}>{role.name}</div>
            <div style={{ fontSize: 18, color: '#9ca3af' }}>Job Interview Runner · 2026</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2 }}>
            Score
          </div>
          <div style={{ fontSize: 64, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: role.accentColor, lineHeight: 1 }}>
            {formatNumber(data.score)}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 96, marginBottom: 8 }}>{ending.emoji}</div>
        <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>{ending.title}</div>
        <div style={{ fontSize: 18, color: '#9ca3af', fontStyle: 'italic' }}>«{ending.reason}»</div>
      </div>

      <div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
          {emojiCells.map((c, i) => (
            <div
              key={i}
              style={{
                width: 80,
                height: 80,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
              }}
            >
              {c}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: '#9ca3af' }}>
          <span>📏 {Math.round(data.distance)}м</span>
          <span>⏱ {formatDuration(data.durationMs)}</span>
          <span>🔥 ×{data.stats.maxCombo} combo</span>
          <span>🛡 {data.stats.qtePerfect}✓ / {data.stats.qteOk}● / {data.stats.qteFail}✗</span>
        </div>
      </div>

      <div
        style={{
          fontSize: 14,
          color: '#6b7280',
          textAlign: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {tweetText}
      </div>
    </div>
  );
};

export const ShareCard = ({ data }: ShareCardProps) => {
  const role = getRole(data.roleId);
  const ending = useMemo(() => pickEndingByScore(data.score, data.roleId), [data.score, data.roleId]);
  const grid = useMemo(
    () => makeEmojiGrid(data.stats.qtePerfect, data.stats.qteOk, data.stats.qteFail),
    [data.stats],
  );

  const tweetText = `${ending.tweetHook} Пробежал ${Math.round(
    data.distance,
  )}м на ${data.score} очков как ${role.name}. Дотянешь?`;

  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  const handleShare = (channel: string) => {
    const url = buildUtmUrl(channel);
    const text = `${tweetText} ${url}`;
    telemetry.share(channel, data.score);
    if (channel === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (channel === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(tweetText)}`, '_blank');
    } else if (channel === 'copy') {
      void navigator.clipboard?.writeText(text);
    } else if (channel === 'native' && navigator.share) {
      void navigator.share({ title: ending.title, text: tweetText, url });
    }
  };

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1200,
        height: 630,
        pixelRatio: 2,
        cacheBust: true,
      });
      setPngUrl(dataUrl);
      const link = document.createElement('a');
      link.download = `jobrun-${data.roleId}-${data.score}.png`;
      link.href = dataUrl;
      link.click();
      telemetry.share('png-download', data.score);
    } catch (err) {
      console.error('PNG generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-bg-card border border-white/10 rounded-2xl p-6 max-w-xl w-full mx-auto">
      <div className="text-center mb-4">
        <div className="text-6xl mb-3">{ending.emoji}</div>
        <h3 className="text-2xl font-bold mb-1">{ending.title}</h3>
        <p className="text-sm text-gray-400">{ending.reason}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-bg-panel rounded-lg p-3">
          <div className="text-xs text-gray-400">Score</div>
          <div className="text-xl font-bold font-mono" style={{ color: role.accentColor }}>
            {formatNumber(data.score)}
          </div>
        </div>
        <div className="bg-bg-panel rounded-lg p-3">
          <div className="text-xs text-gray-400">Distance</div>
          <div className="text-xl font-bold font-mono">{Math.round(data.distance)}м</div>
        </div>
        <div className="bg-bg-panel rounded-lg p-3">
          <div className="text-xs text-gray-400">Time</div>
          <div className="text-xl font-bold font-mono">{formatDuration(data.durationMs)}</div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-4 text-3xl">
        {grid.map((cell, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-lg bg-bg-panel flex items-center justify-center"
          >
            {cell}
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 bg-bg-panel rounded-lg p-3 mb-4 font-mono break-all">
        {tweetText}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          onClick={() => handleShare('twitter')}
          className="bg-black hover:bg-gray-800 text-white py-2 rounded-lg font-semibold text-sm"
        >
          𝕏 Twitter
        </button>
        <button
          onClick={() => handleShare('telegram')}
          className="bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg font-semibold text-sm"
        >
          ✈ Telegram
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleShare('copy')}
          className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-semibold text-sm"
        >
          📋 Copy
        </button>
        <button
          onClick={handleDownloadPng}
          disabled={isGenerating}
          className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white py-2 rounded-lg font-semibold text-sm"
        >
          {isGenerating ? '⏳' : '🖼'} PNG
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={() => handleShare('native')}
            className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold text-sm"
          >
            📤 Share
          </button>
        )}
      </div>

      {pngUrl && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4"
        >
          <a href={pngUrl} download={`jobrun-${data.roleId}-${data.score}.png`}>
            <img src={pngUrl} alt="Share card preview" className="rounded-lg w-full border border-white/10" />
          </a>
          <p className="text-xs text-gray-500 text-center mt-2">
            ✓ 1200×630 PNG · 2x pixel ratio · Web Share ready
          </p>
        </motion.div>
      )}

      {/* Hidden off-screen render target for html-to-image */}
      <div
        style={{
          position: 'fixed',
          top: -10000,
          left: -10000,
          pointerEvents: 'none',
        }}
      >
        <ShareCardCanvas
          data={data}
          emojiCells={grid}
          ending={ending}
          tweetText={tweetText}
          innerRef={cardRef}
        />
      </div>
    </div>
  );
};