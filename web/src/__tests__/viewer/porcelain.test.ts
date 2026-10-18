import { describe, expect, test } from 'bun:test';
import { WINDOWS } from '$lib/components/@Viewer/Scene/layout';
import {
  GLAZE,
  GLAZE_LEVEL,
  glazeLevel,
  STUDIO,
} from '$lib/components/@Viewer/Scene/models/porcelain';

describe('фарфор', () => {
  test('у студии окно на каждый источник дневного света', () =>
    void expect(STUDIO.day.windows.length).toBe(WINDOWS.length));

  test('студия целиком внутри съёмки PMREM (дальняя плоскость 100)', () =>
    void expect(
      Math.max(STUDIO.room * (Math.sqrt(3) / 2), STUDIO.distance)
    ).toBeLessThan(100));

  test('глазурь смешивается от дня к ночи без скачка', () => {
    expect(glazeLevel(0)).toBe(GLAZE_LEVEL.day);
    expect(glazeLevel(1)).toBe(GLAZE_LEVEL.night);
    expect(glazeLevel(0.5)).toBeCloseTo(
      (GLAZE_LEVEL.day + GLAZE_LEVEL.night) / 2,
      9
    );
  });

  test('глазурь — диэлектрик: F0 соответствует ior', () =>
    void expect(GLAZE.f0).toBeCloseTo(
      ((GLAZE.ior - 1) / (GLAZE.ior + 1)) ** 2,
      3
    ));
});
