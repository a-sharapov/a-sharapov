import { beforeEach, describe, expect, test } from 'bun:test';
import {
  GLITCH,
  glitchAt,
  tapCard,
} from '$lib/components/@Viewer/Scene/glitch';

describe('glitch', () => {
  beforeEach(() => void tapCard(-1e9));

  test('пять смен состояния визитки подряд запускают пасхалку, четыре — нет', () => {
    const start = 10_000;
    expect([0, 1, 2, 3].map((i) => tapCard(start + i * 1500))).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect(tapCard(start + 6000)).toBe(true);
    expect(tapCard(start + 6500)).toBe(false);
  });

  test('пауза длиннее GLITCH.gap обрывает цепочку', () => {
    const step = GLITCH.gap * 1000;
    expect(
      [0, 1, 2, 3].map((i) => tapCard(50_000 + i * step)).some(Boolean)
    ).toBe(false);
    expect(tapCard(50_000 + 3 * step + step + 1)).toBe(false);
    expect(
      [1, 2, 3, 4].map((i) => tapCard(50_000 + 4 * step + 1 + i * 500)).pop()
    ).toBe(true);
  });

  test('пока пасхалка идёт, новые смены её не перезапускают', () => {
    expect(
      [0, 1, 2, 3, 4, 5, 6]
        .map((i) => tapCard(80_000 + i * 300, false))
        .some(Boolean)
    ).toBe(false);
  });

  test('график: начало и конец чистые, в середине — крупные пиксели и сбои', () => {
    expect(glitchAt(0)).toEqual({ pixel: 1, glitch: 0 });
    expect(glitchAt(GLITCH.seconds)).toEqual({ pixel: 1, glitch: 0 });
    const peak = glitchAt(4.2);
    expect(peak.pixel).toBeGreaterThan(GLITCH.pixel * 0.9);
    expect(
      Math.max(...[1, 1.5, 2, 2.5, 3, 3.5, 4].map((t) => glitchAt(t).glitch))
    ).toBeGreaterThan(0.6);
  });

  test('при reduced motion остаётся только пикселизация', () => {
    expect(
      [0.5, 1, 2, 3, 4, 5].every((t) => glitchAt(t, true).glitch === 0)
    ).toBe(true);
    expect(glitchAt(4.2, true).pixel).toBeGreaterThan(GLITCH.pixel * 0.9);
  });
});
