import type { Shot, XYZ } from '#lib/common/types.ts';
import { clamp, lerp } from '#lib/common/utils.ts';
import { CARD, onFrame, PAPER, PAPER_LONG_SIDE } from './layout';

export type Pose = {
  position: XYZ;
  target: XYZ;
  up: XYZ;
  fov: number;
  focus: XYZ;
  focusRange: number;
  bokeh: number;
};

export type Size = { width: number; height: number };

export type Rect = Size & { left: number; top: number };

export type Sheet = { size: [width: number, height: number]; yaw: number };

export type SheetFit = { pose: Pose; sheet: Sheet };

export type Orbit = { azimuth: number; elevation: number };

export var SHOT_FOV = 40;

export var TOP_FOV = 24;

var _HALF_FOV = Math.tan((SHOT_FOV * Math.PI) / 360);

export var TOP_HALF_FOV = Math.tan((TOP_FOV * Math.PI) / 360);

export var add = (a: XYZ, b: XYZ): XYZ => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];

export var sub = (a: XYZ, b: XYZ): XYZ => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];

export var scale = (a: XYZ, s: number): XYZ => [a[0] * s, a[1] * s, a[2] * s];

export var length = (a: XYZ): number => Math.hypot(a[0], a[1], a[2]);

export var distance = (a: XYZ, b: XYZ): number => length(sub(a, b));

export var lerp3 = (a: XYZ, b: XYZ, t: number): XYZ => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

var _normalize = (a: XYZ, fallback: XYZ = [0, 1, 0]): XYZ =>
  length(a) > 1e-6 ? scale(a, 1 / length(a)) : fallback;

export var orbitDirection = ({ azimuth, elevation }: Orbit): XYZ => [
  Math.sin(azimuth) * Math.cos(elevation),
  Math.sin(elevation),
  Math.cos(azimuth) * Math.cos(elevation),
];

export var CARD_CENTER: XYZ = add(CARD.position, [0, 2.7, 0]);

export var INTRO_ORBIT: Orbit = { azimuth: CARD.yaw, elevation: 0.21 };

export var introPose = (viewport: Size, orbit = INTRO_ORBIT): Pose => {
  const aspect = viewport.width / Math.max(1, viewport.height);
  const reach = Math.max(41, 24 / (_HALF_FOV * aspect));

  return {
    position: add(CARD_CENTER, scale(orbitDirection(orbit), reach)),
    target: add(CARD_CENTER, [0, 0.6, 0]),
    up: [0, 1, 0],
    fov: SHOT_FOV,
    focus: CARD_CENTER,
    focusRange: 22,
    bokeh: 2.2,
  };
};

type Paper = { center: XYZ; yaw: number; long: number };

var _PAPER_CENTER = add(PAPER.position, [0, PAPER.lift, 0]);

var _PAPERS: Partial<Record<Shot, Paper>> = {
  portrait: { center: _PAPER_CENTER, yaw: PAPER.yaw, long: PAPER_LONG_SIDE },
  landscape: {
    center: _PAPER_CENTER,
    yaw: PAPER.yaw + Math.PI / 2,
    long: PAPER_LONG_SIDE,
  },
};

export var sheetPose = (shot: Shot, viewport: Size, sheet: Rect): SheetFit => {
  const paper = _PAPERS[shot] ?? _PAPERS.portrait!;
  const k = paper.long / Math.max(1, sheet.width, sheet.height);
  const yaw = paper.yaw;
  const up: XYZ = [-Math.sin(yaw), 0, -Math.cos(yaw)];
  const right: XYZ = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const height = (viewport.height * k) / (2 * TOP_HALF_FOV);
  const offsetX = (sheet.left + sheet.width / 2 - viewport.width / 2) * k;
  const offsetY = (sheet.top + sheet.height / 2 - viewport.height / 2) * k;
  const center = paper.center;
  const above = add(sub(center, scale(right, offsetX)), scale(up, offsetY));

  return {
    pose: {
      position: add(above, [0, height, 0]),
      target: above,
      up,
      fov: TOP_FOV,
      focus: center,
      focusRange: 22,
      bokeh: 0.9,
    },
    sheet: { size: [sheet.width * k, sheet.height * k], yaw },
  };
};

export var SHEET_REST: [width: number, height: number] = [
  PAPER_LONG_SIDE,
  PAPER_LONG_SIDE / Math.SQRT2,
];

export type Cue = { swing: number; focus: number; breath: number };

export var STILL_CUE = (t: number): Cue => ({ swing: 0, focus: t, breath: 0 });

var _yaw = (a: XYZ, angle: number): XYZ => [
  a[0] * Math.cos(angle) + a[2] * Math.sin(angle),
  a[1],
  -a[0] * Math.sin(angle) + a[2] * Math.cos(angle),
];

var _BREATH = { range: 0.45, bokeh: 0.35 };

export var interpolatePose = (
  from: Pose,
  to: Pose,
  t: number,
  cue: Cue = STILL_CUE(t)
): Pose => {
  const lift = distance(from.position, to.position) * 0.22;
  const control = add(lerp3(from.position, to.position, 0.5), [0, lift, 0]);
  const target = lerp3(from.target, to.target, t);
  const position = lerp3(
    lerp3(from.position, control, t),
    lerp3(control, to.position, t),
    t
  );

  return {
    position: add(
      target,
      _yaw(sub(position, target), cue.swing * Math.sin(Math.PI * t))
    ),
    target,
    up: _normalize(lerp3(from.up, to.up, t)),
    fov: lerp(from.fov, to.fov, t),
    focus: lerp3(from.focus, to.focus, cue.focus),
    focusRange:
      lerp(from.focusRange, to.focusRange, t) *
      (1 - _BREATH.range * cue.breath),
    bokeh: lerp(from.bokeh, to.bokeh, t) * (1 + _BREATH.bokeh * cue.breath),
  };
};

var _smooth = (lo: number, hi: number, x: number) =>
  ((k) => k * k * (3 - 2 * k))(clamp((x - lo) / (hi - lo)));

export var SWING = 0.24;

export var shotCue = (progress: number, swing: number): Cue => ({
  swing,
  focus: _smooth(0.25, 0.9, progress),
  breath: Math.sin(Math.PI * clamp(progress / 0.8)) ** 2,
});

export var BANK = (0.8 * Math.PI) / 180;

var _cross = (a: XYZ, b: XYZ): XYZ => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

var _dot = (a: XYZ, b: XYZ) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export var rightOf = (pose: Pose): XYZ =>
  _normalize(_cross(sub(pose.target, pose.position), pose.up), [1, 0, 0]);

export var arcRoll = (from: Pose, to: Pose, t: number, cue: Cue): number =>
  ((arced, straight) =>
    ((bulge) =>
      length(bulge) < 1e-6
        ? 0
        : BANK *
          Math.sin(Math.PI * t) *
          clamp((-2 * _dot(bulge, rightOf(arced))) / length(bulge), -1, 1))(
      sub(arced.position, straight.position)
    ))(
    interpolatePose(from, to, t, cue),
    interpolatePose(from, to, t, { ...cue, swing: 0 })
  );

export var bank = (pose: Pose, roll: number): Pose =>
  roll === 0
    ? pose
    : {
        ...pose,
        up: _normalize(
          add(
            scale(pose.up, Math.cos(roll)),
            scale(rightOf(pose), Math.sin(roll))
          )
        ),
      };

export var transitionDuration = (from: Pose, to: Pose): number =>
  clamp(1.1 + distance(from.position, to.position) * 0.012, 0, 2.4);

var _bezier = (a: number, b: number) => (s: number) =>
  3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;

var _easeX = _bezier(0.4, 0.1);
var _easeY = _bezier(0, 1);

export var easeShot = (t: number): number =>
  ((x) =>
    x <= 0 || x >= 1
      ? x
      : _easeY(
          Array.from({ length: 24 })
            .reduce<[number, number]>(
              ({ 0: low, 1: high }) =>
                ((mid) => (_easeX(mid) < x ? [mid, high] : [low, mid]))(
                  (low + high) / 2
                ),
              [0, 1]
            )
            .reduce((sum, value) => sum + value / 2, 0)
        ))(clamp(t));

var _smoother = (lo: number, hi: number, x: number) =>
  ((k) => k * k * k * (k * (k * 6 - 15) + 10))(clamp((x - lo) / (hi - lo)));

export var OPENING = {
  seconds: 4.2,
  reveal: 0.62,
  skip: 0.8,
  camera: onFrame(15, 30, 6.6),
  target: onFrame(2, 0, 3.4),
  rim: onFrame(11.5, 7.5, 7),
  fov: 36,
  focusRange: 6,
  bokeh: 3.2,
};

export var openingPose = (intro: Pose): Pose => ({
  ...intro,
  position: OPENING.camera,
  target: OPENING.target,
  up: [0, 1, 0],
  fov: OPENING.fov,
  focus: OPENING.rim,
  focusRange: OPENING.focusRange,
  bokeh: OPENING.bokeh,
});

export var openingAt = (from: Pose, to: Pose, p: number): Pose =>
  ((ground, rise, look, rack, lens) => ({
    position: [
      lerp(from.position[0], to.position[0], ground),
      lerp(from.position[1], to.position[1], rise),
      lerp(from.position[2], to.position[2], ground),
    ],
    target: lerp3(from.target, to.target, look),
    up: _normalize(lerp3(from.up, to.up, look)),
    fov: lerp(from.fov, to.fov, lens),
    focus: lerp3(lerp3(from.focus, CARD_CENTER, rack), to.focus, lens),
    focusRange: lerp(from.focusRange, to.focusRange, lens),
    bokeh: lerp(from.bokeh, to.bokeh, lens),
  }))(
    _smoother(0.16, 1, p),
    _smoother(0.3, 1, p),
    _smoother(0.08, 0.92, p),
    _smoother(0.18, 0.5, p),
    _smoother(0.35, 1, p)
  );

export var establishingPose = (pose: Pose): Pose => ({
  ...pose,
  position: add(
    add(pose.target, scale(sub(pose.position, pose.target), 1.7)),
    [0, 22, 0]
  ),
  bokeh: pose.bokeh * 0.4,
});

export var posesEqual = (a: Pose, b: Pose, epsilon = 0.01): boolean =>
  distance(a.position, b.position) < epsilon &&
  distance(a.target, b.target) < epsilon &&
  distance(a.up, b.up) < epsilon &&
  Math.abs(a.fov - b.fov) < epsilon;

export var shortestYaw = (from: number, to: number): number =>
  from +
  ((((to - from) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) -
  Math.PI;
