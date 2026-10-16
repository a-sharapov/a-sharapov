import { AXIS_LEVELS, STEAM_VOLUME } from './axis';

export var DRIFT = {
  rise: 6.5,
  coupling: 0.3,
  frequency: 0.4,
  reach: 2.2,
  born: 0.12,
};

export type SteamDrift = {
  world: Float32Array;
  speed: Float32Array;
  local: Float32Array;
  next: Float32Array;
};

export var createSteamDrift = (): SteamDrift => ({
  world: new Float32Array(AXIS_LEVELS * 2),
  speed: new Float32Array(AXIS_LEVELS * 2),
  local: new Float32Array(AXIS_LEVELS * 3),
  next: new Float32Array(AXIS_LEVELS * 4),
});

var _LEVEL = STEAM_VOLUME.height / (AXIS_LEVELS - 1);

var _OMEGA = 2 * Math.PI * DRIFT.frequency;

var _sample = (values: Float32Array, at: number, k: number) =>
  at <= 0
    ? 0
    : ((below, f) =>
        (1 - f) * values[below * 2 + k]! +
        f * values[Math.min(below + 1, AXIS_LEVELS - 1) * 2 + k]!)(
        Math.floor(at),
        at - Math.floor(at)
      );

export var levelHeight = (level: number) => level / (AXIS_LEVELS - 1);

var _born = (h: number) =>
  ((t) => t * t * (3 - 2 * t))(Math.min(1, h / DRIFT.born));

var _parcel = (
  drift: SteamDrift,
  slot: number,
  from: number,
  k: number,
  air: number,
  delta: number
) =>
  ((offset, speed) =>
    ((next) => (
      (drift.next[slot] = offset + next * delta), (drift.next[slot + 1] = next)
    ))(
      speed +
        ((air - speed) / DRIFT.coupling - _OMEGA * _OMEGA * offset) * delta
    ))(_sample(drift.world, from, k), _sample(drift.speed, from, k));

export var stepDrift = (
  drift: SteamDrift,
  delta: number,
  relative: (h: number) => [x: number, z: number]
) =>
  ((shift) => (
    drift.next.fill(0, 0, 4),
    Array.from({ length: AXIS_LEVELS - 1 }).forEach(
      (_, i) =>
        void ((level, h) =>
          ((air, born) =>
            [0, 1].forEach(
              (k) =>
                void _parcel(
                  drift,
                  level * 4 + k * 2,
                  level - shift,
                  k,
                  air[k]! * born,
                  delta
                )
            ))(relative(h), _born(h)))(i + 1, levelHeight(i + 1))
    ),
    Array.from({ length: AXIS_LEVELS * 2 }).forEach(
      (_, i) =>
        void ((drift.world[i] = drift.next[i * 2]!),
        (drift.speed[i] = drift.next[i * 2 + 1]!))
    )
  ))((DRIFT.rise * delta) / _LEVEL);

export var driftReach = (h: number) => DRIFT.reach * (0.35 + 0.65 * h);

export var settleDrift = (drift: SteamDrift, cos: number, sin: number) =>
  Array.from({ length: AXIS_LEVELS }).forEach(
    (_, level) =>
      void ((x, z, reach) =>
        ((length) =>
          ((scale) => (
            (drift.local[level * 3] = (x * cos - z * sin) * scale),
            (drift.local[level * 3 + 1] = (x * sin + z * cos) * scale),
            (drift.local[level * 3 + 2] =
              length > 1e-6 ? (length * scale) / reach : 0)
          ))(length > 1e-6 ? (reach * Math.tanh(length / reach)) / length : 0))(
          Math.hypot(x, z)
        ))(
        drift.world[level * 2]!,
        drift.world[level * 2 + 1]!,
        driftReach(levelHeight(level))
      )
  );

export var driftResting = (drift: SteamDrift) =>
  drift.world.every((value) => Math.abs(value) < 1e-4) &&
  drift.speed.every((value) => Math.abs(value) < 1e-3);

export var clearDrift = (drift: SteamDrift) => (
  drift.world.fill(0), drift.speed.fill(0), drift.local.fill(0)
);
