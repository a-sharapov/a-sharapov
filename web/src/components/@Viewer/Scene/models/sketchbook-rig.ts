import type { Vector2 } from 'three';

export var smoothstep = (edge0: number, edge1: number, x: number) =>
  ((t) => t * t * (3 - 2 * t))(
    Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  );

var _mix = (a: number, b: number, t: number) => a + (b - a) * t;

export var BOARD = 2.5;
export var SPINE = 1.8;
export var JOINT = 0.8;
export var FLAT = 9.7;
export var GAP = 0.44;
export var HINGE = FLAT + GAP / 2;
export var COVER_EDGE = 150;
export var ELASTIC_ANCHOR: [number, number] = [137, BOARD / 2];
export var ELASTIC: [number, number] = [3, 0.45];
export var RIBBON: [number, number] = [2, 0.18];
export var RIBBON_SHIFT = -2.3;

var _REACH_OPEN = 155.5 - ELASTIC_ANCHOR[0];
export var ELASTIC_REACH = 2 * HINGE - ELASTIC_ANCHOR[1] + ELASTIC[1];

export var pageProfile = (points: Vector2[]) => {
  const height = (x: number) =>
    ((i) =>
      ((a, b) =>
        -(a.y + ((b.y - a.y) * (Math.abs(x) - a.x)) / (b.x - a.x || 1)))(
        points[i]!,
        points[i + 1]!
      ))(
      Math.min(
        points.length - 2,
        Math.max(
          0,
          points.findLastIndex((point) => point.x <= Math.abs(x))
        )
      )
    );
  return {
    height,
    slope: (x: number) => (height(x + 0.25) - height(x - 0.25)) / 0.5,
  };
};

export type PageProfile = ReturnType<typeof pageProfile>;

export var pageHeight = (profile: PageProfile, x: number, flat: number) =>
  _mix(profile.height(x), FLAT, flat);

export var ribbonForms = (profile: PageProfile) =>
  [
    {
      shift: 0,
      lift: () => profile.height(RIBBON[0]) + RIBBON[1] + 0.03,
      roll: () => 0,
    },
    {
      shift: RIBBON_SHIFT,
      lift: (x: number) =>
        profile.height(x) +
        (RIBBON[1] + 0.12) * Math.hypot(1, profile.slope(x)),
      roll: (x: number) => Math.atan(profile.slope(x)),
    },
    {
      shift: RIBBON_SHIFT,
      lift: () => FLAT + RIBBON[1] + 0.03,
      roll: () => 0,
    },
  ] as const;

var _spine = (angle: number) =>
  ((half) =>
    ((c, s, reach) => ({
      x: -reach * c,
      y: SPINE - reach * s,
      angle: half,
      length: 2 * (HINGE - SPINE) * s + 2 * reach,
    }))(Math.cos(half), Math.sin(half), SPINE * Math.tan(half / 2)))(angle / 2);

export var elasticScale = (twist: number) => Math.hypot(1 - twist, twist);

var _reachOut = (turn: number, scale: number) =>
  Math.min(
    Math.cos(turn) > 1e-6
      ? (COVER_EDGE - ELASTIC_ANCHOR[0] + ELASTIC[0] * scale) / Math.cos(turn)
      : Number.POSITIVE_INFINITY,
    Math.sin(turn) > 1e-6
      ? (2 * HINGE - ELASTIC_ANCHOR[1] + ELASTIC[1] * scale) / Math.sin(turn)
      : Number.POSITIVE_INFINITY
  );

var _elastic = (wrap: number) =>
  ((turn) =>
    ((angle) => ({
      angle,
      twist: turn,
      stretch: Math.max(
        1,
        (_reachOut(angle, elasticScale(turn)) + 1.1 * (1 - turn)) /
          _mix(_REACH_OPEN, ELASTIC_REACH, turn)
      ),
    }))((Math.PI / 2) * turn))(smoothstep(0, 1, wrap));

export type SketchbookPose = {
  angle: number;
  flat: number;
  ribbon: [slope: number, closed: number];
  spine: { x: number; y: number; angle: number; length: number };
  elastic: { angle: number; stretch: number; twist: number };
};

export var foldSketchbook = (open: number): SketchbookPose =>
  ((fold, wrap) =>
    ((angle, flat) => ({
      angle,
      flat,
      ribbon: [smoothstep(0.02, 0.22, fold) * (1 - flat), flat],
      spine: _spine(angle),
      elastic: _elastic(wrap),
    }))(Math.PI * fold, smoothstep(0.3, 0.9, fold)))(
    smoothstep(0, 0.75, 1 - open),
    smoothstep(0.8, 1, 1 - open)
  );
