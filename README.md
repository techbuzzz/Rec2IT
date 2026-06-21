# Job Interview Runner — 2026

> Endless runner × QTE про IT-собеседования. **Indie browser game.**

Endless runner про самую больную тему найма 2026 — 200 кандидатов на вакансию, ИИ-фильтры, фейковые офферы. Игрок бежит по коридору IT-компании, уворачиваясь от «красных флагов» и собирая «плюсы в резюме». Цель: **100K DAU за 90 дней** через Wordle-style share.

## Stack

- **Vite 5** + TypeScript (strict)
- **React 18** — UI-оверлей (HUD, меню, QTE, share card)
- **PixiJS v8** — игровой Canvas (3-полосный раннер, parallax, particles)
- **Zustand** — общий state между Canvas и React
- **Tailwind CSS** + shadcn-style components
- **Framer Motion** — UI-анимации
- **Web Audio API** — синтезированный звук (без файлов, < 50KB)
- **Supabase** — leaderboard (Phase 4)
- **Vercel** — deploy

## Архитектура

```
src/
├── main.tsx           # React root
├── App.tsx            # GameCanvas + GameUI mount
├── scenes/            # PixiJS Canvas
│   ├── BootScene.tsx  # loading + random tip
│   ├── RunScene.ts    # endless runner core (3 lanes, parallax, spawner)
│   ├── PixiApp.ts     # Pixi Application lifecycle
│   └── world.ts       # константы мира
├── ui/                # React HTML overlay
│   ├── GameCanvas.tsx # Pixi host
│   ├── GameUI.tsx     # keyboard, scene-routing overlay
│   ├── Menu.tsx       # role select
│   ├── Briefing.tsx   # 3-2-1 countdown
│   ├── HUD.tsx        # score/lives/combo
│   ├── QTEOverlay.tsx # Phase 2 stub
│   ├── EndScene.tsx   # share card + restart
│   ├── ShareCard.tsx  # Twitter/Telegram/Copy
│   └── shadcn/        # Button, Card primitives
├── systems/
│   ├── store.ts       # Zustand store (run state, score, lane, entities)
│   ├── spawner.ts     # weighted random obstacles/pickups
│   ├── collision.ts   # AABB detection
│   ├── audioBus.ts    # Web Audio synthesis
│   ├── antiCheat.ts   # HMAC stub (Phase 4)
│   ├── telemetry.ts   # Plausible events
│   ├── storage.ts     # LocalStorage high scores
│   └── types.ts       # shared TS types
├── data/
│   ├── roles.ts       # 3 роли (Phase 5 → 8)
│   ├── obstacles.ts   # 5 типов
│   ├── pickups.ts     # 5 типов
│   ├── qtes.ts        # QTE шаблоны (Phase 2)
│   └── endings.ts     # 8 мемных финалов
└── lib/
    ├── supabase.ts    # client stub (Phase 4)
    └── utils.ts       # cn, formatNumber, etc.
```

## Запуск

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # tsc --noEmit
npm run build        # vite build
npm run preview      # serve dist/
npm run smoke        # smoke checks dist/
```

## Controls

- **← / A** — lane left
- **→ / D** — lane right
- **Space** — jump (иммунитет к препятствиям)
- **↓ / S** — slide
- **P / Esc** — pause
- **R** — restart (на end-экране)

## Phase статус

- ✅ **Phase 0** — Spec & TZ
- ✅ **Phase 1** — Vertical slice (3 lanes, runner core, deaths, restart, share)
- ⏳ **Phase 2** — QTE & Roles (5 типов QTE, audio synthesis)
- ⏳ **Phase 3** — Share Card PNG (html2canvas, UTM)
- ⏳ **Phase 4** — Leaderboard (Supabase + Edge Function)
- ⏳ **Phase 5** — +5 ролей, +10 QTE, roguelike modifiers
- ⏳ **Phase 6** — Virality (Plausible funnel, A/B твитов)
- ⏳ **Phase 7** — Soft Launch (ProductHunt, Habr, TG)
- ⏳ **Phase 8** — Iterate (метрики, сезоны)

## Метрики успеха (90 дней)

| Метрика | Target |
|---|---|
| Unique visitors | 100K |
| Runs started | 50K |
| Share rate | ≥ 15% |
| Viral K | ≥ 0.6 |
| D1 retention | ≥ 12% |
| Avg session | ≥ 3 мин |

## Лицензия

MIT (game IP), CC-BY assets (зависит от Phase 5).