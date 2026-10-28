import { describe, expect, test } from 'bun:test';
import { DataUtils } from 'three';
import {
  bokehKernel,
  catEyePoint,
  chordPoint,
} from '#lib/components/@Viewer/Scene/lens/dof.ts';
import {
  GRAIN,
  grainWeight,
  halationTints,
} from '#lib/components/@Viewer/Scene/lens/film.ts';
import {
  DAY_GRADE,
  gradeDay,
  gradeNight,
  LUT_SIZE,
  luma,
  lutData,
  type RGB,
} from '#lib/components/@Viewer/Scene/lens/grade.ts';
import {
  MOTION,
  shutterFor,
} from '#lib/components/@Viewer/Scene/lens/motion.ts';

var _random = ((seed) => () => (
  (seed = (seed * 16807) % 2147483647), (seed - 1) / 2147483646
))(7);

var _sample = (
  data: Uint16Array,
  size: number,
  { 0: r, 1: g, 2: b }: RGB
): RGB =>
  ((x, y, z) =>
    ((x0, y0, z0) =>
      ((fx, fy, fz) =>
        [0, 1, 2].map((channel) =>
          [0, 1].reduce(
            (sumZ, dz) =>
              sumZ +
              (dz ? fz : 1 - fz) *
                [0, 1].reduce(
                  (sumY, dy) =>
                    sumY +
                    (dy ? fy : 1 - fy) *
                      [0, 1].reduce(
                        (sumX, dx) =>
                          sumX +
                          (dx ? fx : 1 - fx) *
                            DataUtils.fromHalfFloat(
                              data[
                                ((Math.min(size - 1, z0 + dz) * size +
                                  Math.min(size - 1, y0 + dy)) *
                                  size +
                                  Math.min(size - 1, x0 + dx)) *
                                  4 +
                                  channel
                              ]!
                            ),
                        0
                      ),
                  0
                ),
            0
          )
        ) as RGB)(x - x0, y - y0, z - z0))(
      Math.floor(x),
      Math.floor(y),
      Math.floor(z)
    ))(r * (size - 1), g * (size - 1), b * (size - 1));

describe('грейд', () => {
  test('днём серые остаются серыми, тон стола и фона не меняется', () => {
    [0.79, 0.81, 0.83, 0.86].forEach(
      (level) =>
        void gradeDay([level, level, level]).forEach(
          (channel) => void expect(channel).toBeCloseTo(level, 9)
        )
    );
    [0, 0.2, 0.5, 0.95].forEach(
      (level) =>
        void ((out: RGB) =>
          void (expect(out[0]).toBe(out[1]!), expect(out[1]).toBe(out[2]!)))(
          gradeDay([level, level, level])
        )
    );
    expect(gradeDay([0, 0, 0])[0]).toBeCloseTo(DAY_GRADE.lift, 6);
    expect(gradeDay([1, 1, 1])[0]).toBeCloseTo(1, 6);
  });

  test('днём хрома не меняется: ко всем каналам одна добавка', () =>
    Array.from(
      { length: 200 },
      (): RGB => [_random(), _random(), _random()]
    ).forEach(
      (rgb) =>
        void expect(gradeDay(rgb)[0] - rgb[0]).toBeCloseTo(
          gradeDay(rgb)[2] - rgb[2],
          6
        )
    ));

  test('дневная кривая монотонна', () =>
    void Array.from({ length: 256 }, (_, i) => i / 255).reduce((previous, x) =>
      ((level) => (expect(level).toBeGreaterThanOrEqual(previous), level))(
        gradeDay([x, x, x])[0]
      )
    ));

  test('ночью тёплое в тенях теплеет, холодное холодеет, бумага не меняется', () => {
    const warm: RGB = [0.06, 0.02, 0.009];
    const cool: RGB = [0.004, 0.016, 0.047];
    const paper: RGB = [0.51, 0.41, 0.34];
    ((out) => expect(out[0] - out[2]).toBeGreaterThan(warm[0] - warm[2]))(
      gradeNight(warm)
    );
    ((out) => expect(out[2] - out[0]).toBeGreaterThan(cool[2] - cool[0]))(
      gradeNight(cool)
    );
    gradeNight(paper).forEach(
      (channel, i) =>
        void expect(Math.abs(channel - paper[i]!)).toBeLessThan(1 / 255)
    );
  });

  test('ночью яркость сохраняется (кроме подъёма чёрного)', () =>
    [
      [0.3, 0.25, 0.2],
      [0.12, 0.1, 0.14],
      [0.6, 0.5, 0.45],
    ].forEach(
      (rgb) =>
        void expect(luma(gradeNight(rgb as RGB))).toBeCloseTo(
          luma(rgb as RGB),
          2
        )
    ));

  test(`LUT ${LUT_SIZE}³ с трилинейной выборкой: типично — в пределах 1.5/255, малонасыщенные — 2.5/255`, () =>
    [gradeDay, gradeNight].forEach(
      (grade) =>
        void ((data: Uint16Array) =>
          ((errors) => {
            expect(
              errors.map(({ error }) => error).sort((a, b) => a - b)[
                Math.floor(errors.length * 0.99)
              ]!
            ).toBeLessThan(1.5 / 255);
            errors
              .filter(({ saturation }) => saturation < 0.15)
              .forEach(
                ({ error }) => void expect(error).toBeLessThan(2.5 / 255)
              );
          })(
            Array.from(
              { length: 4000 },
              (): RGB => [_random(), _random(), _random()]
            ).map((rgb) =>
              ((exact, sampled) => ({
                error: Math.max(
                  ...exact.map((channel, i) => Math.abs(channel - sampled[i]!))
                ),
                saturation: Math.max(...rgb) - Math.min(...rgb),
              }))(grade(rgb), _sample(data, LUT_SIZE, rgb))
            )
          ))(lutData(grade))
    ));
});

describe('кошачий глаз', () => {
  const kernel = bokehKernel();

  test('ядро — 64 + 16 точек в единичном круге', () => {
    expect(kernel.dense).toHaveLength(64);
    expect(kernel.sparse).toHaveLength(16);
    [...kernel.dense, ...kernel.sparse].forEach(
      ({ 0: x, 1: y }) => void expect(Math.hypot(x, y)).toBeLessThan(1)
    );
  });

  test('без сдвига ядро не меняется', () =>
    kernel.dense.forEach(
      (point) =>
        void ((mapped: [number, number]) => {
          expect(mapped[0]).toBeCloseTo(point[0], 9);
          expect(mapped[1]).toBeCloseTo(point[1], 9);
        })(catEyePoint(chordPoint(point), 0))
    ));

  test('со сдвигом точки лежат в пересечении двух кругов и сжаты по радиусу', () =>
    [0.2, 0.34, 0.5].forEach(
      (shift) =>
        void kernel.dense
          .map((point) => catEyePoint(chordPoint(point), shift))
          .forEach(({ 0: x, 1: y }) => {
            expect(Math.hypot(x - shift, y)).toBeLessThanOrEqual(1 + 1e-9);
            expect(Math.hypot(x + shift, y)).toBeLessThanOrEqual(1 + 1e-9);
            expect(Math.abs(x)).toBeLessThanOrEqual(1 - shift + 1e-9);
          })
    ));
});

describe('плёнка', () => {
  test('галация: тёплый узкий ореол без сдвига яркости, широкие уровни нейтральны', () => {
    const tints = halationTints(0.45);
    expect(tints[0]![0]).toBeGreaterThan(1);
    expect(tints[0]![2]).toBeLessThan(1);
    tints.forEach(
      (tint) => void expect(Math.abs(luma(tint) - 1)).toBeLessThan(0.01)
    );
    expect(tints[3]).toEqual([1, 1, 1]);
    expect(tints[4]).toEqual([1, 1, 1]);
    halationTints(0).forEach((tint) => void expect(tint).toEqual([1, 1, 1]));
  });

  test('зерно сильнее в средних тонах, на фоне дня — вдвое слабее прежнего', () => {
    expect(grainWeight(0.45)).toBeGreaterThan(grainWeight(0.95));
    expect(grainWeight(0.45)).toBeGreaterThan(grainWeight(0.03));
    expect(grainWeight(0.79)).toBeGreaterThan(0.95 / 2);
    expect(grainWeight(0.79)).toBeLessThan(1.1 / 2);
    expect(grainWeight(0.45)).toBeCloseTo(GRAIN.gain, 6);
  });
});

describe('смаз движения', () => {
  test('затвор 180° при 60 Гц — половина межкадрового смещения', () =>
    expect(shutterFor(1 / 60)).toBeCloseTo(0.5, 6));

  test('выдержка постоянна во времени, выбросы кадра ограничены', () => {
    expect(shutterFor(1 / 120)).toBeCloseTo(1, 6);
    expect(shutterFor(2)).toBeCloseTo(MOTION.exposure * 20, 6);
    expect(shutterFor(0)).toBeCloseTo(MOTION.exposure * 240, 6);
  });
});
