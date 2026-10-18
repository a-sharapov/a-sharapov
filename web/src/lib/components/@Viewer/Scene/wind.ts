import { Vector3, Vector4 } from 'three';
import { MOVER_NAMES, type MoverName, movers } from './movers';

export var WIND = {
  puffs: 80,
  spacing: 0.5,
  life: 4,
  rise: 0.35,
  relax: 1.5,
  airDecay: 0.45,
  spread: 0.2,
  slow: 4,
  fast: 45,
  reach: 1,
  push: 1.2,
  swirl: 0.9,
  air: 0.6,
  burst: 3,
};

export var WAKE = {
  source: 'actor-plane' as MoverName,
  capture: 12,
  window: 6,
  spacing: 3,
  pull: 1,
  soft: 0.4,
  rise: 0.25,
  life: 2.6,
};

export var HEADING_LAG = 0.18;

export var wakeEnvelope = (age: number) =>
  smoothstep(0, 2 * WAKE.rise, age) *
  (1 - smoothstep(WAKE.life * 0.35, WAKE.life, age));

export type Puff = {
  position: Vector3;
  direction: Vector3;
  speed: number;
  radius: number;
  spacing: number;
  age: number;
  strength: number;
  source: MoverName | null;
};

var _GAUSS = Math.sqrt(2 * Math.PI);

export var smoothstep = (from: number, to: number, x: number) =>
  ((t) => t * t * (3 - 2 * t))(
    Math.min(1, Math.max(0, (x - from) / (to - from)))
  );

export var pushEnvelope = (age: number) =>
  (1 - Math.exp(-age / WIND.rise)) ** 2 *
  Math.exp(-age / WIND.relax) *
  (1 - smoothstep(WIND.life * 0.6, WIND.life, age));

export var puffRadius = (puff: Puff) =>
  puff.radius * (1 + WIND.spread * puff.age);

var _density = (puff: Puff, sigma: number) => puff.spacing / (_GAUSS * sigma);

export var moverSpacing = (name: MoverName) =>
  name === WAKE.source
    ? WAKE.spacing
    : Math.max(3, movers[name].radius * WIND.reach * WIND.spacing);

var _blank = (): Puff => ({
  position: new Vector3(0, -1e4, 0),
  direction: new Vector3(1, 0, 0),
  speed: 0,
  radius: 1,
  spacing: 3,
  age: WIND.life,
  strength: 0,
  source: null,
});

var _offset = new Vector3();
var _direction = new Vector3();
var _across = new Vector3();
var _side = new Vector3();
var _spin = new Vector3();
var _UP = new Vector3(0, 1, 0);

export var createWind = () => {
  const puffs = Array.from({ length: WIND.puffs }, _blank);
  const travel = Object.fromEntries(
    MOVER_NAMES.map((name) => [name, 0])
  ) as Record<MoverName, number>;
  const head = Array.from(
    { length: WIND.puffs },
    () => new Vector4(0, -1e4, 0, 1)
  );
  const tail = Array.from({ length: WIND.puffs }, () => new Vector4());
  const wake = Array.from({ length: WIND.puffs }, () => 0);
  const state = { frame: -1, active: 0 };
  const heading = Object.fromEntries(
    MOVER_NAMES.map((name) => [name, new Vector3()])
  ) as Record<MoverName, Vector3>;

  const _steer = (name: MoverName, delta: number) =>
    ((mover, course) =>
      mover.speed > 1e-3 &&
      (course.lengthSq() < 1e-6
        ? course.copy(mover.velocity).normalize()
        : course
            .lerp(
              _direction.copy(mover.velocity).divideScalar(mover.speed),
              1 - Math.exp(-delta / HEADING_LAG)
            )
            .normalize()))(movers[name], heading[name]);

  const _left = (puff: Puff) =>
    puff.age >= WIND.life ? -1 : puff.strength * pushEnvelope(puff.age);

  const _weakest = () =>
    puffs.reduce(
      (best, puff, i) => (_left(puff) < _left(puffs[best]!) ? i : best),
      0
    );

  const _emit = (name: MoverName) =>
    ((mover, puff) => (
      puff.position.copy(mover.position),
      puff.direction.copy(heading[name]),
      (puff.speed = mover.speed),
      (puff.radius = mover.radius * WIND.reach),
      (puff.spacing = moverSpacing(name)),
      (puff.age = 0),
      (puff.strength = smoothstep(WIND.slow, WIND.fast, mover.speed)),
      (puff.source = name)
    ))(movers[name], puffs[_weakest()]!);

  const _track = (name: MoverName, delta: number) =>
    ((mover) =>
      mover.seen && mover.speed > WIND.slow
        ? ((spacing) => (
            (travel[name] = Math.min(
              travel[name] + mover.speed * delta,
              spacing * WIND.burst
            )),
            Array.from({
              length: Math.floor(travel[name] / spacing),
            }).forEach(() => void (_emit(name), (travel[name] -= spacing)))
          ))(moverSpacing(name))
        : (travel[name] = 0))(movers[name]);

  const _pack = (puff: Puff, i: number) =>
    ((sigma, amount) => (
      (wake[i] =
        puff.source === WAKE.source && puff.age < WAKE.life
          ? puff.strength * wakeEnvelope(puff.age)
          : 0),
      head[i]!.set(puff.position.x, puff.position.y, puff.position.z, sigma),
      tail[i]!.set(
        puff.direction.x,
        puff.direction.y,
        puff.direction.z,
        amount
      ),
      amount > 0 || wake[i]! > 0
    ))(
      puffRadius(puff),
      puff.age < WIND.life
        ? WIND.push *
            puff.strength *
            pushEnvelope(puff.age) *
            _density(puff, puffRadius(puff))
        : 0
    );

  const step = (delta: number, frame: number) =>
    frame !== state.frame &&
    ((state.frame = frame),
    MOVER_NAMES.forEach(
      (name) => void (_steer(name, delta), _track(name, delta))
    ),
    puffs.forEach(
      (puff) => void (puff.age = Math.min(WIND.life, puff.age + delta))
    ),
    (state.active = puffs.reduce(
      (count, puff, i) => count + (_pack(puff, i) ? 1 : 0),
      0
    )),
    true);

  const airAt = (point: Vector3, out: Vector3, exclude?: MoverName) =>
    puffs.reduce(
      (sum, puff) =>
        puff.age >= WIND.life || puff.source === exclude
          ? sum
          : ((sigma) =>
              sum.addScaledVector(
                puff.direction,
                puff.speed *
                  WIND.air *
                  puff.strength *
                  Math.exp(-puff.age / WIND.airDecay) *
                  _density(puff, sigma) *
                  Math.exp(
                    -_offset.subVectors(point, puff.position).lengthSq() /
                      (2 * sigma * sigma)
                  )
              ))(puffRadius(puff)),
      out.set(0, 0, 0)
    );

  const gustAt = (point: Vector3, out: Vector3) =>
    head.reduce(
      (sum, origin, i) =>
        ((puff) =>
          puff.w > 0
            ? ((sigma) =>
                ((weight) =>
                  ((along) =>
                    ((side, length) =>
                      ((spin) =>
                        sum
                          .addScaledVector(_direction, weight)
                          .addScaledVector(
                            _spin.crossVectors(_direction, _across),
                            weight * spin
                          ))(
                        (_across.dot(side) / Math.max(length, 1e-3)) *
                          (WIND.swirl / sigma)
                      ))(
                      ((turn) =>
                        turn.divideScalar(Math.max(turn.length(), 1e-3)))(
                        _side.crossVectors(_direction, _UP)
                      ),
                      _across
                        .copy(_offset)
                        .addScaledVector(_direction, -along)
                        .length()
                    ))(_offset.dot(_direction)))(
                  Math.exp(-_offset.lengthSq() / (2 * sigma * sigma)) * puff.w
                ))(
                (_offset.set(
                  point.x - origin.x,
                  point.y - origin.y,
                  point.z - origin.z
                ),
                _direction.set(puff.x, puff.y, puff.z),
                origin.w)
              )
            : sum)(tail[i]!),
      out.set(0, 0, 0)
    );

  const gatherAt = (point: Vector3, out: Vector3) =>
    ((total) =>
      total.weight > 0
        ? out
            .copy(total.sum)
            .multiplyScalar(WAKE.pull / (total.weight + WAKE.soft))
        : out.set(0, 0, 0))(
      head.reduce(
        (total, origin, i) =>
          wake[i]! > 0
            ? ((along) =>
                ((weight) => (
                  total.sum.addScaledVector(_across, -weight),
                  (total.weight += weight),
                  total
                ))(
                  wake[i]! *
                    Math.exp(-(along * along) / (2 * WAKE.window ** 2)) *
                    Math.exp(-_across.lengthSq() / (2 * WAKE.capture ** 2)) *
                    (1 -
                      smoothstep(
                        2 * WAKE.capture,
                        3 * WAKE.capture,
                        _across.length()
                      ))
                ))(
                (_offset.set(
                  point.x - origin.x,
                  point.y - origin.y,
                  point.z - origin.z
                ),
                _direction.set(tail[i]!.x, tail[i]!.y, tail[i]!.z),
                ((along) => (
                  _across.copy(_offset).addScaledVector(_direction, -along),
                  along
                ))(_offset.dot(_direction)))
              )
            : total,
        { sum: new Vector3(), weight: 0 }
      )
    );

  return { puffs, head, tail, wake, state, step, airAt, gustAt, gatherAt };
};

export type Wind = ReturnType<typeof createWind>;

export var wind = createWind();
