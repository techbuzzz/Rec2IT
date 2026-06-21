/**
 * Константы игрового мира.
 * Все позиции/размеры в пикселях. 50px = 1 метр.
 */

export const WORLD = {
  WIDTH: 1200,
  HEIGHT: 720,
  GROUND_Y: 620, // y верхней кромки ground
  LANE_WIDTH: 400,
  PLAYER_SIZE: 80,
  PIXELS_PER_METER: 50,
} as const;

export const LANE_X = [200, 600, 1000] as const; // центры 3 полос

export const COLORS = {
  bg: 0x0a0a0f,
  ground: 0x1c1c28,
  laneLine: 0x2a2a3a,
  player: 0x22c55e,
  obstacle: 0xef4444,
  pickup: 0xeab308,
} as const;