import { Matrix4, Quaternion, Vector3 } from 'three';
import type { XYZ } from '#lib/common/types.ts';
import { clamp } from '#lib/common/utils.ts';
import { smooth } from './carry';
import { INTRO_AZIMUTH, onFrame, PAPER_PLANE } from './layout';
import {
  type Face,
  PAPER_THICKNESS,
  type PlaneFold,
} from './models/plane-fold';
import {
  ACTOR_SECONDS,
  CARRY_SPAN,
  FACES,
  TABLE_STAGE,
  THROW,
  yawQuaternion,
} from './staging';

export var G = 50;
var _BANK = 0.95;
var _ATTACK = 1.3;
var _ATTACK_MAX = 0.3;
var _SLOW = 20;
var _LIFTOFF = 0.5;
var _SWAY = { share: 0.25, max: 0.12 };
var _TOUCH: [before: number, after: number] = [0.16, 0.12];

export type PlanePose = {
  position: Vector3;
  quaternion: Quaternion;
  unfold: number;
};

export var planeFold = { unfold: 0 };

type Knot = [t: number, right: number, depth: number, height: number];

var _toFrame = (point: Vector3): XYZ => [
  point.x * Math.cos(INTRO_AZIMUTH) - point.z * Math.sin(INTRO_AZIMUTH),
  point.x * Math.sin(INTRO_AZIMUTH) + point.z * Math.cos(INTRO_AZIMUTH),
  point.y,
];

var _moments = (
  times: number[],
  values: number[],
  start: number,
  end: number
): number[] =>
  ((h) =>
    values
      .map((y, i): [number, number, number, number] =>
        i === 0
          ? [0, 2 * h[0]!, h[0]!, 6 * ((values[1]! - y) / h[0]! - start)]
          : i === values.length - 1
            ? [
                h[i - 1]!,
                2 * h[i - 1]!,
                0,
                6 * (end - (y - values[i - 1]!) / h[i - 1]!),
              ]
            : [
                h[i - 1]!,
                2 * (h[i - 1]! + h[i]!),
                h[i]!,
                6 *
                  ((values[i + 1]! - y) / h[i]! -
                    (y - values[i - 1]!) / h[i - 1]!),
              ]
      )
      .reduce<Array<[number, number]>>(
        (sweep, { 0: a, 1: b, 2: c, 3: d }, i) =>
          ((prev) =>
            ((m) => [...sweep, [c / m, (d - a * prev[1]) / m]])(
              b - a * prev[0]
            ))(sweep[i - 1] ?? [0, 0]),
        []
      )
      .reduceRight<number[]>(
        (moments, { 0: c, 1: d }, i) => (
          (moments[i] = d - c * (moments[i + 1] ?? 0)), moments
        ),
        Array.from({ length: values.length }, () => 0)
      ))(times.slice(1).map((t, i) => t - times[i]!));

type Track = {
  from: number;
  to: number;
  at: (t: number, out: Vector3) => Vector3;
};

var _track = (knots: Knot[], start: XYZ, end: XYZ): Track =>
  ((times, points, velocities) =>
    ((axes) => ({
      from: times[0]!,
      to: times.at(-1)!,
      at: (t: number, out: Vector3) =>
        ((i) =>
          ((h) =>
            ((a) =>
              out.set(
                ...(axes.map(
                  ({ 0: values, 1: moments }) =>
                    a * values[i]! +
                    (1 - a) * values[i + 1]! +
                    (((a ** 3 - a) * moments[i]! +
                      ((1 - a) ** 3 - (1 - a)) * moments[i + 1]!) *
                      h *
                      h) /
                      6
                ) as XYZ)
              ))((times[i + 1]! - t) / h))(times[i + 1]! - times[i]!))(
          Math.min(
            times.length - 2,
            times.reduce((found, value, i) => (value <= t ? i : found), 0)
          )
        ),
    }))(
      [0, 1, 2].map((k): [number[], number[]] =>
        ((values) => [
          values,
          _moments(times, values, velocities[0][k]!, velocities[1][k]!),
        ])(points.map((point) => point[k]!))
      )
    ))(
    knots.map(({ 0: t }) => t),
    knots.map(({ 1: right, 2: depth, 3: height }) =>
      onFrame(right, depth, height)
    ),
    [onFrame(...start), onFrame(...end)] as const
  );

var _DT = 1 / 240;
var _before = new Vector3();
var _after = new Vector3();
var _middle = new Vector3();
var _ROLL_WINDOW: Array<[number, number]> = [
  [-0.24, 1 / 16],
  [-0.16, 2 / 16],
  [-0.08, 3 / 16],
  [0, 4 / 16],
  [0.08, 3 / 16],
  [0.16, 2 / 16],
  [0.24, 1 / 16],
];

var _kinematics = (
  track: Track,
  t: number,
  position: Vector3,
  velocity: Vector3,
  acceleration: Vector3
) => (
  track.at(t - _DT, _before),
  track.at(t + _DT, _after),
  velocity.subVectors(_after, _before).divideScalar(2 * _DT),
  _ROLL_WINDOW.reduce(
    (sum, { 0: shift, 1: weight }) => (
      track.at(t + shift - _DT, _before),
      track.at(t + shift + _DT, _after),
      track.at(t + shift, _middle),
      sum.addScaledVector(
        _before.add(_after).addScaledVector(_middle, -2),
        weight / (_DT * _DT)
      )
    ),
    acceleration.set(0, 0, 0)
  ),
  track.at(t, position)
);

var _UP = new Vector3(0, 1, 0);
var _Z = new Vector3(0, 0, 1);
var _tangent = new Vector3();
var _level = new Vector3();
var _side = new Vector3();
var _force = new Vector3();
var _top = new Vector3();
var _nose = new Vector3();
var _wing = new Vector3();
var _basis = new Matrix4();

var _flying = (velocity: Vector3, acceleration: Vector3, out: Quaternion) =>
  ((speed) =>
    speed < 1e-3
      ? out
      : (_tangent.copy(velocity).divideScalar(Math.max(speed, 1e-6)),
        _level.copy(_UP).addScaledVector(_tangent, -_tangent.y).normalize(),
        _side.crossVectors(_tangent, _level),
        _force.copy(acceleration).addScaledVector(_UP, G),
        ((bank, lift) =>
          ((attack) => (
            _top
              .copy(_level)
              .multiplyScalar(Math.cos(bank))
              .addScaledVector(_side, Math.sin(bank)),
            _nose
              .copy(_tangent)
              .multiplyScalar(Math.cos(attack))
              .addScaledVector(_top, Math.sin(attack)),
            _top
              .multiplyScalar(Math.cos(attack))
              .addScaledVector(_tangent, -Math.sin(attack)),
            _wing.crossVectors(_top, _nose),
            out.setFromRotationMatrix(_basis.makeBasis(_wing, _top, _nose))
          ))(
            clamp(
              (_ATTACK * lift) / Math.max(speed, _SLOW) ** 2,
              0,
              _ATTACK_MAX
            )
          ))(
          clamp(
            Math.atan2(
              _force.dot(_side),
              Math.max(_force.dot(_level), 0.6 * G)
            ),
            -_BANK,
            _BANK
          ),
          Math.hypot(_force.dot(_side), Math.max(_force.dot(_level), 0))
        )))(velocity.length());

var _yaw = (direction: Vector3) => Math.atan2(direction.x, direction.z);

var _yawTo = (yaw: number, out: Quaternion) => out.set(...yawQuaternion(yaw));

var _shortest = (from: number, to: number) =>
  from + Math.atan2(Math.sin(to - from), Math.cos(to - from));

var _carryTime = (p: number) =>
  Array.from({ length: 30 }).reduce<[number, number]>(
    ({ 0: low, 1: high }) =>
      ((mid) =>
        mid * mid * mid * (mid * (mid * 6 - 15) + 10) < p
          ? [mid, high]
          : [low, mid])((low + high) / 2),
    [0, 1]
  )[0];

export var PLANE_SECONDS = {
  forth: CARRY_SPAN * ACTOR_SECONDS.plane![0],
  back: 4.4,
};

export var carrySeconds = (p: number) =>
  _carryTime(clamp(p)) * PLANE_SECONDS.forth;

type Pace = {
  speed: number;
  drag: number;
  launch: number;
  flare: number;
  touch: number;
};

var _resample = (points: XYZ[], step: number, start: XYZ, end: XYZ): XYZ[] =>
  ((chords) =>
    ((curve, total) =>
      ((count) =>
        Array.from({ length: count + 1 }, (_, i) =>
          _toFrame(curve.at((total * i) / count, new Vector3()))
        ))(Math.max(2, Math.round(total / step))))(
      _track(
        points.map((point, i): Knot => [chords[i]!, ...point]),
        start,
        end
      ),
      chords.at(-1)!
    ))(
    points.reduce<number[]>(
      (sums, point, i) =>
        i === 0
          ? [0]
          : [
              ...sums,
              sums.at(-1)! +
                Math.hypot(
                  point[0] - points[i - 1]![0],
                  point[1] - points[i - 1]![1],
                  point[2] - points[i - 1]![2]
                ),
            ],
      []
    )
  );

var _weave = (
  points: XYZ[],
  amplitude: number,
  wavelength: number,
  from: number,
  to: number
): XYZ[] =>
  points
    .reduce<number[]>(
      (sums, point, i) =>
        i === 0
          ? [0]
          : [
              ...sums,
              sums.at(-1)! +
                Math.hypot(
                  point[0] - points[i - 1]![0],
                  point[1] - points[i - 1]![1]
                ),
            ],
      []
    )
    .map(
      (s, i): XYZ =>
        ((a, b, u) =>
          ((dx, dz, shift) =>
            [
              points[i]![0] - (dz / Math.max(1e-9, Math.hypot(dx, dz))) * shift,
              points[i]![1] + (dx / Math.max(1e-9, Math.hypot(dx, dz))) * shift,
              points[i]![2],
            ] as XYZ)(
            b[0] - a[0],
            b[1] - a[1],
            u > 0 && u < 1
              ? amplitude *
                  Math.sin((2 * Math.PI * (s - from)) / wavelength) *
                  Math.sin(Math.PI * u) ** 2
              : 0
          ))(
          points[Math.max(0, i - 1)]!,
          points[Math.min(points.length - 1, i + 1)]!,
          (s - from) / (to - from)
        )
    );

var _direction = (a: XYZ, b: XYZ): XYZ =>
  ((length): XYZ => [
    (b[0] - a[0]) / length,
    (b[1] - a[1]) / length,
    (b[2] - a[2]) / length,
  ])(Math.max(1e-9, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])));

var _timed = (points: XYZ[], from: number, pace: Pace): Knot[] =>
  ((lengths) =>
    ((distance) =>
      ((total, base) =>
        ((speeds) =>
          lengths.reduce<Knot[]>(
            (knots, length, i) => [
              ...knots,
              [
                knots.at(-1)![0] +
                  length / Math.max(1e-6, (speeds[i]! + speeds[i + 1]!) / 2),
                ...points[i + 1]!,
              ],
            ],
            [[from, ...points[0]!]]
          ))(
          points.map((point, i) =>
            ((free) =>
              distance[i]! < pace.launch
                ? pace.speed * Math.sqrt(distance[i]! / pace.launch)
                : distance[i]! > total - pace.flare
                  ? free +
                    (pace.touch - free) *
                      ((distance[i]! - (total - pace.flare)) / pace.flare)
                  : free)(
              Math.sqrt(
                Math.max(
                  9,
                  pace.speed ** 2 -
                    2 * G * (point[2] - base) -
                    2 * pace.drag * Math.max(0, distance[i]! - pace.launch)
                )
              )
            )
          )
        ))(
        distance.at(-1)!,
        points[distance.findIndex((value) => value >= pace.launch)]?.[2] ??
          points[0]![2]
      ))(
      lengths.reduce<number[]>(
        (sums, length) => [...sums, sums.at(-1)! + length],
        [0]
      )
    ))(
    points
      .slice(1)
      .map((point, i) =>
        Math.hypot(
          point[0] - points[i]![0],
          point[1] - points[i]![1],
          point[2] - points[i]![2]
        )
      )
  );

var _paceFor = (
  duration: (speed: number) => number,
  target: number,
  low: number,
  high: number
) =>
  Array.from({ length: 40 }).reduce<[number, number]>(
    ({ 0: slow, 1: fast }) =>
      ((mid) => (duration(mid) > target ? [mid, fast] : [slow, mid]))(
        (slow + fast) / 2
      ),
    [low, high]
  )[1];

var _FORTH = {
  climb: [
    [0, 0, 0],
    [0.4, 0, 0.25],
    [1.1, 0, 0.9],
    [2.0, 0, 1.9],
    [3.3, 0, 3.6],
    [4.6, 0, 5.6],
    [5.8, 0, 7.5],
    [6.8, 0, 9.0],
    [7.7, 0, 10.1],
    [8.4, 0, 10.75],
    [8.95, 0, 11.05],
  ] as XYZ[],
  pace: { speed: 33, drag: 6, launch: 2.6, flare: 0, touch: 0 } as Pace,
  float: [
    [0.2, -1.05, 0.1, 10.6],
    [0.4, -0.7, 0.3, 8.8],
    [0.58, -0.38, 0.05, 6.0],
    [0.75, -0.15, -0.22, 3.0],
    [0.9, -0.04, -0.06, 0.9],
  ] as Knot[],
  stall: [0.15, 0.3] as [number, number],
  land: 1.05,
  unfold: [-0.05, 0.75] as [number, number],
};

var _CIRCUIT = {
  launch: [
    [0, 0, 0],
    [0.4, 0, 0.15],
    [1.0, 0, 0.5],
    [1.8, 0, 1.15],
    [2.6, 0, 2.2],
    [4.66, -0.42, 2.6],
    [6.39, -1.6, 3.71],
    [7.53, -3.36, 5.31],
    [7.9, -5.43, 7.09],
    [7.43, -7.48, 8.69],
    [6.2, -9.19, 9.8],
    [4.41, -10.28, 10.2],
  ] as XYZ[],
  along: [
    [-4.6, -6.6, 7.6],
    [-13.4, -10.6, 5.2],
  ] as XYZ[],
  behind: [
    [3.4, -4.5, 9.6],
    [1.8, -10.5, 10.0],
    [-2.2, -15.0, 9.8],
    [-7.0, -17.0, 9.2],
    [-13.0, -17.5, 8.0],
    [-19.0, -17.2, 6.6],
    [-25.0, -16.0, 5.4],
    [-29.5, -13.5, 4.5],
    [-32.2, -9.6, 3.7],
  ] as XYZ[],
  turn: [
    [-22.18, -12.47, 4.4],
    [-26.91, -12.45, 3.89],
    [-30.87, -9.87, 3.38],
    [-32.82, -5.57, 2.88],
    [-32.13, -0.89, 2.37],
    [-29.03, 2.67, 1.86],
    [-24.5, 4.0, 1.3],
    [-21.6, 4.03, 0.5],
    [-18.6, 4.05, 0],
  ] as XYZ[],
  pace: { speed: 34, drag: 4, launch: 3.2, flare: 7, touch: 20 } as Pace,
  aroundDrag: 1,
};

var _ARRIVAL = {
  weave: [0.45, 26] as [number, number],
  approach: [
    [46, 3.1, 15.0],
    [38, 2.8, 14.6],
    [31, 2.2, 14.0],
    [20, 1.3, 12.9],
    [11, -0.5, 10.9],
    [3.5, -3.0, 8.9],
    [-4.65, -6.6, 7.4],
    [-12.85, -10.6, 6.0],
  ] as XYZ[],
  pace: { speed: 32, drag: 9, launch: 0, flare: 9, touch: 19 } as Pace,
};

var _BACK_FOLD = 0.6;
var _STEP = 3;
var _DEPARTURE = 36;

export type PlaneFlight = {
  forth: (t: number) => PlanePose;
  back: (t: number) => PlanePose;
  around: (t: number) => PlanePose;
  throwing: (t: number) => PlanePose;
  marks: {
    apex: number;
    land: number;
    back: number;
    around: number;
    arrival: number;
    swap: number;
  };
};

type Pin = { position: Vector3; quaternion: Quaternion };

export var createPlaneFlight = (
  fold: PlaneFold,
  face: () => Face
): PlaneFlight => {
  const dart = fold.pose(0, [29.7, 21]).map((point) => new Vector3(...point));
  const keel = dart[1]!.clone().add(dart[2]!).multiplyScalar(0.5);
  const center = new Vector3(...FACES.plane.center);
  const unroll = new Quaternion().setFromAxisAngle(_Z, -fold.roll);
  const lean = new Quaternion().setFromAxisAngle(_Z, fold.roll);

  const rest: Pin = {
    position: new Vector3(...PAPER_PLANE.position),
    quaternion: _yawTo(PAPER_PLANE.yaw, new Quaternion()),
  };
  const stage: Pin = {
    position: new Vector3(...TABLE_STAGE),
    quaternion: _yawTo(INTRO_AZIMUTH, new Quaternion()),
  };
  const launch: Pin = {
    position: stage.position.clone(),
    quaternion: _yawTo(INTRO_AZIMUTH + Math.PI / 2, new Quaternion()),
  };
  const _keelOf = (pin: Pin) =>
    _toFrame(keel.clone().applyQuaternion(pin.quaternion).add(pin.position));
  const restKeel = _keelOf(rest);
  const launchKeel = _keelOf(launch);
  const stageFace = _toFrame(center.clone().add(stage.position));
  const lying = {
    rest: rest.quaternion.clone().multiply(lean),
    launch: launch.quaternion.clone().multiply(lean),
  };
  const { 0: ahead, 1: across } = ((nose): [XYZ, XYZ] => [
    [nose[0], nose[1], 0],
    [-nose[1], nose[0], 0],
  ])(_toFrame(_Z.clone().applyQuaternion(rest.quaternion)));

  const _along = (origin: XYZ, { 0: a, 1: s, 2: h }: XYZ): XYZ => [
    origin[0] + ahead[0] * a + across[0] * s,
    origin[1] + ahead[1] * a + across[1] * s,
    h,
  ];

  const climb = _timed(
    _resample(
      _FORTH.climb.map((point) => _along(restKeel, point)),
      _STEP,
      ahead,
      ahead
    ),
    0,
    _FORTH.pace
  );
  const apex = climb.at(-1)![0];
  const forthTrack = _track(
    [
      ...climb,
      ..._FORTH.float.map(
        ({ 0: t, 1: a, 2: s, 3: h }): Knot => [
          apex + t,
          ..._along(stageFace, [a, s, h]),
        ]
      ),
      [apex + _FORTH.land, ...stageFace],
    ],
    [0, 0, 0],
    [0, 0, 0]
  );

  const touchdown = _CIRCUIT.turn.at(-1)!;
  const slide = ((dx, dz) => ({
    length: Math.hypot(dx, dz),
    direction: [dx / Math.hypot(dx, dz), dz / Math.hypot(dx, dz), 0] as XYZ,
    heading: _yaw(new Vector3(...onFrame(dx, dz, 0))),
  }))(restKeel[0] - touchdown[0], restKeel[1] - touchdown[1]);

  const _circuit = (knots: Knot[], start: XYZ, pace: Pace, stop: number) => ({
    track: _track(knots, start, [
      slide.direction[0] * pace.touch,
      slide.direction[1] * pace.touch,
      0,
    ]),
    touch: knots.at(-1)![0],
    stop,
  });
  const _end = (knots: Knot[], pace: Pace) =>
    knots.at(-1)![0] + (2 * slide.length) / pace.touch;
  const _paced = (points: XYZ[], from: number, pace: Pace, stop: number) =>
    ((speed) => ({ ...pace, speed }))(
      _paceFor(
        (speed) => _end(_timed(points, from, { ...pace, speed }), pace),
        stop,
        10,
        150
      )
    );

  const launchPoints = _CIRCUIT.launch.map(
    ({ 0: right, 1: depth, 2: height }): XYZ => [
      launchKeel[0] + right,
      launchKeel[1] + depth,
      height,
    ]
  );
  const right: XYZ = [1, 0, 0];
  const _homeward = (points: XYZ[], drag: number) =>
    ((knots) =>
      ((pace) => ({
        pace,
        track: _circuit(
          _timed(knots, _BACK_FOLD, pace),
          [0, 0, 0],
          pace,
          PLANE_SECONDS.back
        ),
      }))(
        _paced(
          knots,
          _BACK_FOLD,
          { ..._CIRCUIT.pace, drag },
          PLANE_SECONDS.back
        )
      ))(_resample(points, _STEP, right, slide.direction));
  const { pace: backPace, track: back } = _homeward(
    [...launchPoints, ..._CIRCUIT.along, ..._CIRCUIT.turn],
    _CIRCUIT.pace.drag
  );
  const { track: around } = _homeward(
    [
      ...launchPoints.slice(0, -2),
      ..._CIRCUIT.behind,
      ..._CIRCUIT.turn.slice(3),
    ],
    _CIRCUIT.aroundDrag
  );

  const throwStart = THROW.fold * THROW.seconds;
  const swap = THROW.away * THROW.seconds;
  const departure = _track(
    _timed(
      _resample(
        [...launchPoints, ..._CIRCUIT.along],
        _STEP,
        right,
        _direction(_CIRCUIT.along[0]!, _CIRCUIT.along[1]!)
      ),
      throwStart,
      { ...backPace, speed: _DEPARTURE }
    ),
    [0, 0, 0],
    [0, 0, 0]
  );
  const arrivalPoints = ((points) =>
    _weave(
      points,
      ..._ARRIVAL.weave,
      0,
      points.findIndex((point) => point[0] < _CIRCUIT.turn[0]![0]) * _STEP
    ))(
    _resample(
      [..._ARRIVAL.approach, ..._CIRCUIT.turn],
      _STEP,
      _direction(_ARRIVAL.approach[0]!, _ARRIVAL.approach[1]!),
      slide.direction
    )
  );
  const arrivalPace = _paced(arrivalPoints, swap, _ARRIVAL.pace, THROW.seconds);
  const arrival = _circuit(
    _timed(arrivalPoints, swap, arrivalPace),
    _direction(arrivalPoints[0]!, arrivalPoints[1]!).map(
      (value) => value * arrivalPace.speed
    ) as XYZ,
    arrivalPace,
    THROW.seconds
  );

  const pose: PlanePose = {
    position: new Vector3(),
    quaternion: new Quaternion(),
    unfold: 0,
  };
  const point = new Vector3();
  const velocity = new Vector3();
  const acceleration = new Vector3();
  const flying = new Quaternion();
  const motion = new Quaternion();
  const ground = new Quaternion();
  const tilt = new Quaternion();
  const sheet = new Quaternion();
  const anchor = new Vector3();
  const vertex = new Vector3();

  const _place = (orientation: Quaternion) => (
    pose.quaternion.copy(orientation).multiply(unroll),
    pose.position
      .copy(point)
      .sub(anchor.copy(keel).applyQuaternion(pose.quaternion)),
    ((low) => void (low < 0 && (pose.position.y -= low)))(
      dart.reduce(
        (low, corner) =>
          Math.min(
            low,
            vertex.copy(corner).applyQuaternion(pose.quaternion).y +
              pose.position.y
          ),
        Number.POSITIVE_INFINITY
      )
    ),
    (pose.unfold = 0),
    pose
  );

  const _folding = (unfold: number) => (
    pose.position
      .copy(stage.position)
      .setY(
        Math.max(
          0,
          PAPER_THICKNESS / 2 -
            Math.min(...fold.pose(unfold, face()).map(({ 1: y }) => y))
        )
      ),
    pose.quaternion
      .copy(launch.quaternion)
      .slerp(stage.quaternion, smooth(0, 0.5, unfold)),
    (pose.unfold = unfold),
    pose
  );

  const _flight = (
    track: Track,
    t: number,
    start: number,
    from: Quaternion
  ) => (
    _kinematics(track, t, point, velocity, acceleration),
    _flying(velocity, acceleration, flying),
    motion.copy(from).slerp(flying, smooth(start, start + _LIFTOFF, t))
  );

  const _landing = (
    circuit: ReturnType<typeof _circuit>,
    t: number,
    start: number,
    from: Quaternion
  ) =>
    ((x) => (
      _flight(circuit.track, Math.min(t, circuit.touch), start, from),
      void (
        t > circuit.touch &&
        point.set(
          ...onFrame(
            touchdown[0] +
              slide.direction[0] * slide.length * (1 - (1 - x) ** 2),
            touchdown[1] +
              slide.direction[1] * slide.length * (1 - (1 - x) ** 2),
            0
          )
        )
      ),
      ground
        .set(
          ...yawQuaternion(
            slide.heading +
              (_shortest(slide.heading, PAPER_PLANE.yaw) - slide.heading) *
                smooth(0.25, 1, x)
          )
        )
        .multiply(tilt.setFromAxisAngle(_Z, fold.roll * smooth(0.4, 1, x))),
      _place(
        motion.slerp(
          ground,
          smooth(circuit.touch - _TOUCH[0], circuit.touch + _TOUCH[1], t)
        )
      )
    ))(clamp((t - circuit.touch) / (circuit.stop - circuit.touch)));

  const top = new Quaternion()
    .setFromAxisAngle(_UP, _yaw(_Z.clone().applyQuaternion(rest.quaternion)))
    .multiply(tilt.setFromAxisAngle(new Vector3(1, 0, 0), -_FORTH.stall[0]));

  const _forth = (t: number) =>
    ((unfold) =>
      ((flat) => (
        _flight(forthTrack, t, 0, lying.rest),
        ((swing) =>
          sheet
            .setFromUnitVectors(
              _UP,
              anchor
                .copy(acceleration)
                .setY(0)
                .multiplyScalar(
                  _SWAY.share *
                    Math.min(1, swing / Math.max(1e-6, anchor.length())) *
                    smooth(apex + _FORTH.land, apex + _FORTH.land - 0.3, t)
                )
                .addScaledVector(_UP, G)
                .normalize()
            )
            .multiply(stage.quaternion))(
          (G * Math.tan(_SWAY.max)) / _SWAY.share
        ),
        motion.slerp(top, smooth(apex - _FORTH.stall[1], apex, t)),
        unfold > 0
          ? (pose.quaternion.copy(motion).multiply(unroll).slerp(sheet, flat),
            pose.position
              .copy(point)
              .sub(
                anchor
                  .copy(keel)
                  .lerp(center, flat)
                  .applyQuaternion(pose.quaternion)
              ),
            (pose.unfold = unfold),
            pose)
          : _place(motion)
      ))(smooth(0, 0.5, unfold)))(
      smooth(apex + _FORTH.unfold[0], apex + _FORTH.unfold[1], t)
    );

  const _return = (track: typeof back) => (t: number) =>
    t < _BACK_FOLD
      ? _folding(1 - smooth(0, _BACK_FOLD, t))
      : _landing(track, Math.min(t, track.stop), _BACK_FOLD, lying.launch);

  return {
    forth: (t: number) => _forth(clamp(t, 0, apex + _FORTH.land)),
    back: _return(back),
    around: _return(around),
    throwing: (t: number) =>
      t < throwStart
        ? _folding(1 - smooth(0, throwStart, t))
        : t < swap
          ? (_flight(departure, t, throwStart, lying.launch), _place(motion))
          : _landing(
              arrival,
              Math.min(t, arrival.stop),
              swap - 1,
              lying.launch
            ),
    marks: {
      apex,
      land: apex + _FORTH.land,
      back: back.touch,
      around: around.touch,
      arrival: arrival.touch,
      swap,
    },
  };
};
