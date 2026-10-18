import { describe, expect, mock, test } from 'bun:test';
import type { DataTexture } from 'three';

['github', 'linkedin', 'phone', 'telegram'].forEach(
  (name) =>
    void mock.module(`/i/${name}.svg?raw`, () => ({ default: '<svg/>' }))
);

var { createNoiseTexture, createPaperRelief } = await import(
  '#lib/components/@Viewer/Scene/textures.ts'
);

var _hash = (x: number, y: number, seed: number): number =>
  ((value) => value - Math.floor(value))(
    Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
  );

var _smooth = (t: number): number => t * t * (3 - 2 * t);

var _valueNoise = (x: number, y: number, period: number, seed: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = _smooth(x - ix);
  const fy = _smooth(y - iy);
  const at = (dx: number, dy: number) =>
    _hash((ix + dx) % period, (iy + dy) % period, seed);
  const top = at(0, 0) + (at(1, 0) - at(0, 0)) * fx;
  const bottom = at(0, 1) + (at(1, 1) - at(0, 1)) * fx;
  return top + (bottom - top) * fy;
};

var _fbm = (x: number, y: number, period: number, seed: number) =>
  [1, 2, 4, 8].reduce(
    (acc, octave) =>
      acc +
      _valueNoise(x * octave, y * octave, period * octave, seed + octave) /
        octave /
        1.875,
    0
  );

var referenceNoise = (size: number, period: number, seed: number) =>
  Array.from({ length: size * size }).reduce<Uint8Array>(
    (data, _, i) => {
      const x = ((i % size) / size) * period;
      const y = (Math.floor(i / size) / size) * period;
      data.set(
        [
          _fbm(x, y, period, seed) * 255,
          _valueNoise(x * 4, y * 4, period * 4, seed + 9) * 255,
          _hash(i % size, Math.floor(i / size), seed) * 255,
          255,
        ],
        i * 4
      );
      return data;
    },
    new Uint8Array(size * size * 4)
  );

var _tileNoise = (period: number, seed: number) =>
  (
    (table) => (x: number, y: number) =>
      ((ix, iy) =>
        ((fx, fy, x0, x1, y0, y1) =>
          ((top, bottom) => top + (bottom - top) * fy)(
            table[y0 + x0]! + (table[y0 + x1]! - table[y0 + x0]!) * fx,
            table[y1 + x0]! + (table[y1 + x1]! - table[y1 + x0]!) * fx
          ))(
          _smooth(x - ix),
          _smooth(y - iy),
          ix % period,
          (ix + 1) % period,
          (iy % period) * period,
          ((iy + 1) % period) * period
        ))(Math.floor(x), Math.floor(y))
  )(
    Float64Array.from({ length: period * period }, (_, i) =>
      _hash(i % period, Math.floor(i / period), seed)
    )
  );

var referenceCoating = (size = 384) =>
  ((octaves) =>
    ((data) => (
      Array.from({ length: size * size }).forEach(
        (_, i) =>
          void ((x: number, y: number) =>
            ((shade) =>
              data
                .fill(shade, i * 4, i * 4 + 3)
                .fill(255, i * 4 + 3, i * 4 + 4))(
              128 +
                octaves.reduce(
                  (sum, { cell, weight, noise }) =>
                    sum + (noise(x / cell, y / cell) - 0.5) * weight,
                  0
                ) +
                (_hash(x, y, 24) - 0.5) * 20
            ))(i % size, Math.floor(i / size))
      ),
      new Uint8Array(data.buffer)
    ))(new Uint8ClampedArray(size * size * 4)))(
    [
      [6, 60],
      [3, 45],
      [1.5, 30],
    ].map(({ 0: cell, 1: weight }, octave) => ({
      cell: cell!,
      weight: weight!,
      noise: _tileNoise(size / cell!, 21 + octave),
    }))
  );

var _bytes = (texture: DataTexture) => texture.image.data as Uint8Array;

var _firstMismatch = (actual: Uint8Array, expected: Uint8Array) =>
  actual.length === expected.length
    ? expected.findIndex((value, i) => actual[i] !== value)
    : -2;

describe('зерно и рельеф бумаги', () => {
  test.each([
    [256, 64, 11],
    [256, 64, 17],
    [256, 64, 23],
    [256, 64, 21],
    [256, 8, 5],
    [128, 8, 1],
    [64, 3, 7],
  ])('зерно %i² · период %i · seed %i побайтно как прежний расчёт', (size, period, seed) =>
    expect(
      _firstMismatch(
        _bytes(createNoiseTexture(size, period, seed)),
        referenceNoise(size, period, seed)
      )
    ).toBe(-1));

  test('пиксели зерна берутся из кэша', () =>
    expect(_bytes(createNoiseTexture(256, 64, 11))).toBe(
      _bytes(createNoiseTexture(256, 64, 11))
    ));

  test('рельеф визитки побайтно как прежний расчёт', () =>
    expect(
      _firstMismatch(_bytes(createPaperRelief()), referenceCoating())
    ).toBe(-1));
});
