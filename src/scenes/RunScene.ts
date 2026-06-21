/**
 * RunScene — endless runner core.
 * PixiJS v8, чистый Canvas. React не знает про Pixi — общение через Zustand.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from './types';
import { LANE_X, WORLD } from './world';
import { useGameStore } from '@/systems/store';
import { spawnerStep } from '@/systems/spawner';
import { findCollisions } from '@/systems/collision';
import { getRole } from '@/data/roles';
import { OBSTACLES } from '@/data/obstacles';
import { PICKUPS } from '@/data/pickups';
import { audioBus } from '@/systems/audioBus';
import { telemetry } from '@/systems/telemetry';
import { pickQTE, QTE_INTERVAL_M } from '@/data/qtes';
const PLAYER_W = 60;
const PLAYER_H = 80;
const ENTITY_W = 60;
const ENTITY_H = 80;
const JUMP_DURATION_MS = 700;
const JUMP_HEIGHT_PX = 100;

export class RunScene implements Scene {
  readonly container = new Container();
  private raf: number | null = null;
  private lastFrameMs = 0;
  private spawnAccumMs = 0;
  private currentSpawnIntervalMs = 1400;
  private parallaxOffset = 0;
  private processedEntityIds = new Set<string>();
  private lastStepMs = 0;
  private lastQteTriggerDistance = 0;

  // Layers
  private bgFar = new Graphics();
  private bgNear = new Graphics();
  private ground = new Graphics();
  private laneLines = new Graphics();
  private entitiesLayer = new Container();
  private player = new Graphics();
  private playerLabel: Text;

  // runtime refs
  private get store() {
    return useGameStore.getState();
  }

  constructor() {
    this.container.addChild(this.bgFar);
    this.container.addChild(this.bgNear);
    this.container.addChild(this.ground);
    this.container.addChild(this.laneLines);
    this.container.addChild(this.entitiesLayer);
    this.container.addChild(this.player);

    this.playerLabel = new Text({
      text: '🧑‍💻',
      style: new TextStyle({ fontSize: 48, fontFamily: 'Inter, sans-serif' }),
    });
    this.playerLabel.anchor.set(0.5);
    this.container.addChild(this.playerLabel);

    this.drawStatic();
    this.start();
  }

  private drawStatic() {
    // far background — градиент небо
    this.bgFar.rect(0, 0, WORLD.WIDTH, WORLD.HEIGHT).fill({ color: 0x0a0a0f });
    // corporate office windows (parallax-slow)
    for (let i = 0; i < 8; i++) {
      const wx = i * 180;
      this.bgFar.rect(wx, 80, 100, 200).fill({ color: 0x14141c });
      this.bgFar.rect(wx + 20, 110, 60, 40).fill({ color: 0x3b82f6, alpha: 0.3 });
      this.bgFar.rect(wx + 20, 170, 60, 40).fill({ color: 0x3b82f6, alpha: 0.5 });
      this.bgFar.rect(wx + 20, 230, 60, 40).fill({ color: 0x3b82f6, alpha: 0.2 });
    }

    // near background — стойки/колонны (parallax-fast)
    for (let i = 0; i < 6; i++) {
      this.bgNear.rect(i * 240, 400, 30, 220).fill({ color: 0x1c1c28 });
    }

    // ground
    this.ground.rect(0, WORLD.GROUND_Y, WORLD.WIDTH, WORLD.HEIGHT - WORLD.GROUND_Y).fill({
      color: 0x14141c,
    });

    // lane lines (static draw, на самом деле рисуем динамически в tick)
    this.laneLines.alpha = 0.4;
  }

  private start() {
    telemetry.start(this.store.roleId ?? 'unknown');
    this.lastFrameMs = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private loop = (now: number) => {
    const dt = Math.min(50, now - this.lastFrameMs); // clamp на случай лагов
    this.lastFrameMs = now;

    const s = this.store;
    if (!s.isRunning || s.isPaused) {
      this.lastFrameMs = performance.now();
      this.raf = requestAnimationFrame(this.loop);
      return;
    }

    // distance & parallax
    s.tickDistance(dt);
    this.parallaxOffset = (this.parallaxOffset + (s.speed * dt) / 1000) % 240;

    // step-tick audio (каждые 250мс)
    this.lastStepMs += dt;
    if (this.lastStepMs >= 250) {
      this.lastStepMs = 0;
      audioBus.step();
    }

    // QTE trigger каждые QTE_INTERVAL_M метров
    if (s.distance - this.lastQteTriggerDistance >= QTE_INTERVAL_M) {
      this.lastQteTriggerDistance = s.distance;
      const roleId = s.roleId;
      if (roleId) {
        const qte = pickQTE(roleId);
        s.triggerQTE(qte);
        // pause: tickDistance не будет идти пока qte активен
        this.lastFrameMs = performance.now();
        this.raf = requestAnimationFrame(this.loop);
        return;
      }
    }

    // spawner (с учётом density модификатора)
    const densityFactor = s.activeModifiers.some((m) => m.effect === 'spawn_density')
      ? s.activeModifiers.filter((m) => m.effect === 'spawn_density').reduce((acc, m) => acc * m.factor, 1)
      : 1;
    const effectiveInterval = this.currentSpawnIntervalMs / densityFactor;
    this.spawnAccumMs += dt;
    if (this.spawnAccumMs >= effectiveInterval) {
      const next = spawnerStep(s.entities, s.distance, this.currentSpawnIntervalMs);
      this.currentSpawnIntervalMs = next.nextIntervalMs;
      this.spawnAccumMs = 0;
      next.entities.forEach((e) => s.spawnEntity(e));
    }

    // move entities left
    const newEntities = s.entities.map((e) => ({
      ...e,
      x: e.x - (s.speed * dt) / 1000,
    }));
    useGameStore.setState({ entities: newEntities });

    // prune off-screen
    s.pruneEntities(-100);

    // collisions
    const currentState = useGameStore.getState();
    const collisions = findCollisions(
      currentState.entities,
      currentState.lane,
      currentState.isJumping,
      currentState.isSliding,
    );

    collisions.forEach((entity) => {
      if (this.processedEntityIds.has(entity.id)) return;
      this.processedEntityIds.add(entity.id);

      if (entity.kind === 'pickup') {
        audioBus.pickup();
        currentState.collectPickup(entity.id);
      } else {
        audioBus.hit();
        currentState.hitObstacle(entity.id);
        telemetry.death(s.distance, s.score, s.roleId ?? '');
      }
    });

    // cleanup processed ids for off-screen entities
    this.processedEntityIds.forEach((id) => {
      if (!currentState.entities.find((e) => e.id === id)) {
        this.processedEntityIds.delete(id);
      }
    });

    // render
    this.renderEntities();
    this.renderPlayer();
    this.renderParallax();

    this.raf = requestAnimationFrame(this.loop);
  };

  private renderParallax() {
    this.bgNear.x = -this.parallaxOffset * 1.5;
    this.bgFar.x = -this.parallaxOffset * 0.4;
    this.drawLaneLines();
  }

  private drawLaneLines() {
    this.laneLines.clear();
    const dashHeight = 30;
    const dashGap = 30;
    const offset = this.parallaxOffset % (dashHeight + dashGap);
    for (let x = -offset; x < WORLD.WIDTH; x += dashHeight + dashGap) {
      this.laneLines.rect(WORLD.WIDTH / 3, x + this.laneLinesY(), 4, dashHeight).fill({
        color: 0x3a3a4a,
      });
      this.laneLines.rect((WORLD.WIDTH / 3) * 2, x + this.laneLinesY(), 4, dashHeight).fill({
        color: 0x3a3a4a,
      });
    }
  }

  private laneLinesY() {
    return WORLD.GROUND_Y - 200;
  }

  private renderPlayer() {
    const s = this.store;
    const role = s.roleId ? getRole(s.roleId) : null;
    const accent = role ? parseInt(role.accentColor.replace('#', ''), 16) : 0x22c55e;

    const laneX = LANE_X[s.lane];
    const groundY = WORLD.GROUND_Y;

    let yOffset = 0;
    let h = PLAYER_H;
    if (s.isJumping) {
      const t = Math.min(
        1,
        (performance.now() - (s.jumpUntilMs - JUMP_DURATION_MS)) / JUMP_DURATION_MS,
      );
      // параболический прыжок: 0 → peak (0.5) → 0
      yOffset = -4 * JUMP_HEIGHT_PX * t * (1 - t);
      h = PLAYER_H;
    } else if (s.isSliding) {
      h = 30;
      yOffset = PLAYER_H - 30;
    }

    this.player.clear();
    this.player.roundRect(laneX - PLAYER_W / 2, groundY - h - yOffset, PLAYER_W, h, 8).fill({
      color: accent,
    });
    this.player.roundRect(laneX - PLAYER_W / 2, groundY - h - yOffset, PLAYER_W, h, 8).stroke({
      color: 0xffffff,
      width: 2,
      alpha: 0.8,
    });

    // emoji float above
    this.playerLabel.x = laneX;
    this.playerLabel.y = groundY - h - yOffset - 40;
  }

  private renderEntities() {
    const entities = this.store.entities;
    this.entitiesLayer.removeChildren();

    entities.forEach((e) => {
      const x = e.x;
      const y = WORLD.GROUND_Y - ENTITY_H;

      const g = new Graphics();
      const isPickup = e.kind === 'pickup';
      const color = isPickup ? 0xeab308 : 0xef4444;

      g.roundRect(x - ENTITY_W / 2, y, ENTITY_W, ENTITY_H, 8).fill({ color, alpha: 0.85 });
      g.roundRect(x - ENTITY_W / 2, y, ENTITY_W, ENTITY_H, 8).stroke({
        color: 0xffffff,
        width: 1,
        alpha: 0.4,
      });

      // emoji via Text
      const cfg = isPickup
        ? PICKUPS[e.type as keyof typeof PICKUPS]
        : OBSTACLES[e.type as keyof typeof OBSTACLES];
      const emoji = cfg?.emoji ?? '❓';
      const t = new Text({
        text: emoji,
        style: new TextStyle({ fontSize: 40, fontFamily: 'Inter, sans-serif' }),
      });
      t.anchor.set(0.5);
      t.x = x;
      t.y = y + ENTITY_H / 2;
      this.entitiesLayer.addChild(g);
      this.entitiesLayer.addChild(t);
    });
  }

  destroy() {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    audioBus.death();
    this.container.destroy({ children: true });
  }
}