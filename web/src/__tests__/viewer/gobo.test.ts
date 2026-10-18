import { describe, expect, test } from 'bun:test';
import {
  frameAt,
  GOBO,
  gustEnvelope,
  leavesAt,
  swayAt,
} from '#lib/components/@Viewer/Scene/gobo.ts';

describe('гобо', () => {
  test('переплёт гаснет к краям области теней — без резкой границы на дальнем столе', () =>
    [
      [0.001, 0.5],
      [0.999, 0.5],
      [GOBO.bars[0]!.at, 0.001],
      [0.5, GOBO.bars[1]!.at > 0.5 ? 0.999 : 0.001],
    ].forEach(
      ({ 0: u, 1: v }) => void expect(frameAt(u!, v!)).toBeGreaterThan(0.99)
    ));

  test('под импостом свет ослаблен до пропускания, между ними — полный', () => {
    expect(frameAt(GOBO.bars[0]!.at, 0.5)).toBeCloseTo(GOBO.bar, 2);
    expect(frameAt(0.5, GOBO.bars[1]!.at)).toBeCloseTo(GOBO.bar, 2);
    expect(frameAt(0.5, 0.45)).toBe(1);
  });

  test('листва — пятна, а не сплошная тень', () =>
    ((values) => {
      expect(Math.min(...values)).toBeLessThan(0.05);
      expect(Math.max(...values)).toBeGreaterThan(0.95);
    })(
      Array.from({ length: 400 }, (_, i) =>
        leavesAt((i % 20) / 20, Math.floor(i / 20) / 20)
      )
    ));

  test('порыв: вне его листва стоит, внутри — плавно', () => {
    expect(gustEnvelope(9.9, 10, 4)).toBe(0);
    expect(gustEnvelope(14.1, 10, 4)).toBe(0);
    expect(gustEnvelope(12, 10, 4)).toBeCloseTo(1, 9);
    expect(Math.max(...swayAt(3, 0).map(Math.abs))).toBe(0);
    expect(Math.max(...swayAt(12, 1).map(Math.abs))).toBeLessThanOrEqual(
      GOBO.gust.sway * 1.6 + 1e-12
    );
  });
});
