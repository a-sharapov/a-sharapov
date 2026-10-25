import { describe, expect, test } from 'bun:test';
import {
  DPR_STEP,
  type FrameSample,
  nextDpr,
} from '#lib/components/@Viewer/Scene/resolution.ts';

const _window = (sample: FrameSample) =>
  Array.from({ length: 90 }, () => sample);

const _gpuBound = _window({ interval: 1 / 30, cpu: 0.004 });

describe('adaptive pixel density', () => {
  test('a GPU-bound window lowers the density one step', () =>
    expect(nextDpr(1.75, _gpuBound, 1)).toBe(1.75 - DPR_STEP));

  test('a CPU-bound or fast window keeps the density', () => {
    expect(nextDpr(1.75, _window({ interval: 1 / 30, cpu: 0.03 }), 1)).toBe(
      1.75
    );
    expect(nextDpr(1.75, _window({ interval: 1 / 60, cpu: 0.004 }), 1)).toBe(
      1.75
    );
  });

  test('the density never drops below the floor of the quality tier', () => {
    expect(nextDpr(1.1, _gpuBound, 1)).toBe(1);
    expect(nextDpr(2.4, _gpuBound, 2.4)).toBe(2.4);
  });
});
