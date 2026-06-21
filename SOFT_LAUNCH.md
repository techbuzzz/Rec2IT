# Soft Launch Checklist

Target window: **Q3 2026 (TBD)**. Goal: validate the funnel with 20 testers before public launch.

## Pre-launch (T-14 days)

### Infrastructure
- [ ] Create Supabase project (`rec2it-prod`)
- [ ] Apply migrations: `supabase/migrations/0001_init.sql`
- [ ] Deploy Edge Function: `supabase functions deploy verify-run`
- [ ] Set Supabase secrets: `ANTI_CHEAT_SECRET` (matches Vercel)
- [ ] Create Vercel project, link GitHub repo
- [ ] Configure Vercel environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ANTI_CHEAT_SECRET` (generate via `openssl rand -hex 32`)
- [ ] Add custom domain (rec2it.run) to Vercel
- [ ] Configure DNS (CNAME / A record)
- [ ] Enable Vercel analytics (optional)
- [ ] Register site on Plausible (`rec2it.run`)
- [ ] Set up uptime monitoring (e.g. Better Stack free tier)
- [ ] Set up error tracking (Sentry free tier — 5K events/mo)

### Content
- [ ] Replace placeholder favicon with branded one
- [ ] Final pass on OG image (1200×630)
- [ ] Localize share card text (RU + EN variants)
- [ ] Verify all 8 role descriptions read naturally
- [ ] Test all 40 QTE templates for typos / edge cases
- [ ] QA mobile responsive design (iPhone SE, iPhone 15 Pro, Pixel 7)

### Documentation
- [ ] Update README with live demo link
- [ ] Update CHANGELOG with v0.9.0 entry
- [ ] Verify all social links work

## Closed beta (T-7 to T-0 days)

### Recruitment (20 testers)
- [ ] Post in Techbuzz Telegram channel: "Looking for 20 IT folks to beta-test a 2-minute game about job interviews"
- [ ] DM 5 hiring managers for HR-perspective feedback
- [ ] DM 5 senior devs for technical QA
- [ ] DM 5 junior devs for onboarding UX feedback
- [ ] DM 5 PMs for game-design feedback

### Feedback channels
- [ ] Create private Telegram chat for testers
- [ ] Create Google Form for structured feedback (1 question per phase)
- [ ] Set up bug-reporting channel (GitHub Issues + label `beta`)

### Daily metrics to track
- [ ] DAU (target: 5+)
- [ ] Runs per user (target: 2+)
- [ ] Share rate (target: ≥10% in beta)
- [ ] Crash rate (target: <1%)
- [ ] Average session (target: ≥2 min)

## Launch day (T-0)

### Product Hunt
- [ ] Draft PH post (250 chars tagline, 4 screenshots, demo GIF)
- [ ] Schedule for Tuesday 12:01 AM PT (best slot)
- [ ] Pre-fill maker comment with technical story
- [ ] Notify 10 friends to upvote / comment in first 2 hours
- [ ] PH link: [producthunt.com/posts/new](https://www.producthunt.com/posts/new)

### Twitter / X
- [ ] Draft launch thread (8 tweets):
  1. Hook: "I built an endless runner about IT job interviews in 2026"
  2. Pain point: 200 candidates per role
  3. Solution: 2-min game with 8 roles
  4. Demo GIF
  5. QTE scenarios (SQL injection!)
  6. Wordle-style share card
  7. Tech stack (PixiJS + Supabase)
  8. CTA: "Try it → rec2it.run"
- [ ] Pin thread to profile
- [ ] Cross-post to LinkedIn (longer form)
- [ ] Tag relevant accounts: @_buildkite, @supabase, @pixijs

### Habr (Russian)
- [ ] Draft technical post: "How I built a viral web game in 9 days with PixiJS + Supabase"
- [ ] Include architecture diagram, code snippets, perf metrics
- [ ] Add at end: "Играть → rec2it.run"

### Telegram channels
- [ ] Post in [@techbuzzz](https://t.me/techbuzzz): short teaser + link
- [ ] Cross-post to [@frontend_top](https://t.me/frontend_top), [@backend_room](https://t.me/backend_room), [@devops_ru](https://t.me/devops_ru)
- [ ] Post in [@gamedev_ru](https://t.me/gamedev_ru) — niche fit
- [ ] DM [@ru_vc](https://t.me/ru_vc), [@producthunt_ru](https://t.me/producthunt_ru) for reach

### Reddit
- [ ] r/webdev (English)
- [ ] r/gamedev (English)
- [ ] r/typescript (English — tech interest)
- [ ] r/Pikabu (Russian — meme-friendly)

## Post-launch (T+1 to T+7)

### Daily monitoring
- [ ] Plausible dashboard: load → start → qte → share funnel
- [ ] Sentry errors (target: <0.5% crash rate)
- [ ] Supabase logs (Edge Function errors, rate limit hits)
- [ ] Social mentions (Twitter / TG / Reddit replies)

### Weekly retro (T+7)
- [ ] K-factor (viral coefficient)
- [ ] D1, D7 retention
- [ ] Top QTE failure rate (iterate on hard ones)
- [ ] Top 3 reported bugs (fix in next sprint)
- [ ] Sponsor interest (Phase 11 unlock criteria)

## Success criteria

| Metric | Target | Source |
|---|---|---|
| Unique visitors (T+7) | 5K | Plausible |
| Runs started (T+7) | 2.5K | `run_start` event |
| Share rate (T+7) | ≥10% | `share_card_generated` / `run_complete` |
| K-factor (T+7) | ≥0.4 | Share → return ratio |
| Crash rate (T+7) | <1% | Sentry |
| Avg session (T+7) | ≥3 min | Plausible |
| NPS from beta testers | ≥40 | Google Form |

If all targets met → **proceed to public launch (T+14)**.
If 2+ metrics miss → **iterate 1 week, re-launch**.

## Open questions for Victor

- [ ] Confirm domain `rec2it.run` is purchased and pointed at Vercel
- [ ] Confirm Supabase account (`rec2it-prod`) is created
- [ ] Confirm tester list (20 IT folks) is recruited
- [ ] Confirm launch date (proposed: Tuesday in Q3 2026)
- [ ] Confirm sponsor pipeline (HH, Habr Career, OTUS) for Phase 11

## Reference

- **TZ.md** — full technical specification
- **PRESS_KIT.md** — press materials and contact info
- **CHANGELOG.md** — what's in v0.9.0