/**
 * Collision — AABB detection между player и entities в той же lane.
 * Player size: 60×80 px, JUMP/SLIDE меняет hitbox.
 */

import type { ActiveEntity, Lane } from './types';

export interface Hitbox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const playerHitbox = (
  lane: Lane,
  isJumping: boolean,
  isSliding: boolean,
): Hitbox => {
  // lane center coords (assume canvas 1200×720, lane width=400)
  const laneX = lane * 400 + 200;
  const baseY = 540; // ground baseline

  if (isJumping) {
    return { x: laneX - 30, y: baseY - 140, w: 60, h: 80 };
  }
  if (isSliding) {
    return { x: laneX - 30, y: baseY - 30, w: 60, h: 30 };
  }
  return { x: laneX - 30, y: baseY - 80, w: 60, h: 80 };
};

export const entityHitbox = (entity: ActiveEntity): Hitbox => {
  const laneX = entity.lane * 400 + 200;
  return { x: laneX - 30, y: 540 - 80, w: 60, h: 80 };
};

const aabbIntersect = (a: Hitbox, b: Hitbox): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const findCollisions = (
  entities: ActiveEntity[],
  lane: Lane,
  isJumping: boolean,
  isSliding: boolean,
): ActiveEntity[] => {
  const ph = playerHitbox(lane, isJumping, isSliding);
  return entities.filter((e) => {
    if (e.lane !== lane) return false;
    return aabbIntersect(ph, entityHitbox(e));
  });
};