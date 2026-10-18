import {
  Data3DTexture,
  LinearFilter,
  RedFormat,
  RepeatWrapping,
  UnsignedByteType,
} from 'three';
import { lerp } from '$lib/common/utils';

export var NOISE_PERIOD = 8;

var _SIZE = 32;

var _hash = (x: number, y: number, z: number) =>
  ((h) => (h ^ (h >>> 16)) >>> 0)(
    ((h) => Math.imul(h ^ (h >>> 13), 1274126177))(
      (Math.imul(x, 374761393) +
        Math.imul(y, 668265263) +
        Math.imul(z, 1440662683)) |
        0
    )
  );

var _GRADIENTS = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
];

var _wrap = (i: number) => ((i % NOISE_PERIOD) + NOISE_PERIOD) % NOISE_PERIOD;

var _corner = (
  ix: number,
  iy: number,
  iz: number,
  x: number,
  y: number,
  z: number
) =>
  ((g) => g[0]! * (x - ix) + g[1]! * (y - iy) + g[2]! * (z - iz))(
    _GRADIENTS[_hash(_wrap(ix), _wrap(iy), _wrap(iz)) % 12]!
  );

var _fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export var periodicNoise = (x: number, y: number, z: number) =>
  ((ix, iy, iz) =>
    ((fx, fy, fz) =>
      lerp(
        lerp(
          lerp(
            _corner(ix, iy, iz, x, y, z),
            _corner(ix + 1, iy, iz, x, y, z),
            fx
          ),
          lerp(
            _corner(ix, iy + 1, iz, x, y, z),
            _corner(ix + 1, iy + 1, iz, x, y, z),
            fx
          ),
          fy
        ),
        lerp(
          lerp(
            _corner(ix, iy, iz + 1, x, y, z),
            _corner(ix + 1, iy, iz + 1, x, y, z),
            fx
          ),
          lerp(
            _corner(ix, iy + 1, iz + 1, x, y, z),
            _corner(ix + 1, iy + 1, iz + 1, x, y, z),
            fx
          ),
          fy
        ),
        fz
      ))(_fade(x - ix), _fade(y - iy), _fade(z - iz)))(
    Math.floor(x),
    Math.floor(y),
    Math.floor(z)
  );

export var createNoiseTexture = () =>
  Object.assign(
    new Data3DTexture(
      Uint8Array.from({ length: _SIZE ** 3 }, (_, i) =>
        ((scale) =>
          Math.round(
            (Math.max(
              -1,
              Math.min(
                1,
                periodicNoise(
                  (i % _SIZE) * scale,
                  (Math.floor(i / _SIZE) % _SIZE) * scale,
                  Math.floor(i / (_SIZE * _SIZE)) * scale
                )
              )
            ) *
              0.5 +
              0.5) *
              255
          ))(NOISE_PERIOD / _SIZE)
      ),
      _SIZE,
      _SIZE,
      _SIZE
    ),
    {
      format: RedFormat,
      type: UnsignedByteType,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      wrapS: RepeatWrapping,
      wrapT: RepeatWrapping,
      wrapR: RepeatWrapping,
      unpackAlignment: 1,
      needsUpdate: true,
    }
  );
