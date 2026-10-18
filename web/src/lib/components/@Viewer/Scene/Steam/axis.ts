import { Vector4 } from 'three';
import { clamp, lerp } from '#lib/common/utils.ts';

export var STEAM_VOLUME = { radius: 6, height: 15 };

export var AXIS_LEVELS = 48;

export var STEAM_SPAN = 10;

export var STRANDS = [
  { weight: 1, rate: 13, speed: 1.1, thickness: 1 },
  { weight: 0.45, rate: 14.5, speed: 1.3, thickness: 1.6 },
];

var _smoothstep = (from: number, to: number, x: number) =>
  ((t) => t * t * (3 - 2 * t))(clamp((x - from) / (to - from)));

var _hash = (x: number, y: number) =>
  ((h) => ((h ^ (h >>> 16)) >>> 0) / 4294967296)(
    ((h) => Math.imul(h ^ (h >>> 13), 1274126177))(
      (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0
    )
  );

var _corner = (ix: number, iy: number, x: number, y: number) =>
  ((angle) => Math.cos(angle) * (x - ix) + Math.sin(angle) * (y - iy))(
    _hash(ix, iy) * Math.PI * 2
  );

var _fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export var noise2 = (x: number, y: number) =>
  ((ix, iy) =>
    ((fx, fy) =>
      lerp(
        lerp(_corner(ix, iy, x, y), _corner(ix + 1, iy, x, y), fx),
        lerp(_corner(ix, iy + 1, x, y), _corner(ix + 1, iy + 1, x, y), fx),
        fy
      ) * 1.41)(_fade(x - ix), _fade(y - iy)))(Math.floor(x), Math.floor(y));

export var strandCenter = (
  h: number,
  k: number,
  time: number,
  seed: number
) => {
  const { rate, speed } = STRANDS[k]!;
  const chaos = (x: number, pace: number) =>
    noise2(h * 1.6 - time * 0.35 + k * 3.1 + x, time * pace + seed);
  const swell = chaos(7.7, 0.07);
  const phase =
    h * rate - time * speed + seed * 1.7 + k * 0.9 + chaos(0, 0.11) * 2.4;
  const turn = phase * 0.83 + swell * 1.4 + 0.7 + k;
  const amplitude =
    _smoothstep(0, 0.18, h) * (0.12 * h + 0.16) * (1 + 0.35 * swell);
  const drift = time * 0.09 + seed * 0.3;
  return [
    (amplitude * (Math.sin(phase) + 0.28 * Math.sin(2 * phase + 1.3)) +
      0.07 * h * noise2(drift, k * 5.3)) *
      STEAM_SPAN,
    (amplitude * 0.8 * Math.cos(turn) +
      0.07 * h * noise2(drift + 4.7, k * 5.3 + 2.9)) *
      STEAM_SPAN,
  ];
};

export var createAxis = () =>
  Array.from({ length: AXIS_LEVELS * 2 }, () => new Vector4());

export var DRIFT_CALM = 0.45;

var _drifted = (
  center: number[],
  level: number,
  drift: Float32Array | undefined
) =>
  drift
    ? ((x, z, calm) =>
        center.map((value, k) => value * calm + (k % 2 === 0 ? x : z)))(
        drift[level * 3]!,
        drift[level * 3 + 1]!,
        1 - DRIFT_CALM * drift[level * 3 + 2]!
      )
    : center;

export var updateAxis = (
  axis: Vector4[],
  time: number,
  seed: number,
  drift?: Float32Array
) =>
  ((centers: number[][]) =>
    centers.forEach((center, i) => {
      const below = centers[Math.max(i - 1, 0)]!;
      const above = centers[Math.min(i + 1, AXIS_LEVELS - 1)]!;
      const rise =
        ((Math.min(i + 1, AXIS_LEVELS - 1) - Math.max(i - 1, 0)) *
          STEAM_VOLUME.height) /
        (AXIS_LEVELS - 1);
      axis[i]!.set(center[0]!, center[1]!, center[2]!, center[3]!);
      axis[AXIS_LEVELS + i]!.set(
        (above[0]! - below[0]!) / rise,
        (above[1]! - below[1]!) / rise,
        (above[2]! - below[2]!) / rise,
        (above[3]! - below[3]!) / rise
      );
    }))(
    Array.from({ length: AXIS_LEVELS }, (_, i) =>
      _drifted(
        STRANDS.flatMap((_, k) =>
          strandCenter(i / (AXIS_LEVELS - 1), k, time, seed)
        ),
        i,
        drift
      )
    )
  );
