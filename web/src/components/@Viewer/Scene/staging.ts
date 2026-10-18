import type { Shot, XYZ } from '$lib/common/types';
import { clamp } from '$lib/common/utils';
import {
  CARD,
  CUP,
  INTRO_AZIMUTH,
  LAMP,
  onFrame,
  PAPER_PLANE,
  PEN_HOLDER,
  PILE_PLACE,
  type Placement,
  RESUME,
  SKETCHBOOK,
  TABLET,
} from './layout';
import {
  add,
  type Pose,
  type Rect,
  SHOT_FOV,
  type Size,
  scale,
  sub,
  TOP_FOV,
} from './shots';
import type { Actor, Stage } from './state.svelte';

export var ACTOR_SHOTS: Record<Actor, Shot> = {
  resume: 'resume',
  sketchbook: 'sketchbook',
  tablet: 'tablet',
  plane: 'portrait',
};

export var actorOf = (shot: Shot): Actor | null =>
  (Object.entries(ACTOR_SHOTS).find(({ 1: value }) => value === shot)?.[0] as
    | Actor
    | undefined) ?? null;

type Face = {
  center: XYZ;
  size: [width: number, height: number] | null;
  long: number;
  footprint: [x: number, z: number];
};

export var FACES: Record<Actor, Face> = {
  resume: {
    center: [0, 0.106, 0],
    size: [21, 29.7],
    long: 29.7,
    footprint: [10.8, 15.6],
  },
  sketchbook: {
    center: [0, 1, 0],
    size: [29.6, 21],
    long: 29.6,
    footprint: [15.4, 12.6],
  },
  tablet: {
    center: [0, 0.603, 0],
    size: [24, 15.2],
    long: 24,
    footprint: [12.7, 8.3],
  },
  plane: {
    center: [0, 0.05, 0],
    size: null,
    long: 29.7,
    footprint: [14.85, 10.5],
  },
};

export var RESTS: Record<Actor, Placement> = {
  resume: RESUME,
  sketchbook: SKETCHBOOK,
  tablet: TABLET,
  plane: PAPER_PLANE,
};

export var faceSize = (actor: Actor, rect: Size): [number, number] =>
  FACES[actor].size ??
  (rect.width >= rect.height
    ? [
        FACES[actor].long,
        (FACES[actor].long * rect.height) / Math.max(1, rect.width),
      ]
    : [
        (FACES[actor].long * rect.width) / Math.max(1, rect.height),
        FACES[actor].long,
      ]);

var _cross = (a: XYZ, b: XYZ): XYZ => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export var yawQuaternion = (yaw: number): Stage['quaternion'] => [
  0,
  Math.sin(yaw / 2),
  0,
  Math.cos(yaw / 2),
];

export var TABLE_STAGE: XYZ = onFrame(-3, 8);

export var THROW = ((seconds) => ({
  delay: 1.2,
  seconds,
  fold: 1.1 / seconds,
  away: 2.2 / seconds,
}))(6.9);

export type StageFit = { pose: Pose; stage: Stage };

export var LENSES: Record<Actor, number> = {
  resume: TOP_FOV,
  sketchbook: TOP_FOV,
  tablet: TOP_FOV,
  plane: SHOT_FOV,
};

var _halfFov = (fov: number) => Math.tan((fov * Math.PI) / 360);

var _LAYOUT_HALF_FOV = _halfFov(SHOT_FOV);

var _tableFit = (actor: Actor, viewport: Size, rect: Rect): StageFit => {
  const face = faceSize(actor, rect);
  const center = add(TABLE_STAGE, [0, FACES[actor].center[1], 0]);
  const yaw = INTRO_AZIMUTH;
  const k = face[1] / Math.max(1, rect.height);
  const up: XYZ = [-Math.sin(yaw), 0, -Math.cos(yaw)];
  const right: XYZ = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const height = (viewport.height * k) / (2 * _halfFov(LENSES[actor]));
  const offsetX = (rect.left + rect.width / 2 - viewport.width / 2) * k;
  const offsetY = (rect.top + rect.height / 2 - viewport.height / 2) * k;
  const above = add(sub(center, scale(right, offsetX)), scale(up, offsetY));

  return {
    pose: {
      position: add(above, [0, height, 0]),
      target: above,
      up,
      fov: LENSES[actor],
      focus: center,
      focusRange: 22,
      bokeh: 0.9,
    },
    stage: { position: center, quaternion: yawQuaternion(yaw), face },
  };
};

export var stageFit = (actor: Actor, viewport: Size, rect: Rect): StageFit =>
  _tableFit(actor, viewport, rect);

export type Tool = 'pen' | 'pencil' | 'stylus';

var _TOOL_GAP = 0.6;

var _beside = (
  edge: number,
  length: number,
  radius: number,
  turn: number,
  depth = 0
): [right: number, depth: number, turn: number] => [
  edge +
    Math.sign(edge) *
      (_TOOL_GAP + radius + (Math.abs(Math.sin(turn)) * length) / 2),
  depth,
  turn,
];

export var TOOLS: Record<
  Tool,
  {
    actor: Actor;
    length: number;
    radius: number;
    edge: number;
    depth: number;
    window: [from: number, to: number];
    jitter: { turn: number; depth: [from: number, to: number]; roll: number };
  }
> = {
  pen: {
    actor: 'resume',
    length: 14,
    radius: 0.43,
    edge: -10.6,
    depth: 3,
    window: [0.45, 1],
    jitter: { turn: 0.105, depth: [-0.5, 1.5], roll: 0.26 },
  },
  pencil: {
    actor: 'sketchbook',
    length: 17.5,
    radius: 0.35,
    edge: -15,
    depth: 3,
    window: [0.45, 1],
    jitter: { turn: 0.087, depth: [0.5, 2], roll: 0.5 },
  },
  stylus: {
    actor: 'tablet',
    length: 16.6,
    radius: 0.455,
    edge: -12.7,
    depth: 0,
    window: [0.55, 1],
    jitter: { turn: 0.087, depth: [0, 1], roll: 0.5 },
  },
};

export type ToolJitter = { turn: number; depth: number; roll: number };

export var TOOL_STEADY: ToolJitter = { turn: 0, depth: 0, roll: 0 };

export var rollJitter = (tool: Tool, random = Math.random): ToolJitter =>
  ((jitter) => ({
    turn: (random() < 0.5 ? -1 : 1) * jitter.turn * (0.35 + 0.65 * random()),
    depth: jitter.depth[0] + (jitter.depth[1] - jitter.depth[0]) * random(),
    roll: jitter.roll * (2 * random() - 1),
  }))(TOOLS[tool].jitter);

var _toolPlace = (tool: Tool, jitter: ToolJitter) =>
  ((spec) =>
    _beside(
      spec.edge,
      spec.length,
      spec.radius,
      jitter.turn,
      spec.depth + jitter.depth
    ))(TOOLS[tool]);

export var toolLaid = (
  tool: Tool,
  jitter: ToolJitter = TOOL_STEADY
): { center: XYZ; axis: XYZ; roll: number } =>
  ((place) => ({
    center: add(add(TABLE_STAGE, onFrame(place[0], place[1])), [
      0,
      TOOLS[tool].radius,
      0,
    ]),
    axis: onFrame(Math.sin(place[2]), -Math.cos(place[2])),
    roll: jitter.roll,
  }))(_toolPlace(tool, jitter));

var _toolCircles = (actor: Actor): Array<[number, number, number]> =>
  (Object.keys(TOOLS) as Tool[])
    .filter((tool) => TOOLS[tool].actor === actor)
    .flatMap((tool) =>
      ((spec, place) =>
        Array.from(
          { length: Math.ceil(spec.length) + 1 },
          (_, i): [number, number, number] =>
            ((along) => [
              _toFrame(TABLE_STAGE)[0] + place[0] + Math.sin(place[2]) * along,
              _toFrame(TABLE_STAGE)[1] + place[1] - Math.cos(place[2]) * along,
              spec.radius - _GAP.props + _TOOL_GAP,
            ])((i / Math.ceil(spec.length) - 0.5) * spec.length)
        ))(TOOLS[tool], _toolPlace(tool, TOOL_STEADY))
    );

export type Prop = 'card' | 'cup' | 'penHolder' | 'plane' | 'pile';

var _PROPS: Record<
  Prop,
  { position: XYZ; radius: number; height: number; visible: number }
> = {
  pile: { position: PILE_PLACE.position, radius: 15, height: 3, visible: 0.25 },
  cup: { position: CUP.position, radius: 6.6, height: 8.5, visible: 0.45 },
  penHolder: {
    position: PEN_HOLDER.position,
    radius: 4.6,
    height: 13,
    visible: 0.45,
  },
  card: { position: CARD.position, radius: 4.8, height: 6, visible: 0.5 },
  plane: { position: PAPER_PLANE.position, radius: 4, height: 2, visible: 0.5 },
};

var _CIRCLES: Partial<Record<Prop, Array<[number, number, number]>>> = {
  pile: [-6.5, 0, 6.5].map((along): [number, number, number] => [
    along * Math.sin(PILE_PLACE.yaw - INTRO_AZIMUTH),
    along * Math.cos(PILE_PLACE.yaw - INTRO_AZIMUTH),
    10.5,
  ]),
};

var _circlesAt = (
  prop: Prop,
  at: [number, number]
): Array<[number, number, number]> =>
  (_CIRCLES[prop] ?? [[0, 0, _PROPS[prop].radius]]).map(
    ({ 0: dx, 1: dz, 2: radius }) => [at[0] + dx, at[1] + dz, radius]
  );

var _ARRANGE_ORDER: Record<'wide' | 'narrow', Prop[]> = {
  wide: ['pile', 'cup', 'penHolder', 'plane', 'card'],
  narrow: ['cup', 'penHolder', 'plane', 'card', 'pile'],
};

var _CANON: { viewport: Size; rects: Record<Actor, Rect> } = {
  viewport: { width: 1440, height: 900 },
  rects: {
    resume: { left: 459, top: 72, width: 523, height: 739 },
    sketchbook: { left: 208, top: 72, width: 1024, height: 726 },
    tablet: { left: 208, top: 72, width: 1024, height: 649 },
    plane: { left: 208, top: 72, width: 1024, height: 739 },
  },
};

var _toFrame = (point: XYZ): [number, number] => [
  point[0] * Math.cos(INTRO_AZIMUTH) - point[2] * Math.sin(INTRO_AZIMUTH),
  point[0] * Math.sin(INTRO_AZIMUTH) + point[2] * Math.cos(INTRO_AZIMUTH),
];

var _CHROME = { top: 56, bottom: 96 };

var _window = (actor: Actor) =>
  ((rect) =>
    ((fit) =>
      ((k, target) => ({
        center: [
          target[0],
          target[1] + ((_CHROME.top - _CHROME.bottom) / 2) * k,
        ] as [number, number],
        half: [
          (_CANON.viewport.width * k) / 2,
          ((_CANON.viewport.height - _CHROME.top - _CHROME.bottom) * k) / 2,
        ] as [number, number],
        camera:
          fit.pose.target[1] +
          ((fit.pose.position[1] - fit.pose.target[1]) *
            _halfFov(LENSES[actor])) /
            _LAYOUT_HALF_FOV,
      }))(fit.stage.face[1] / rect.height, _toFrame(fit.pose.target)))(
      stageFit(actor, _CANON.viewport, rect)
    ))(_CANON.rects[actor]);

var _GAP = { face: 0.8, props: 1.2, lamp: 1.5 };

var _LAMP_BASE: [number, number, number] = [..._toFrame(LAMP.base), 3.3];

var _visible = (
  at: [number, number],
  prop: (typeof _PROPS)[Prop],
  frame: ReturnType<typeof _window>
) =>
  ((s) =>
    [0, 1].reduce(
      (product, axis) =>
        product *
        clamp(
          (frame.half[axis]! -
            Math.abs((at[axis]! - frame.center[axis]!) * s) +
            prop.radius * s) /
            (2 * prop.radius * s)
        ),
      1
    ))(frame.camera / Math.max(1, frame.camera - prop.height / 2));

var _fromFace = (at: [number, number], radius: number, actor: Actor) =>
  ((face) =>
    Math.hypot(
      Math.max(0, Math.abs(at[0] - face[0]) - FACES[actor].footprint[0]),
      Math.max(0, Math.abs(at[1] - face[1]) - FACES[actor].footprint[1])
    ) - radius)(_toFrame(TABLE_STAGE));

var _wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

var _STEP = 1.5;

type Placed = { from: [number, number]; to: [number, number]; radius: number };

var _pathClear = (
  from: [number, number],
  to: [number, number],
  radius: number,
  other: Placed
) =>
  [0.25, 0.5, 0.75].every((t) =>
    ((a, b) =>
      Math.hypot(a[0] - b[0], a[1] - b[1]) >=
      Math.min(
        radius + other.radius,
        Math.hypot(from[0] - other.from[0], from[1] - other.from[1])
      ))(
      [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t],
      [
        other.from[0] + (other.to[0] - other.from[0]) * t,
        other.from[1] + (other.to[1] - other.from[1]) * t,
      ]
    )
  );

var _place = (
  actor: Actor,
  prop: Prop,
  placed: Array<[number, number, number]>,
  moving: Placed[],
  frame: ReturnType<typeof _window>
): [number, number] =>
  ((rest, item, face) =>
    Array.from(
      { length: Math.ceil((2 * (frame.half[0] + 24)) / _STEP) },
      (_, i) => frame.center[0] - frame.half[0] - 24 + i * _STEP
    )
      .flatMap((right) =>
        Array.from(
          { length: Math.ceil((2 * (frame.half[1] + 24)) / _STEP) },
          (_, j): [number, number] => [
            right,
            frame.center[1] - frame.half[1] - 24 + j * _STEP,
          ]
        )
      )
      .filter(
        (at) =>
          _circlesAt(prop, at).every(
            ({ 0: right, 1: depth, 2: radius }) =>
              _fromFace([right, depth], radius, actor) >= _GAP.face &&
              placed.every(
                ({ 0: r, 1: d, 2: other }) =>
                  Math.hypot(right - r, depth - d) >=
                  radius + other + _GAP.props
              ) &&
              Math.hypot(right - _LAMP_BASE[0], depth - _LAMP_BASE[1]) >=
                _LAMP_BASE[2] + radius + _GAP.lamp
          ) &&
          moving.every((other) =>
            _pathClear(rest, at, _PROPS[prop].radius, other)
          )
      )
      .map((at) => ({
        at,
        cost: ((visible) =>
          2.5 *
            _wrap(
              Math.atan2(at[1] - face[1], at[0] - face[0]) -
                Math.atan2(rest[1] - face[1], rest[0] - face[0])
            ) **
              2 +
          0.03 * Math.hypot(at[0] - rest[0], at[1] - rest[1]) +
          (visible < item.visible ? (item.visible - visible) * 40 : 0) +
          (visible < 0.05 ? 25 : 0) -
          1.5 * Math.min(visible, item.visible + 0.25))(
          _visible(at, item, frame)
        ),
      }))
      .reduce((best, option) => (option.cost < best.cost ? option : best), {
        at: rest,
        cost: Number.POSITIVE_INFINITY,
      }).at)(
    _toFrame(_PROPS[prop].position),
    _PROPS[prop],
    _toFrame(TABLE_STAGE)
  );

var _fromFrame = (right: number, depth: number): XYZ => onFrame(right, depth);

export type Room = Partial<Record<Prop, XYZ>>;

export var roomOf = (actor: Actor): Room =>
  ((frame) =>
    Object.fromEntries(
      _ARRANGE_ORDER[actor === 'resume' ? 'wide' : 'narrow']
        .filter((prop) => prop !== actor)
        .reduce<Array<[Prop, [number, number]]>>(
          (done, prop) => [
            ...done,
            [
              prop,
              _place(
                actor,
                prop,
                [
                  ..._toolCircles(actor),
                  ...done.flatMap(({ 0: other, 1: at }) =>
                    _circlesAt(other, at)
                  ),
                ],
                done.map(({ 0: other, 1: at }) => ({
                  from: _toFrame(_PROPS[other].position),
                  to: at,
                  radius: other === 'pile' ? 10.5 : _PROPS[other].radius,
                })),
                frame
              ),
            ],
          ],
          []
        )
        .map(({ 0: prop, 1: at }) => [
          prop,
          ((target) => [
            target[0] - _PROPS[prop].position[0],
            0,
            target[2] - _PROPS[prop].position[2],
          ])(_fromFrame(at[0], at[1])),
        ])
    ))(_window(actor));

var _ROOMS: Partial<Record<Actor, Room>> = {};

export var ROOM: Record<Actor, Room> = Object.defineProperties(
  {} as Record<Actor, Room>,
  Object.fromEntries(
    (Object.keys(FACES) as Actor[]).map((actor) => [
      actor,
      { enumerable: true, get: () => (_ROOMS[actor] ??= roomOf(actor)) },
    ])
  )
);

export var roomPending = (): Actor[] =>
  (Object.keys(FACES) as Actor[]).filter((actor) => !_ROOMS[actor]);

export var warmRoom = (actor: Actor) => void ROOM[actor];

export var ROOM_WARMUP: Actor[] = ['plane', 'tablet', 'sketchbook', 'resume'];

export var roomShare = (p: number) =>
  ((t) => t * t * (3 - 2 * t))(clamp(p / 0.45));

var _roomWeights = (actors: Record<Actor, number>): Record<Actor, number> =>
  ((dominance) =>
    ((total) =>
      Object.fromEntries(
        (Object.keys(actors) as Actor[]).map((actor) => [
          actor,
          total > 0 ? (roomShare(actors[actor]) * dominance[actor]) / total : 0,
        ])
      ) as Record<Actor, number>)(
      (Object.values(dominance) as number[]).reduce(
        (sum, value) => sum + value,
        0
      )
    ))(
    Object.fromEntries(
      (Object.keys(actors) as Actor[]).map((actor) => [
        actor,
        carryTravel(actor, actors[actor]) ** 6,
      ])
    ) as Record<Actor, number>
  );

export var roomFor = (prop: Prop, actors: Record<Actor, number>): XYZ =>
  ((weights) =>
    (Object.keys(actors) as Actor[]).reduce<XYZ>(
      (sum, actor) =>
        weights[actor] > 0
          ? add(sum, scale(ROOM[actor][prop] ?? [0, 0, 0], weights[actor]))
          : sum,
      [0, 0, 0]
    ))(_roomWeights(actors));

export var rotate = (q: Stage['quaternion'], v: XYZ): XYZ =>
  ((t) => add(add(v, scale(t, q[3])), _cross([q[0], q[1], q[2]], t)))(
    scale(_cross([q[0], q[1], q[2]], v), 2)
  );

export var facePoint = (stage: Stage, u: number, v: number): XYZ =>
  add(
    stage.position,
    add(
      scale(rotate(stage.quaternion, [1, 0, 0]), (u * stage.face[0]) / 2),
      scale(rotate(stage.quaternion, [0, 0, 1]), (-v * stage.face[1]) / 2)
    )
  );

export var PILE: Array<[actor: Actor, thickness: number]> = [
  ['resume', 0.17],
  ['sketchbook', 2.08],
  ['tablet', 0.61],
];

var _BASE: Partial<Record<Actor, number>> = { sketchbook: 0.09 };

var _CARRY_SHARE: Partial<Record<Actor, number>> = { sketchbook: 0.55 };

export var carryShare = (actor: Actor) => _CARRY_SHARE[actor] ?? 1;

export var carryTravel = (actor: Actor, p: number) =>
  clamp(p / carryShare(actor));

export var SKETCH_TIMELINE = { open: [0.58, 0.9], blank: [0.9, 1] } as const;

export var ACTOR_SECONDS: Partial<
  Record<Actor, [forth: number, back: number]>
> = {
  resume: [2.2, 2],
  sketchbook: [2.6, 2.6],
  tablet: [2.2, 2],
  plane: [2.6, 1.6],
};

export var CARRY_SPAN = 0.9;

export var carryEase = (t: number) =>
  ((x) => x * x * x * (x * (x * 6 - 15) + 10))(clamp(t / CARRY_SPAN));

export var carryTime = (p: number) =>
  p <= 0 || p >= 1
    ? clamp(p)
    : Array.from({ length: 24 }).reduce<[number, number]>(
        ({ 0: low, 1: high }) =>
          ((mid) =>
            carryEase(mid * CARRY_SPAN) < p ? [mid, high] : [low, mid])(
            (low + high) / 2
          ),
        [0, 1]
      )[1];

export type Footprint = {
  center: [number, number];
  yaw: number;
  half: [number, number];
};

var _footprintAt = (
  placement: Placement,
  half: [number, number],
  shiftX = 0
): Footprint => ({
  center: [
    placement.position[0] + Math.cos(placement.yaw) * shiftX,
    placement.position[2] - Math.sin(placement.yaw) * shiftX,
  ],
  yaw: placement.yaw,
  half,
});

export var PILE_FOOTPRINTS: Partial<Record<Actor, Footprint>> = {
  tablet: _footprintAt(TABLET, [12.7, 8.3]),
  sketchbook: _footprintAt(SKETCHBOOK, [7.6, 10.8], -7.41),
  resume: _footprintAt(RESUME, [10.6, 14.9]),
};

var _overlap = (a: Footprint, b: Footprint, margin: number) =>
  [a.yaw, a.yaw + Math.PI / 2, b.yaw, b.yaw + Math.PI / 2].every((angle) =>
    ((axis) =>
      ((project) =>
        ((pa, pb) => pa[0] < pb[1] + margin && pb[0] < pa[1] + margin)(
          project(a),
          project(b)
        ))((f: Footprint) =>
        ((c, r) => [c - r, c + r])(
          f.center[0] * axis[0] + f.center[1] * axis[1],
          Math.abs(Math.cos(f.yaw) * axis[0] - Math.sin(f.yaw) * axis[1]) *
            f.half[0] +
            Math.abs(Math.sin(f.yaw) * axis[0] + Math.cos(f.yaw) * axis[1]) *
              f.half[1]
        )
      ))([Math.cos(angle), -Math.sin(angle)])
  );

export var pileAbove = (actor: Actor): Actor[] =>
  PILE.slice(PILE.findIndex(({ 0: item }) => item === actor) + 1).map(
    ({ 0: item }) => item
  );

var _SLIDE_MARGIN = 1.5;

var _SLIDE_DIRECTIONS: XYZ[] = [
  onFrame(-1, 0),
  onFrame(0, 1),
  onFrame(-0.7071, 0.7071),
];

var _slideAlong = (actor: Actor, direction: XYZ): number =>
  ((self, above) =>
    Array.from({ length: 28 })
      .reduce<[number, number]>(
        ({ 0: low, 1: high }) =>
          ((mid) =>
            above.some((other) =>
              _overlap(
                {
                  ...self,
                  center: [
                    self.center[0] + direction[0] * mid,
                    self.center[1] + direction[2] * mid,
                  ],
                },
                other,
                _SLIDE_MARGIN
              )
            )
              ? [mid, high]
              : [low, mid])((low + high) / 2),
        [0, 60]
      )
      .at(1)!)(
    PILE_FOOTPRINTS[actor]!,
    pileAbove(actor).map((other) => PILE_FOOTPRINTS[other]!)
  );

export var SLIDES: Record<Actor, XYZ> = Object.fromEntries(
  (['resume', 'sketchbook', 'tablet', 'plane'] as Actor[]).map((actor) => [
    actor,
    PILE_FOOTPRINTS[actor] && pileAbove(actor).length
      ? _SLIDE_DIRECTIONS
          .map((direction) => scale(direction, _slideAlong(actor, direction)))
          .reduce((best, slide) =>
            Math.hypot(...slide) < Math.hypot(...best) ? slide : best
          )
      : [0, 0, 0],
  ])
) as Record<Actor, XYZ>;

export var SLIDE_SHARE = 0.28;

var _inPileShare = (actor: Actor, actors: Record<Actor, number>) =>
  1 -
  ((t) => t * t * (3 - 2 * t))(
    clamp((carryTravel(actor, actors[actor]) - SLIDE_SHARE) / 0.1)
  );

export var pileLift = (actor: Actor, actors: Record<Actor, number>): number =>
  (_BASE[actor] ?? 0) +
  PILE.slice(
    0,
    Math.max(
      0,
      PILE.findIndex(({ 0: item }) => item === actor)
    )
  ).reduce(
    (sum, { 0: below, 1: thickness }) =>
      sum + thickness * _inPileShare(below, actors),
    0
  );

export var pileShift = (actor: Actor, actors: Record<Actor, number>): XYZ =>
  PILE.some(({ 0: item }) => item === actor)
    ? ((weights) =>
        (Object.keys(actors) as Actor[])
          .filter((other) => other !== actor)
          .reduce<XYZ>(
            (sum, other) =>
              weights[other] > 0
                ? add(sum, scale(ROOM[other].pile ?? [0, 0, 0], weights[other]))
                : sum,
            [0, 0, 0]
          ))(_roomWeights(actors))
    : [0, 0, 0];
