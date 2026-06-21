# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions CI pipeline (lint, test, build, perf, smoke)
- Release workflow with auto-deploy to Vercel
- Edge Function deploy workflow for Supabase
- Dependabot for weekly dependency updates
- Issue templates (bug report, feature request)
- PR template with phase checklist
- Code of Conduct (Contributor Covenant 2.1)
- Security policy with private disclosure process
- CODEOWNERS for auto-assigning reviewers
- Vitest test suite with 38 unit tests
- WebP screenshots for 82% size reduction
- Bundle stats and perf-check scripts
- English README, PRESS_KIT, SOFT_LAUNCH

## [0.9.0] - 2026-06-21

### Added
- Phase 9: tutorial flow for first-run players
- Phase 9: difficulty slider affecting spawn rate, QTE timeout, lives, score
- Phase 9: combo meter visual progress bar in HUD
- Phase 9: per-screen ErrorBoundary to isolate crashes
- Phase 9: Settings modal (mute SFX, mute music, difficulty)
- Phase 10: PWA manifest for "Add to Home Screen"
- Phase 10: Service Worker for offline cache
- Phase 10: Mobile-optimized landing page

### Changed
- Pixi v8 lazy-loaded via dynamic import (1.1MB → separate chunk)
- Supabase lazy-loaded on first leaderboard open
- All UI text translated to English
- Bundle initial size: 461KB gz → 38KB gz (−92%)

### Fixed
- Pixi Application now properly destroyed on unmount (no memory leak)
- WebGPUDescriptor deprecation warning removed
- HMAC-SHA256 anti-cheat (replaces weak djb2)

## [0.8.0] - 2026-06-20

### Added
- Phase 6: Plausible funnel analytics (`load → start → qte → share`)
- Phase 6: A/B test for share-card text (3 variants)
- Phase 6: Sponsor banner infrastructure (lazy-loaded)
- Phase 6: Marketing landing page at `/landing.html`
- Phase 6: Press kit (`PRESS_KIT.md`)
- Phase 6: Soft launch checklist (`SOFT_LAUNCH.md`)
- Phase 7: Product Hunt draft
- Phase 7: Twitter thread template
- Phase 7: Habr / Telegram posts templates

## [0.7.0] - 2026-06-19

### Added
- Phase 5: 8 roles (Junior FE, Middle BE, Senior FS, DevOps, ML, PM, QA, Mobile)
- Phase 5: 25 new role-specific QTE templates (40 total)
- Phase 5: 8 roguelike modifiers with real gameplay effects
- Phase 4: Supabase schema (runs, runs_anon, leaderboard_daily)
- Phase 4: Edge Function `verify-run` with HMAC + rate limit + ratio checks
- Phase 4: Leaderboard UI with auto-refresh
- Phase 4: Opt-in submit button on EndScene

### Security
- HMAC djb2 anti-cheat on client
- Server-side verification in Edge Function
- RLS policies (anon read-only)

## [0.6.0] - 2026-06-18

### Added
- Phase 3: Share card generator (PNG 1200×630 via html-to-image)
- Phase 3: 6-emoji Wordle-style grid
- Phase 3: UTM tracking in share URLs
- Phase 3: Twitter / Telegram / native share intents
- Phase 2: 5 QTE types (choice, spot-bug, sequence, slider, hold)
- Phase 2: 24 endings (8 tiers × 3 base roles)
- Phase 2: Audio synthesis (jump, pickup, step, QTE perfect/ok/fail)

## [0.5.0] - 2026-06-17

### Added
- Phase 1: Vite + React 18 + TypeScript strict setup
- Phase 1: PixiJS v8 + @pixi/react for game canvas
- Phase 1: Zustand store with React/Pixi shared state
- Phase 1: Tailwind CSS + shadcn/ui
- Phase 1: Boot → Menu → Briefing → Run → End game loop
- Phase 1: 3 lanes, jump/slide mechanics
- Phase 1: Spawner (obstacles + pickups)
- Phase 1: LocalStorage high scores

## [0.1.0] - 2026-06-15

### Added
- Initial commit
- TZ.md (technical specification)
- Project scaffolding

[Unreleased]: https://github.com/techbuzzz/Rec2IT/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/techbuzzz/Rec2IT/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/techbuzzz/Rec2IT/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/techbuzzz/Rec2IT/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/techbuzzz/Rec2IT/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/techbuzzz/Rec2IT/compare/v0.1.0...v0.5.0
[0.1.0]: https://github.com/techbuzzz/Rec2IT/releases/tag/v0.1.0