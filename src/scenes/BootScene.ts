/**
 * BootScene — рендерит loading + random tip пока грузятся шрифты.
 * Чистый PixiJS v8 (без @pixi/react для упрощения Phase 1).
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from './types';

const TIPS = [
  '💡 200 кандидатов на вакансию — норма 2026',
  '💡 ИИ-фильтр отсеет 80% резюме до HR',
  '💡 Фейковый оффер существует. Доказано.',
  '💡 Senior — это middle, переживший три ревью',
  '💡 «Идеальный кандидат» — это вы в другой компании',
];

export class BootScene implements Scene {
  readonly container = new Container();
  private progress = 0;
  private raf: number | null = null;

  constructor(private onReady: () => void) {
    this.draw();
  }

  private draw() {
    const bg = new Graphics();
    bg.rect(0, 0, 1200, 720).fill(0x0a0a0f);
    this.container.addChild(bg);

    const title = new Text({
      text: 'JOB INTERVIEW\nRUNNER',
      style: new TextStyle({
        fill: 0xffffff,
        fontSize: 64,
        fontWeight: '800',
        align: 'center',
        fontFamily: 'Inter, sans-serif',
      }),
    });
    title.anchor.set(0.5);
    title.x = 600;
    title.y = 280;
    this.container.addChild(title);

    const tip = new Text({
      text: TIPS[Math.floor(Math.random() * TIPS.length)] ?? '',
      style: new TextStyle({
        fill: 0x9ca3af,
        fontSize: 20,
        align: 'center',
        fontFamily: 'Inter, sans-serif',
      }),
    });
    tip.anchor.set(0.5);
    tip.x = 600;
    tip.y = 420;
    this.container.addChild(tip);

    const loadingText = new Text({
      text: 'Загружаем коридор...',
      style: new TextStyle({
        fill: 0x6b7280,
        fontSize: 18,
        align: 'center',
        fontFamily: 'Inter, sans-serif',
      }),
    });
    loadingText.anchor.set(0.5);
    loadingText.x = 600;
    loadingText.y = 600;
    this.container.addChild(loadingText);

    // имитация прогресса
    this.tick();
  }

  private tick = () => {
    this.progress = Math.min(1, this.progress + 0.03);
    if (this.progress >= 1) {
      setTimeout(() => this.onReady(), 300);
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  destroy() {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.container.destroy({ children: true });
  }
}