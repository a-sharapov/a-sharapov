import { describe, expect, test } from 'bun:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { PAPER } from '#lib/components/@Viewer/Scene/layout.ts';
import {
  easeShot,
  interpolatePose,
  introPose,
  type Pose,
  type Rect,
  sheetPose,
  shortestYaw,
} from '#lib/components/@Viewer/Scene/shots.ts';

const viewport = { width: 1440, height: 900 };

const _camera = (pose: Pose) => {
  const camera = new PerspectiveCamera(
    pose.fov,
    viewport.width / viewport.height,
    1,
    2000
  );
  camera.position.set(...pose.position);
  camera.up.set(...pose.up);
  camera.lookAt(...pose.target);
  camera.updateMatrixWorld();
  return camera;
};

const _project = (camera: PerspectiveCamera, point: Vector3) =>
  ((ndc) => ({
    x: ((ndc.x + 1) / 2) * viewport.width,
    y: ((1 - ndc.y) / 2) * viewport.height,
  }))(point.clone().project(camera));

const _PAPER_CENTER = new Vector3(
  PAPER.position[0],
  PAPER.position[1] + PAPER.lift,
  PAPER.position[2]
);

const _corners = (
  yaw: number,
  size: [number, number],
  center = _PAPER_CENTER
) => {
  const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const up = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const half = { w: size[0] / 2, h: size[1] / 2 };
  return {
    topLeft: center
      .clone()
      .addScaledVector(right, -half.w)
      .addScaledVector(up, half.h),
    bottomRight: center
      .clone()
      .addScaledVector(right, half.w)
      .addScaledVector(up, -half.h),
  };
};

describe('sheetPose', () => {
  const rects: Array<[string, Rect]> = [
    ['центр', { left: 240, top: 120, width: 960, height: 700 }],
    ['смещён вниз-вправо', { left: 400, top: 200, width: 800, height: 600 }],
    ['узкий экран', { left: 16, top: 90, width: 1408, height: 760 }],
  ];

  test.each(
    rects
  )('бумага проецируется ровно в DOM-лист (portrait, %s)', (_, rect) => {
    const fit = sheetPose('portrait', viewport, rect);
    const camera = _camera(fit.pose);
    const { topLeft, bottomRight } = _corners(fit.sheet.yaw, fit.sheet.size);
    const a = _project(camera, topLeft);
    const b = _project(camera, bottomRight);
    expect(a.x).toBeCloseTo(rect.left, 0);
    expect(a.y).toBeCloseTo(rect.top, 0);
    expect(b.x).toBeCloseTo(rect.left + rect.width, 0);
    expect(b.y).toBeCloseTo(rect.top + rect.height, 0);
  });

  test('landscape разворачивает камеру на 90° и сохраняет совпадение', () => {
    const rect = { left: 200, top: 110, width: 1040, height: 700 };
    const portrait = sheetPose('portrait', viewport, rect);
    const landscape = sheetPose('landscape', viewport, rect);
    expect(landscape.sheet.yaw - portrait.sheet.yaw).toBeCloseTo(
      Math.PI / 2,
      6
    );
    const camera = _camera(landscape.pose);
    const { topLeft, bottomRight } = _corners(
      landscape.sheet.yaw,
      landscape.sheet.size
    );
    expect(_project(camera, topLeft).x).toBeCloseTo(rect.left, 0);
    expect(_project(camera, bottomRight).y).toBeCloseTo(
      rect.top + rect.height,
      0
    );
  });

  test('длинная сторона листа не больше 18 см — предметы остаются за краем', () => {
    const fit = sheetPose('portrait', viewport, {
      left: 0,
      top: 0,
      width: 1400,
      height: 800,
    });
    expect(Math.max(...fit.sheet.size)).toBeCloseTo(18, 6);
  });
});

describe('interpolatePose', () => {
  const from = introPose(viewport);
  const to = sheetPose('portrait', viewport, {
    left: 240,
    top: 120,
    width: 960,
    height: 700,
  }).pose;

  test('концы перелёта совпадают с планами', () => {
    expect(interpolatePose(from, to, 0).position).toEqual(from.position);
    expect(
      interpolatePose(from, to, 1).position.map((v) => +v.toFixed(6))
    ).toEqual(to.position.map((v) => +v.toFixed(6)));
  });

  test('середина перелёта поднята над прямой (кран), up остаётся единичным', () => {
    const mid = interpolatePose(from, to, 0.5);
    const straight = (from.position[1] + to.position[1]) / 2;
    expect(mid.position[1]).toBeGreaterThan(straight);
    expect(Math.hypot(...mid.up)).toBeCloseTo(1, 6);
  });

  test('easeShot: края без рывка и монотонность', () => {
    expect(easeShot(0)).toBe(0);
    expect(easeShot(1)).toBeCloseTo(1, 6);
    expect(easeShot(0.001)).toBeLessThan(0.0001);
    expect(1 - easeShot(0.999)).toBeLessThan(0.0001);
    const samples = Array.from({ length: 101 }, (_, i) => easeShot(i / 100));
    expect(samples.every((v, i) => i === 0 || v >= samples[i - 1]!)).toBe(true);
  });

  test('easeShot: быстрая атака — камера заметно трогается в первые кадры после клика', () => {
    expect(easeShot(0.1)).toBeGreaterThan(0.02);
    expect(easeShot(0.2)).toBeGreaterThan(0.12);
    expect(easeShot(0.5)).toBeGreaterThan(0.75);
  });

  test('shortestYaw не крутит лист через полный круг', () => {
    expect(shortestYaw(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(-0.1, 6);
    expect(shortestYaw(3, -3)).toBeCloseTo(2 * Math.PI - 3, 6);
  });
});

describe('introPose', () => {
  test('на узком экране камера отъезжает дальше', () => {
    const wide = introPose({ width: 1440, height: 900 });
    const narrow = introPose({ width: 390, height: 844 });
    const reach = (pose: Pose) =>
      Math.hypot(...pose.position.map((v, i) => v - pose.target[i]!));
    expect(reach(narrow)).toBeGreaterThan(reach(wide));
  });
});
