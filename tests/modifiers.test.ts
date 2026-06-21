/**
 * Modifiers tests — roguelike pre-run modifiers system (Phase 5).
 */

import { describe, it, expect } from 'vitest';
import { MODIFIERS, pickModifiersForRun, applyModifiers } from '@/data/modifiers';
import type { RoleId } from '@/data/roles';

describe('MODIFIERS', () => {
  it('contains both buffs and debuffs', () => {
    const buffs = MODIFIERS.filter((m) => m.isBuff);
    const debuffs = MODIFIERS.filter((m) => !m.isBuff);
    expect(buffs.length).toBeGreaterThan(0);
    expect(debuffs.length).toBeGreaterThan(0);
  });

  it('all modifiers have valid effect types', () => {
    const validEffects = ['spawn_density', 'speed', 'multiplier', 'starting_lives', 'qte_difficulty'];
    for (const mod of MODIFIERS) {
      expect(validEffects).toContain(mod.effect);
    }
  });

  it('all modifiers have id, name, flavor, emoji', () => {
    for (const mod of MODIFIERS) {
      expect(mod.id).toBeTruthy();
      expect(mod.name).toBeTruthy();
      expect(mod.flavor).toBeTruthy();
      expect(mod.emoji).toBeTruthy();
    }
  });
});

describe('pickModifiersForRun', () => {
  it('returns one buff and one debuff', () => {
    const roleId: RoleId = 'middle-backend';
    const [a, b] = pickModifiersForRun(roleId);
    const isOneBuffOneDebuff =
      (a.isBuff && !b.isBuff) || (!a.isBuff && b.isBuff);
    expect(isOneBuffOneDebuff).toBe(true);
  });

  it('returns different modifiers (no duplicates)', () => {
    const roleId: RoleId = 'senior-fullstack';
    const [a, b] = pickModifiersForRun(roleId);
    expect(a.id).not.toBe(b.id);
  });

  it('works for all 8 roles', () => {
    const roleIds: RoleId[] = [
      'junior-frontend',
      'middle-backend',
      'senior-fullstack',
      'devops',
      'ml-engineer',
      'product-manager',
      'qa-engineer',
      'mobile-developer',
    ];
    for (const id of roleIds) {
      const [a, b] = pickModifiersForRun(id);
      expect(a).toBeDefined();
      expect(b).toBeDefined();
    }
  });
});

describe('applyModifiers', () => {
  it('returns default values for empty array', () => {
    const result = applyModifiers([]);
    expect(result.spawnDensityFactor).toBe(1);
    expect(result.speedFactor).toBe(1);
    expect(result.multiplierBonus).toBe(0);
    expect(result.livesBonus).toBe(0);
    expect(result.qteDifficultyFactor).toBe(1);
  });

  it('multiplies spawnDensityFactor for spawn_density effect', () => {
    const mod = MODIFIERS.find((m) => m.effect === 'spawn_density')!;
    const result = applyModifiers([mod]);
    expect(result.spawnDensityFactor).toBeCloseTo(mod.factor, 5);
    // Other fields unchanged
    expect(result.speedFactor).toBe(1);
  });

  it('multiplies speedFactor for speed effect', () => {
    const mod = MODIFIERS.find((m) => m.effect === 'speed')!;
    const result = applyModifiers([mod]);
    expect(result.speedFactor).toBeCloseTo(mod.factor, 5);
  });

  it('adds to livesBonus for starting_lives effect', () => {
    const mod = MODIFIERS.find((m) => m.effect === 'starting_lives')!;
    const result = applyModifiers([mod]);
    expect(result.livesBonus).toBe(mod.bonus ?? 0);
  });

  it('adds to multiplierBonus for multiplier effect', () => {
    const mod = MODIFIERS.find((m) => m.effect === 'multiplier')!;
    const result = applyModifiers([mod]);
    expect(result.multiplierBonus).toBeCloseTo(mod.factor - 1, 5);
  });

  it('combines multiple modifiers', () => {
    const mod1 = MODIFIERS.find((m) => m.effect === 'spawn_density')!;
    const mod2 = MODIFIERS.find((m) => m.effect === 'speed')!;
    const result = applyModifiers([mod1, mod2]);
    expect(result.spawnDensityFactor).toBeCloseTo(mod1.factor, 5);
    expect(result.speedFactor).toBeCloseTo(mod2.factor, 5);
  });

  it('does not throw on conflicting effects', () => {
    const twoSpawnMods = MODIFIERS
      .filter((m) => m.effect === 'spawn_density')
      .slice(0, 2);
    expect(() => applyModifiers(twoSpawnMods)).not.toThrow();
  });
});