import { describe, expect, test } from 'bun:test';
import {
  clickAt,
  THEME_CUE,
  themeCue,
} from '$lib/components/@Viewer/Scene/theme-cue';

const DAY = { ambient: 0, power: 0 };
const NIGHT = { ambient: 1, power: 1 };
const STEP = 1 / 120;

const _run = (from: typeof DAY, night: boolean, reduced = false) =>
  Array.from({ length: 600 }, (_, i) =>
    themeCue(from, night, i * STEP, reduced)
  );

describe('смена темы', () => {
  test('к ночи: окна гаснут, затем щелчок и нить разгорается с инерцией', () =>
    ((frames) => {
      const click = clickAt(DAY, true)!;
      expect(click).toBe(THEME_CUE.click);
      expect(frames[Math.round(click / STEP) - 1]!.power).toBe(0);
      expect(frames[Math.round(click / STEP) - 1]!.ambient).toBeGreaterThan(
        0.6
      );
      expect(
        frames[Math.round((click + THEME_CUE.down + 0.3) / STEP)]!.power
      ).toBeGreaterThan(0.85);
      expect(Math.max(...frames.map((frame) => frame.press))).toBeGreaterThan(
        0.99
      );
      expect(frames.at(-1)).toEqual({
        ambient: 1,
        power: 1,
        press: 0,
        done: true,
      });
    })(_run(DAY, true)));

  test('к дню: щелчок сразу, нить остывает быстро, затем свет окон', () =>
    ((frames) => {
      expect(clickAt(NIGHT, false)).toBe(0);
      expect(frames[Math.round(0.3 / STEP)]!.power).toBeLessThan(0.01);
      expect(frames[Math.round(0.3 / STEP)]!.ambient).toBe(1);
      expect(frames.at(-1)).toEqual({
        ambient: 0,
        power: 0,
        press: 0,
        done: true,
      });
    })(_run(NIGHT, false)));

  test('без скачков: соседние кадры отличаются плавно', () =>
    [
      _run(DAY, true),
      _run(NIGHT, false),
      _run({ ambient: 0.4, power: 0.3 }, true),
      _run({ ambient: 0.6, power: 0.7 }, false),
    ].forEach(
      (frames) =>
        void frames.slice(1).forEach((frame, i) => {
          expect(Math.abs(frame.ambient - frames[i]!.ambient)).toBeLessThan(
            0.02
          );
          expect(Math.abs(frame.press - frames[i]!.press)).toBeLessThan(0.25);
        })
    ));

  test('уже горящая лампа не щёлкает повторно', () => {
    expect(clickAt({ ambient: 0.5, power: 1 }, true)).toBeNull();
    expect(clickAt({ ambient: 0.5, power: 0 }, false)).toBeNull();
  });

  test('без анимации — короткое смешивание без кнопки', () =>
    ((frames) => {
      expect(Math.max(...frames.map((frame) => frame.press))).toBe(0);
      expect(frames[Math.round(THEME_CUE.quick / STEP)]!.done).toBe(true);
    })(_run(DAY, true, true)));
});
