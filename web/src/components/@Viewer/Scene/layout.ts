import type { XYZ } from '$lib/common/types';

export type Placement = { position: XYZ; yaw: number };

export var INTRO_AZIMUTH = 0.68;

var _RIGHT: [number, number] = [
  Math.cos(INTRO_AZIMUTH),
  -Math.sin(INTRO_AZIMUTH),
];
var _DEPTH: [number, number] = [
  Math.sin(INTRO_AZIMUTH),
  Math.cos(INTRO_AZIMUTH),
];

var _lookdev = (key: string): number[] | null =>
  ((value) =>
    value?.length === 3 && value.every(Number.isFinite) ? value : null)(
    import.meta.env.DEV && typeof location !== 'undefined'
      ? new URLSearchParams(location.search).get(key)?.split(',').map(Number)
      : undefined
  );

export var onFrame = (right: number, depth: number, height = 0): XYZ => [
  _RIGHT[0] * right + _DEPTH[0] * depth,
  height,
  _RIGHT[1] * right + _DEPTH[1] * depth,
];

export var ORIGIN: Placement = { position: [0, 0, 0], yaw: 0 };

export var WINDOWS: XYZ[] = [
  onFrame(52, 48, 54),
  onFrame(-56, 34, 42),
  onFrame(4, 12, 140),
];

export var CARD: Placement = { position: onFrame(0, 0), yaw: INTRO_AZIMUTH };

export var PAPER: Placement & { lift: number } = {
  position: onFrame(-4, 11),
  yaw: INTRO_AZIMUTH,
  lift: 0.12,
};

export var PAPER_LONG_SIDE = 18;

export var CUP: Placement = {
  position: onFrame(11.5, 7.5),
  yaw: INTRO_AZIMUTH - 0.35,
};

export var PEN_HOLDER: Placement = {
  position: onFrame(-15.5, -3.5),
  yaw: 0.35,
};

export type Slot = { base: XYZ; direction: number; tilt: number };

export var PEN_SLOTS: Record<'pen' | 'pencil' | 'stylus', Slot> = {
  pencil: { base: [0.9, 0.42, 0], direction: 0, tilt: Math.atan(2.17 / 8.58) },
  pen: {
    base: [-0.9, 0.42, 0.1],
    direction: Math.PI,
    tilt: Math.atan(1.87 / 8.58),
  },
  stylus: {
    base: [0.55, 0.42, -0.75],
    direction: Math.PI / 4,
    tilt: Math.atan(1.26 / 8.58),
  },
};

export var PAPER_PLANE: Placement = { position: onFrame(-12.5, 4), yaw: 1.85 };

export var PILE_PLACE: Placement = ((override) =>
  override
    ? {
        position: onFrame(override[0]!, override[1]!),
        yaw: INTRO_AZIMUTH + override[2]!,
      }
    : { position: onFrame(-12, -42), yaw: INTRO_AZIMUTH + 0.3 })(
  _lookdev('pile')
);

var _inPile = (x: number, z: number): XYZ => [
  PILE_PLACE.position[0] +
    Math.cos(PILE_PLACE.yaw) * x +
    Math.sin(PILE_PLACE.yaw) * z,
  0,
  PILE_PLACE.position[2] -
    Math.sin(PILE_PLACE.yaw) * x +
    Math.cos(PILE_PLACE.yaw) * z,
];

var _SKETCH_CLOSED = -7.41;

var _closedBook = (center: XYZ, yaw: number): Placement => ({
  position: [
    center[0] - Math.cos(yaw) * _SKETCH_CLOSED,
    0,
    center[2] + Math.sin(yaw) * _SKETCH_CLOSED,
  ],
  yaw,
});

export var TABLET: Placement = {
  position: _inPile(0.4, 0.6),
  yaw: PILE_PLACE.yaw + Math.PI / 2 + 0.05,
};

export var SKETCHBOOK: Placement = _closedBook(
  _inPile(0.3, 0.9),
  PILE_PLACE.yaw - 0.06
);

export var RESUME: Placement = {
  position: _inPile(-0.6, -0.4),
  yaw: PILE_PLACE.yaw + 0.04,
};

export var LAMP = {
  base: onFrame(12, -27),
  button: onFrame(12.9, -25.2),
  target: onFrame(0, 0, 2.7),
};
