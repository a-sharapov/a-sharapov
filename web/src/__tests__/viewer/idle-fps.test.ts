import { describe, expect, test } from 'bun:test';
import { IDLE_FPS, throttled } from '#lib/components/@Viewer/Scene/idle-fps.ts';

describe('idle frame rate', () => {
  test('a still scene renders at 30 fps on 60, 120 and 144 Hz displays', () =>
    [60, 120, 144].forEach((hz) => {
      const calls: number[] = [];
      const loop = throttled(
        (time) => void calls.push(time),
        () => true
      );
      Array.from({ length: hz * 2 }).forEach(
        (_, i) => void loop((i * 1000) / hz)
      );
      expect(calls.length / 2).toBeGreaterThanOrEqual(IDLE_FPS - 2);
      expect(calls.length / 2).toBeLessThanOrEqual(IDLE_FPS + 0.5);
    }));

  test('a moving scene is not throttled', () => {
    const calls: number[] = [];
    const loop = throttled(
      (time) => void calls.push(time),
      () => false
    );
    Array.from({ length: 120 }).forEach((_, i) => void loop((i * 1000) / 120));
    expect(calls.length).toBe(120);
  });

  test('motion right after idle is picked up on the next frame', () => {
    const calls: number[] = [];
    const state = { still: true };
    const loop = throttled(
      (time) => void calls.push(time),
      () => state.still
    );
    Array.from({ length: 60 }).forEach((_, i) => void loop((i * 1000) / 60));
    state.still = false;
    const before = calls.length;
    loop(1001);
    expect(calls.length).toBe(before + 1);
  });
});
