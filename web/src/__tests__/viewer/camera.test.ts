import { describe, expect, test } from 'bun:test';
import { Vector3 } from 'three';
import { lampGap } from '#lib/components/@Viewer/Scene/carry.ts';
import { CUP } from '#lib/components/@Viewer/Scene/layout.ts';
import {
  arcRoll,
  BANK,
  distance,
  easeShot,
  interpolatePose,
  introPose,
  type Pose,
  type Rect,
  SWING,
  shotCue,
} from '#lib/components/@Viewer/Scene/shots.ts';
import { stageFit } from '#lib/components/@Viewer/Scene/staging.ts';
import type { Actor } from '#lib/components/@Viewer/Scene/state.svelte.ts';

const viewport = { width: 1440, height: 900 };

const RECTS: Record<Actor, Rect> = {
  resume: { left: 459, top: 72, width: 523, height: 739 },
  sketchbook: { left: 208, top: 72, width: 1024, height: 726 },
  tablet: { left: 208, top: 72, width: 1024, height: 649 },
  plane: { left: 208, top: 72, width: 1024, height: 739 },
};

const ACTORS: Actor[] = ['resume', 'sketchbook', 'tablet', 'plane'];

const intro = introPose(viewport);

const POSES: Pose[] = [
  intro,
  ...ACTORS.map((actor) => stageFit(actor, viewport, RECTS[actor]).pose),
];

const STEPS = Array.from({ length: 101 }, (_, i) => i / 100);

const _path = (from: Pose, to: Pose, swing: number) =>
  STEPS.map((p) => interpolatePose(from, to, easeShot(p), shotCue(p, swing)));

const _cupGap = (pose: Pose) =>
  new Vector3(...pose.position).distanceTo(
    new Vector3(CUP.position[0], 4, CUP.position[2])
  ) - 6.8;

var _flights = (distinct = false) =>
  POSES.flatMap((from) =>
    POSES.filter((to) => !distinct || to !== from).flatMap((to) =>
      [SWING, -SWING].map((swing) => ({ from, to, swing }))
    )
  );

var _clear = (pose: Pose) => {
  expect(lampGap(new Vector3(...pose.position))).toBeGreaterThan(4);
  expect(_cupGap(pose)).toBeGreaterThan(4);
  expect(pose.position[1]).toBeGreaterThan(5);
};

describe('камера', () => {
  test('перелёт с облётом начинается и кончается точно в позах планов', () =>
    _flights().forEach(
      ({ from, to, swing }) =>
        void ((path) => {
          expect(distance(path[0]!.position, from.position)).toBeLessThan(1e-9);
          expect(distance(path.at(-1)!.position, to.position)).toBeLessThan(
            1e-9
          );
          expect(distance(path.at(-1)!.focus, to.focus)).toBeLessThan(1e-9);
          expect(path.at(-1)!.focusRange).toBeCloseTo(to.focusRange, 9);
          expect(path.at(-1)!.bokeh).toBeCloseTo(to.bokeh, 9);
        })(_path(from, to, swing))
    ));

  test('облёт не заводит камеру в лампу, чашку и под стол', () =>
    _flights().forEach(
      ({ from, to, swing }) => void _path(from, to, swing).forEach(_clear)
    ));

  test('фокус переводится позже камеры, передышка — только в середине', () => {
    expect(shotCue(0, SWING).focus).toBe(0);
    expect(shotCue(0.9, SWING).focus).toBe(1);
    expect(shotCue(0.5, SWING).focus).toBeLessThan(easeShot(0.5));
    expect(shotCue(0, SWING).breath).toBe(0);
    expect(shotCue(0.8, SWING).breath).toBeLessThan(1e-9);
    expect(shotCue(1, SWING).breath).toBeLessThan(1e-9);
  });

  test('крен — один плавный наклон к центру дуги, ноль на концах', () =>
    _flights(true).forEach(
      ({ from, to, swing }) =>
        void ((rolls) => {
          expect(Math.max(...rolls.map(Math.abs))).toBeLessThanOrEqual(
            BANK + 1e-12
          );
          expect(Math.abs(rolls[0]!)).toBeLessThan(1e-9);
          expect(Math.abs(rolls.at(-1)!)).toBeLessThan(1e-9);
          expect(
            rolls.filter((roll) => roll > 1e-4).length *
              rolls.filter((roll) => roll < -1e-4).length
          ).toBe(0);
        })(
          STEPS.map((p) =>
            ((t) => arcRoll(from, to, t, shotCue(p, swing)))(easeShot(p))
          )
        )
    ));
});
