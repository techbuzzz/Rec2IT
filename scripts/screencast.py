#!/usr/bin/env python3
"""
Full playthrough screencast using Playwright + Chromium.
Forces each scene via Zustand store to ensure capture.
"""

import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:4173/"
OUTPUT_DIR = Path("/home/ubuntu/workspace/job-interview-runner/public/screenshots")
SCREENCAST_DIR = Path("/home/ubuntu/workspace/job-interview-runner/public/screencast")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
SCREENCAST_DIR.mkdir(parents=True, exist_ok=True)

CHROMIUM_PATH = "/home/ubuntu/.browsers/chromium-1223/chrome-linux64/chrome"
VIEWPORT = {"width": 1280, "height": 800}


def shoot(page, name, wait_ms=300):
    page.wait_for_timeout(wait_ms)
    path = OUTPUT_DIR / f"scene-{name}.png"
    page.screenshot(path=str(path), full_page=False)
    print(f"  📸 {name}")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROMIUM_PATH,
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-gpu",
                "--use-gl=swiftshader",
                "--use-angle=swiftshader",
                "--enable-unsafe-swiftshader",
                "--ignore-gpu-blocklist",
            ],
        )
        context = browser.new_context(
            viewport=VIEWPORT,
            record_video_dir=str(SCREENCAST_DIR),
            record_video_size=VIEWPORT,
        )
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"[pageerror] {err}"))
        page.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type == "error" else None)

        print(f"🎮 Loading {BASE_URL}")
        page.goto(BASE_URL, wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(3000)

        # Verify store
        store_ok = page.evaluate("() => typeof window.__GAME_STORE__?.getState === 'function'")
        print(f"  Store available: {store_ok}")
        if not store_ok:
            print("  ❌ No store — cannot proceed")
            return

        # === Scene 1: MENU ===
        print("\n[1/7] MENU")
        page.evaluate("""() => {
            window.__GAME_STORE__.setState({ scene: 'menu', isRunning: false });
        }""")
        page.wait_for_timeout(800)
        shoot(page, "01-menu", 500)

        # === Scene 2: BRIEFING ===
        print("\n[2/7] BRIEFING")
        page.evaluate("""() => {
            window.__GAME_STORE__.setState({ scene: 'briefing', roleId: 'junior-frontend' });
        }""")
        page.wait_for_timeout(500)
        shoot(page, "02-briefing", 800)

        # === Scene 3: RUN (early) ===
        print("\n[3/7] RUN — initial state")
        page.evaluate("""() => {
            window.__GAME_STORE__.setState({
                scene: 'run',
                roleId: 'junior-frontend',
                isRunning: true,
                distance: 150,
                score: 150,
                lives: 3,
                lane: 1,
                combo: 0,
                comboMultiplier: 1,
                nextQteDistance: 500,
            });
        }""")
        page.wait_for_timeout(1500)
        shoot(page, "03-gameplay", 300)

        # === Scene 4: RUN (active gameplay) ===
        print("\n[4/7] RUN — active with obstacles")
        page.evaluate("""() => {
            window.__GAME_STORE__.setState({
                distance: 380,
                score: 420,
                combo: 3,
                comboMultiplier: 2.0,
                lane: 0,
                isJumping: true,
            });
        }""")
        page.wait_for_timeout(1200)
        shoot(page, "04-gameplay-active", 300)

        # === Scene 5: QTE ===
        print("\n[5/7] QTE")
        # Clear endData first to avoid stale state crash
        page.evaluate("""() => {
            window.__GAME_STORE__.setState({
                scene: 'menu',
                endData: null,
                qte: null,
            });
        }""")
        page.wait_for_timeout(300)
        page.evaluate("""() => {
            // Force QTE scene with sample QTE matching QTEActiveState type
            window.__GAME_STORE__.setState({
                scene: 'qte',
                distance: 500,
                nextQteDistance: 500,
                qte: {
                    qte: {
                        id: 'junior-css-center',
                        type: 'single-choice',
                        prompt: 'CSS flexbox: как центрировать div по горизонтали?',
                        duration: 3000,
                        perfectScore: 50,
                        okScore: 20,
                        failPenalty: -10,
                        flavor: 'Центрирование — основа CSS',
                        options: [
                            { id: 'a', label: 'margin: auto', correct: false },
                            { id: 'b', label: 'justify-content: center', correct: true },
                            { id: 'c', label: 'text-align: center', correct: false },
                        ],
                    },
                    startedAtMs: Date.now(),
                    lastResult: null,
                    triggerDistance: 500,
                },
            });
        }""")
        page.wait_for_timeout(1200)
        shoot(page, "05-qte", 500)

        # === Scene 6: END (with share card) ===
        print("\n[6/7] END")
        page.evaluate("""() => {
            window.__GAME_STORE__.setState({
                scene: 'end',
                isRunning: false,
                qte: null,
                endData: {
                    score: 1247,
                    distance: 1842,
                    durationMs: 92000,
                    roleId: 'junior-frontend',
                    endingId: 'junior-frontend-pereros-vakansiyu',
                    stats: {
                        perfect: 2,
                        ok: 3,
                        fail: 1,
                        qtePerfect: 2,
                        qteOk: 3,
                        qteFail: 1,
                        pickupsCollected: 5,
                        obstaclesHit: 2,
                        maxCombo: 3,
                    },
                    qteHistory: [],
                },
            });
        }""")
        page.wait_for_timeout(1500)
        shoot(page, "06-end", 500)

        # === Scene 7: BACK TO MENU ===
        print("\n[7/7] BACK TO MENU")
        page.evaluate("""() => {
            window.__GAME_STORE__.setState({ scene: 'menu', endData: null });
        }""")
        page.wait_for_timeout(800)
        shoot(page, "07-menu-restart", 300)

        # Done
        context.close()
        browser.close()

        # Rename video
        videos = list(SCREENCAST_DIR.glob("*.webm"))
        if videos:
            src = max(videos, key=lambda p: p.stat().st_mtime)
            dst = SCREENCAST_DIR / "full-playthrough.webm"
            if dst.exists():
                dst.unlink()
            src.rename(dst)
            size_mb = dst.stat().st_size / (1024 * 1024)
            duration = dst.stat().st_size / (128 * 1024)  # rough estimate
            print(f"\n✅ Screencast: {dst}")
            print(f"   Size: {size_mb:.2f} MB")
            print(f"   Scenes captured: 7")
        else:
            print("\n⚠ No video file found")

        if errors:
            unique_errors = list({e for e in errors})[:8]
            print(f"\n⚠ {len(errors)} console errors ({len(unique_errors)} unique):")
            for e in unique_errors:
                print(f"  {e}")


if __name__ == "__main__":
    main()