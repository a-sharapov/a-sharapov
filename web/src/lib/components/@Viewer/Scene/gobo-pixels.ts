export var GOBO_SIZE = 256;

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

var _gray = (at: (u: number, v: number) => number) =>
  Uint8Array.from({ length: GOBO_SIZE * GOBO_SIZE }, (_, i) =>
    Math.round(
      255 *
        at(
          ((i % GOBO_SIZE) + 0.5) / GOBO_SIZE,
          (Math.floor(i / GOBO_SIZE) + 0.5) / GOBO_SIZE
        )
    )
  );

var _PATTERNS = { frame: frameAt, leaves: leavesAt };

export var goboPixels = (pattern: keyof typeof _PATTERNS) =>
  ((gray) =>
    Uint8Array.from({ length: gray.length * 4 }, (_, i) =>
      i % 4 === 3 ? 255 : gray[i >> 2]!
    ))(_gray(_PATTERNS[pattern]));
