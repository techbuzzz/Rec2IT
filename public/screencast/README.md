# Screencast

Full playthrough recording of the game, captured with Playwright + Chromium in headless mode.

## Files

| File | Size | Description |
|---|---|---|
| `full-playthrough.webm` | ~2 MB | 7-scene video recording (Menu → Briefing → Run → QTE → End → Leaderboard) |

## How to regenerate

```bash
# 1. Build production bundle
npm run build

# 2. Start preview server
npx vite preview --host 127.0.0.1 --port 4173 &

# 3. Run screencast script
python3 scripts/screencast.py
```

The script:
- Launches headless Chromium with SwiftShader (software WebGL)
- Forces each scene via `window.__GAME_STORE__.setState()` for deterministic capture
- Records video via `record_video_dir` Playwright option
- Saves 6 per-scene screenshots to `public/screenshots/`
- Renames video to `full-playthrough.webm`

## Captured scenes

1. **Menu** — 8 role cards, dark UI, hero copy
2. **Briefing** — 3-2-1 countdown overlay
3. **Gameplay** — running, lane switching, jumping, combo
4. **QTE** — CSS flexbox question, 3 answer options, timer
5. **End screen** — score 1247, ending card, share buttons, leaderboard
6. **Restart** — back to menu

## Tech notes

- Chromium headless renders Pixi v8 via SwiftShader (software WebGL)
- Force-triggering scenes through Zustand store ensures deterministic capture without running the full game loop
- WebM format chosen for size (no need for H.264 licensing)