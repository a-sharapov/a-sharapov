import {
  DataTexture,
  LinearFilter,
  RepeatWrapping,
  RGBAFormat,
  UnsignedByteType,
} from 'three';
import { float, mix, smoothstep, texture, uniform, vec2 } from 'three/tsl';
import type { Node } from 'three/webgpu';

var _SIZE = 256;

export var GOBO = {
  bars: [
    { axis: 0, at: 0.38, width: 0.022, soft: 0.07 },
    { axis: 1, at: 0.66, width: 0.018, soft: 0.065 },
  ],
  bar: 0.2,
  leaves: { scale: 2.6, from: [0.36, 0.5], soft: 0.1, strength: 0.75 },
  gust: { every: [20, 40], seconds: [3, 5], sway: 0.006 },
};

var _smooth = (lo: number, hi: number, x: number) =>
  ((k) => k * k * (3 - 2 * k))(Math.min(1, Math.max(0, (x - lo) / (hi - lo))));

var _texture = (pixels: Uint8Array, repeat: boolean) =>
  Object.assign(
    new DataTexture(
      Uint8Array.from({ length: pixels.length * 4 }, (_, i) =>
        i % 4 === 3 ? 255 : pixels[i >> 2]!
      ),
      _SIZE,
      _SIZE,
      RGBAFormat,
      UnsignedByteType
    ),
    {
      magFilter: LinearFilter,
      minFilter: LinearFilter,
      generateMipmaps: false,
      needsUpdate: true,
      ...(repeat ? { wrapS: RepeatWrapping, wrapT: RepeatWrapping } : {}),
    }
  );

var _EDGE = 0.12;

var _fade = (u: number, v: number) =>
  _smooth(0, _EDGE, Math.min(u, v, 1 - u, 1 - v));

export var frameAt = (u: number, v: number) =>
  1 -
  _fade(u, v) *
    (1 -
      GOBO.bars.reduce(
        (light, bar) =>
          ((distance) =>
            light *
            (1 -
              (1 - GOBO.bar) *
                (1 - _smooth(bar.width, bar.width + bar.soft, distance))))(
            Math.abs((bar.axis === 0 ? u : v) - bar.at)
          ),
        1
      ));

var _hash = (x: number, y: number) =>
  ((n) => n - Math.floor(n))(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);

var _valueNoise = (x: number, y: number, period: number) =>
  ((ix, iy, fx, fy) =>
    ((corner) =>
      ((sx, sy) =>
        corner(0, 0) * (1 - sx) * (1 - sy) +
        corner(1, 0) * sx * (1 - sy) +
        corner(0, 1) * (1 - sx) * sy +
        corner(1, 1) * sx * sy)(
        fx * fx * (3 - 2 * fx),
        fy * fy * (3 - 2 * fy)
      ))((dx: number, dy: number) =>
      _hash((ix + dx) % period, (iy + dy) % period)
    ))(Math.floor(x), Math.floor(y), x - Math.floor(x), y - Math.floor(y));

export var leavesAt = (u: number, v: number) =>
  ((n) => _smooth(0.42, 0.62, n))(
    [
      [6, 0.55],
      [12, 0.3],
      [24, 0.15],
    ].reduce(
      (sum, { 0: period, 1: weight }) =>
        sum + weight * _valueNoise(u * period, v * period, period),
      0
    )
  );

var _pixels = (at: (u: number, v: number) => number) =>
  Uint8Array.from({ length: _SIZE * _SIZE }, (_, i) =>
    Math.round(
      255 *
        at(((i % _SIZE) + 0.5) / _SIZE, (Math.floor(i / _SIZE) + 0.5) / _SIZE)
    )
  );

export var createGobo = () => {
  const frame = _texture(_pixels(frameAt), false);
  const leaves = _texture(_pixels(leavesAt), true);
  const sway = uniform(vec2(0, 0));
  const strength = uniform(1);
  const node = (uv: Node<'vec2'>): Node<'float'> =>
    mix(float(1), _pattern(uv), strength);
  const _pattern = (uv: Node<'vec2'>): Node<'float'> =>
    texture(frame, uv).r.mul(
      mix(
        float(1),
        texture(leaves, uv.mul(GOBO.leaves.scale).add(sway)).r.oneMinus(),
        smoothstep(
          GOBO.leaves.from[1],
          GOBO.leaves.from[1] + GOBO.leaves.soft,
          uv.y
        )
          .mul(
            smoothstep(
              GOBO.leaves.from[0] - GOBO.leaves.soft,
              GOBO.leaves.from[0],
              uv.x
            ).oneMinus()
          )
          .mul(GOBO.leaves.strength)
      )
    );
  return {
    node,
    sway,
    strength,
    dispose: () => void (frame.dispose(), leaves.dispose()),
  };
};

export var gustEnvelope = (t: number, start: number, seconds: number) =>
  ((x) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 2))(
    (t - start) / seconds
  );

export var swayAt = (t: number, envelope: number): [number, number] => [
  envelope *
    GOBO.gust.sway *
    (Math.sin(t * 1.7) + 0.6 * Math.sin(t * 2.9 + 1.3)),
  envelope *
    GOBO.gust.sway *
    0.6 *
    (Math.sin(t * 1.3 + 0.4) + 0.5 * Math.sin(t * 3.4 + 2.1)),
];

var _shared: ReturnType<typeof createGobo> | null = null;

export var sharedGobo = () => (_shared ??= createGobo());
