import { useMemo } from 'react';
import type { EndScreenData } from '@/systems/types';
import { getRole } from '@/data/roles';
import { pickEndingByScore, makeEmojiGrid } from '@/data/endings';
import { formatNumber, formatDuration } from '@/lib/utils';

interface ShareCardProps {
  data: EndScreenData;
}

export const ShareCard = ({ data }: ShareCardProps) => {
  const role = getRole(data.roleId);
  const ending = useMemo(
    () => pickEndingByScore(data.score, data.roleId),
    [data.score, data.roleId],
  );
  const grid = useMemo(
    () =>
      makeEmojiGrid(
        Math.min(6, data.stats.ok),
        Math.min(6 - data.stats.ok, data.stats.perfect),
        data.stats.fail,
      ),
    [data.stats],
  );

  const tweetText = `${ending.tweetHook} Пробежал ${Math.round(
    data.distance,
  )}м на ${data.score} очков как ${role.name}. Дотянешь?`;

  const handleTwitter = () => {
    const url = encodeURIComponent('https://jobrun.gg');
    const text = encodeURIComponent(tweetText);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleTelegram = () => {
    const url = encodeURIComponent('https://jobrun.gg');
    const text = encodeURIComponent(tweetText);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${tweetText} https://jobrun.gg`);
    } catch {
      /* clipboard blocked */
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

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleTwitter}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold text-sm"
        >
          𝕏 Twitter
        </button>
        <button
          onClick={handleTelegram}
          className="bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg font-semibold text-sm"
        >
          ✈ Telegram
        </button>
        <button
          onClick={handleCopy}
          className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-semibold text-sm"
        >
          📋 Copy
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">
        Phase 3: PNG 1200×630 через html2canvas + UTM-пиксель
      </p>
    </div>
  );
};