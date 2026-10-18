import { Quaternion, Vector3 } from 'three';
import { clamp } from '#lib/common/utils.ts';
import { computeLampRig } from './lamp-rig';
import { CARD, CUP, PAPER_PLANE, PEN_HOLDER, PILE_PLACE } from './layout';
import {
  carryShare,
  FACES,
  type Footprint,
  PILE,
  PILE_FOOTPRINTS,
  type Prop,
  pileAbove,
  ROOM,
  roomFor,
  roomShare,
  SLIDE_SHARE,
  SLIDES,
} from './staging';
import type { Actor } from './state.svelte';

type Sphere = [center: Vector3, radius: number, prop?: Prop];

var _chain = (
  from: Vector3,
  to: Vector3,
  radius: number,
  step = 2.5
): Sphere[] =>
  ((count) =>
    Array.from(
      { length: count },
      (_, i): Sphere => [from.clone().lerp(to, i / (count - 1)), radius]
    ))(Math.max(2, Math.ceil(from.distanceTo(to) / step) + 1));

var _lamp = computeLampRig();

var _OBSTACLES: Sphere[] = [
  [_lamp.shade.clone().addScaledVector(_lamp.aim, 1.5), 2.4],
  [_lamp.shade.clone().addScaledVector(_lamp.aim, 4.4), 3.7],
  ..._chain(_lamp.world(_lamp.armStart), _lamp.shade, 1.4),
  ..._chain(_lamp.base, _lamp.world(_lamp.joint), 1.4),
  [_lamp.base.clone().setY(-2), 4.6],
  ..._chain(
    new Vector3(...PEN_HOLDER.position).setY(2),
    new Vector3(...PEN_HOLDER.position).setY(21),
    5,
    3
  ).map(({ 0: center, 1: radius }): Sphere => [center, radius, 'penHolder']),
  [new Vector3(...CARD.position).setY(3.5), 5, 'card'],
  [new Vector3(...CUP.position).setY(4), 6.8, 'cup'],
  [new Vector3(...PAPER_PLANE.position).setY(1), 4, 'plane'],
  ...[-9, 0, 9].map(
    (along): Sphere => [
      new Vector3(...PILE_PLACE.position)
        .add(
          new Vector3(
            Math.sin(PILE_PLACE.yaw),
            0,
            Math.cos(PILE_PLACE.yaw)
          ).multiplyScalar(along)
        )
        .setY(-6),
      10.5,
      'pile',
    ]
  ),
];

export var lampGap = (point: Vector3) =>
  _OBSTACLES.reduce(
    (nearest, sphere) =>
      sphere[2]
        ? nearest
        : Math.min(nearest, sphere[0].distanceTo(point) - sphere[1]),
    Number.POSITIVE_INFINITY
  );

var _LEVELS = PILE.reduce<Partial<Record<Actor, [number, number]>>>(
  (levels, { 0: actor, 1: thickness }) =>
    ((bottom) => ({ ...levels, [actor]: [bottom, bottom + thickness] }))(
      Math.max(0, ...Object.values(levels).map((level) => level![1]))
    ),
  {}
);

var _FOLDED: Partial<
  Record<
    Actor,
    { size: [number, number]; shift: number; at?: [number, number] }
  >
> = {
  sketchbook: { size: [7.8, 12.7], shift: -7.41 },
};

export type Carried = Exclude<Actor, 'plane'>;

export var smooth = (lo: number, hi: number, x: number) =>
  ((t) => t * t * (3 - 2 * t))(clamp((x - lo) / (hi - lo)));

var _slides = (actor: Actor) => SLIDES[actor].some((value) => value !== 0);

export var carryFlight = (actor: Actor, t: number) =>
  _slides(actor) ? clamp((t - SLIDE_SHARE) / (1 - SLIDE_SHARE)) : t;

export var carryTurn = (actor: Actor, t: number) =>
  smooth(0.05, 0.75, carryFlight(actor, t));

export type Path = { slide: Vector3; rise: Vector3; land: Vector3 };

export var carryAt = (
  actor: Actor,
  from: Vector3,
  path: Path,
  to: Vector3,
  t: number,
  out: Vector3
) =>
  t < SLIDE_SHARE && _slides(actor)
    ? out.copy(from).lerp(path.slide, smooth(0, 1, t / SLIDE_SHARE))
    : ((f) =>
        out
          .copy(path.slide)
          .multiplyScalar((1 - f) ** 3)
          .addScaledVector(path.rise, 3 * (1 - f) ** 2 * f)
          .addScaledVector(path.land, 3 * (1 - f) * f * f)
          .addScaledVector(to, f ** 3))(carryFlight(actor, t));

export type Pin = { position: Vector3; quaternion: Quaternion };

var _point = new Vector3();
var _shift = new Vector3();
var _turn = new Quaternion();
var _center = new Vector3();
var _sample = new Vector3();
var _side = new Vector3();

var _gap = (point: Vector3, sphere: Sphere, actor: Actor, p: number) =>
  _center
    .copy(sphere[0])
    .add(
      _shift
        .set(...((sphere[2] && ROOM[actor][sphere[2]]) || [0, 0, 0]))
        .multiplyScalar(roomShare(p))
    )
    .distanceTo(point) - sphere[1];

export var obstacleGap = (point: Vector3, actor: Actor, p: number) =>
  _OBSTACLES.reduce(
    (nearest, sphere) =>
      sphere[2] === actor || (sphere[2] === 'pile' && actor !== 'plane')
        ? nearest
        : Math.min(nearest, _gap(point, sphere, actor, p)),
    Number.POSITIVE_INFINITY
  );

export var roomGap = (
  point: Vector3,
  self: Prop,
  actors: Record<Actor, number>
) =>
  _OBSTACLES.reduce(
    (nearest, sphere) =>
      sphere[2] === self
        ? nearest
        : Math.min(
            nearest,
            _center
              .copy(sphere[0])
              .add(
                sphere[2]
                  ? _shift.set(...roomFor(sphere[2], actors))
                  : _shift.set(0, 0, 0)
              )
              .distanceTo(point) - sphere[1]
          ),
    Number.POSITIVE_INFINITY
  );

var _boxGap = (point: Vector3, footprint: Footprint, level: [number, number]) =>
  ((dx, dz) =>
    ((x, z, y) =>
      x > 0 || z > 0 || y > 0
        ? Math.hypot(Math.max(x, 0), Math.max(y, 0), Math.max(z, 0))
        : Math.max(x, y, z))(
      Math.abs(dx * Math.cos(footprint.yaw) - dz * Math.sin(footprint.yaw)) -
        footprint.half[0],
      Math.abs(dx * Math.sin(footprint.yaw) + dz * Math.cos(footprint.yaw)) -
        footprint.half[1],
      Math.max(level[0] - point.y, point.y - level[1])
    ))(point.x - footprint.center[0], point.z - footprint.center[1]);

var _footprint = (actor: Actor, t: number): [number, number, number] =>
  ((folded) =>
    folded
      ? ((k) => [
          folded.size[0] + (FACES[actor].footprint[0] - folded.size[0]) * k,
          folded.size[1] + (FACES[actor].footprint[1] - folded.size[1]) * k,
          folded.shift * (1 - k),
        ])(
          folded.at
            ? smooth(folded.at[0], folded.at[1], t * carryShare(actor))
            : 0
        )
      : [...FACES[actor].footprint, 0])(_FOLDED[actor]);

export var carryClearance = (actor: Actor, from: Pin, to: Pin, path: Path) =>
  Array.from({ length: 21 }, (_, i) => 0.1 + (i / 20) * 0.8).reduce(
    (worst, t) => (
      carryAt(actor, from.position, path, to.position, t, _point),
      _turn.copy(from.quaternion).slerp(to.quaternion, carryTurn(actor, t)),
      ((size) =>
        [-1, -0.5, 0, 0.5, 1].reduce(
          (least, u) =>
            [-1, -0.5, 0, 0.5, 1].reduce(
              (inner, v) => (
                _sample
                  .set(size[2] + u * size[0], 0, v * size[1])
                  .applyQuaternion(_turn)
                  .add(_point),
                pileAbove(actor).reduce(
                  (nearest, other) =>
                    Math.min(
                      nearest,
                      _boxGap(_sample, PILE_FOOTPRINTS[other]!, _LEVELS[other]!)
                    ),
                  _OBSTACLES.reduce(
                    (nearest, sphere) =>
                      sphere[2] === actor ||
                      (sphere[2] === 'pile' && actor !== 'plane')
                        ? nearest
                        : Math.min(
                            nearest,
                            _gap(_sample, sphere, actor, t * carryShare(actor))
                          ),
                    inner
                  )
                )
              ),
              least
            ),
          worst
        ))(_footprint(actor, t))
    ),
    Number.POSITIVE_INFINITY
  );

export type Detour = readonly [rise: number, land: number, side: number];

export var DETOURS: Record<Carried, Detour> = {
  resume: [36, 40, 20],
  sketchbook: [36, 26, 10],
  tablet: [46, 40, 20],
};

export var detourPath = (
  actor: Carried,
  from: Pin,
  to: Pin,
  detour: Detour,
  out: Path
): Path => (
  out.slide.copy(from.position).add(_shift.set(...SLIDES[actor])),
  ((side) => (
    out.rise
      .copy(out.slide)
      .addScaledVector(side, detour[2])
      .setY(out.slide.y + detour[0]),
    out.land
      .copy(to.position)
      .addScaledVector(side, detour[2])
      .setY(to.position.y + detour[1]),
    out
  ))(
    _side
      .set(to.position.z - out.slide.z, 0, out.slide.x - to.position.x)
      .normalize()
  )
);

export var carryPath = (actor: Carried, from: Pin, to: Pin, out: Path): Path =>
  detourPath(actor, from, to, DETOURS[actor], out);
