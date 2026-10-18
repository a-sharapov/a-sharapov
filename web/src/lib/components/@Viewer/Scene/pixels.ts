export var hash = (x: number, y: number, seed: number): number =>
  ((value) => value - Math.floor(value))(
    Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
  );

var _smooth = (t: number): number => t * t * (3 - 2 * t);

export var valueNoise = (
  x: number,
  y: number,
  period: number,
  seed: number
) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = _smooth(x - ix);
  const fy = _smooth(y - iy);
  const at = (dx: number, dy: number) =>
    hash((ix + dx) % period, (iy + dy) % period, seed);
  const top = at(0, 0) + (at(1, 0) - at(0, 0)) * fx;
  const bottom = at(0, 1) + (at(1, 1) - at(0, 1)) * fx;
  return top + (bottom - top) * fy;
};

var _indices = (count: number) => Array.from({ length: count }, (_, i) => i);

type Knots = { cell: Int32Array; next: Int32Array; t: Float64Array };

var _knots = (count: number, period: number, at: (i: number) => number) =>
  ((knots: Knots) => (
    _indices(count).forEach(
      (i) =>
        void ((x, cell) => {
          knots.cell[i] = cell % period;
          knots.next[i] = (cell + 1) % period;
          knots.t[i] = _smooth(x - cell);
        })(at(i), Math.floor(at(i)))
    ),
    knots
  ))({
    cell: new Int32Array(count),
    next: new Int32Array(count),
    t: new Float64Array(count),
  });

var _hashRow = (
  hashes: Float64Array,
  columns: number[],
  y: number,
  seed: number
) => {
  for (let i = 0; i < columns.length; i += 1)
    hashes[columns[i]!] = hash(columns[i]!, y, seed);
};

var _across = (row: Float64Array, hashes: Float64Array, knots: Knots) => {
  for (let i = 0; i < row.length; i += 1) {
    const a = hashes[knots.cell[i]!]!;
    const t = knots.t[i]!;
    row[i] = t === 0 ? a : a + (hashes[knots.next[i]!]! - a) * t;
  }
};

var _down = (
  out: Float64Array,
  offset: number,
  top: Float64Array,
  bottom: Float64Array,
  t: number
) => {
  for (let i = 0; i < top.length; i += 1)
    out[offset + i] = t === 0 ? top[i]! : top[i]! + (bottom[i]! - top[i]!) * t;
};

var _lattice = (knots: Knots, period: number, seed: number) =>
  (
    (columns, rows) => (y: number) =>
      (rows[y] ??= ((hashes, row) => (
        _hashRow(hashes, columns, y, seed), _across(row, hashes, knots), row
      ))(new Float64Array(period), new Float64Array(knots.t.length)))
  )(
    ((used) => (
      _indices(knots.t.length).forEach(
        (i) =>
          void ((used[knots.cell[i]!] = 1),
          knots.t[i] === 0 || (used[knots.next[i]!] = 1))
      ),
      _indices(period).filter((x) => used[x] === 1)
    ))(new Uint8Array(period)),
    new Array<Float64Array | undefined>(period)
  );

var _field = (knots: Knots, period: number, seed: number) =>
  ((lattice, size, out) => (
    _indices(size).forEach(
      (row) =>
        void _down(
          out,
          row * size,
          lattice(knots.cell[row]!),
          lattice(knots.t[row] === 0 ? knots.cell[row]! : knots.next[row]!),
          knots.t[row]!
        )
    ),
    out
  ))(
    _lattice(knots, period, seed),
    knots.t.length,
    new Float64Array(knots.t.length ** 2)
  );

var _OCTAVES = [1, 2, 4, 8];

var _octave = (size: number, period: number, scale: number, seed: number) =>
  _field(
    _knots(size, period * scale, (i) => (i / size) * period * scale),
    period * scale,
    seed
  );

var _addOctave = (fbm: Float64Array, samples: Float64Array, octave: number) => {
  for (let i = 0; i < fbm.length; i += 1)
    fbm[i] += samples[i]! / octave / 1.875;
};

var _noiseBytes = (
  data: Uint8Array,
  fbm: Float64Array,
  detail: Float64Array,
  size: number,
  seed: number
) => {
  for (let i = 0; i < fbm.length; i += 1) {
    data[i * 4] = fbm[i]! * 255;
    data[i * 4 + 1] = detail[i]! * 255;
    data[i * 4 + 2] = hash(i % size, Math.floor(i / size), seed) * 255;
    data[i * 4 + 3] = 255;
  }
};

export var grainPixels = (size: number, period: number, seed: number) =>
  ((fbm, data) => (
    _OCTAVES.forEach(
      (octave) =>
        void _addOctave(
          fbm,
          _octave(size, period, octave, seed + octave),
          octave
        )
    ),
    _noiseBytes(data, fbm, _octave(size, period, 4, seed + 9), size, seed),
    data
  ))(new Float64Array(size * size), new Uint8Array(size * size * 4));

export var COATING_TILE = 384;

var _COATING_CELLS = [
  [6, 60],
  [3, 45],
  [1.5, 30],
] as const;

var _addCells = (
  relief: Float64Array,
  samples: Float64Array,
  weight: number
) => {
  for (let i = 0; i < relief.length; i += 1)
    relief[i] += (samples[i]! - 0.5) * weight;
};

var _coatingBytes = (
  data: Uint8ClampedArray,
  relief: Float64Array,
  size: number
) => {
  for (let i = 0; i < relief.length; i += 1) {
    const shade =
      128 + relief[i]! + (hash(i % size, Math.floor(i / size), 24) - 0.5) * 20;
    data[i * 4] = shade;
    data[i * 4 + 1] = shade;
    data[i * 4 + 2] = shade;
    data[i * 4 + 3] = 255;
  }
};

export var coatingPixels = () =>
  ((size, relief, data) => (
    _COATING_CELLS.forEach(
      ({ 0: cell, 1: weight }, octave) =>
        void _addCells(
          relief,
          _field(
            _knots(size, size / cell, (i) => i / cell),
            size / cell,
            21 + octave
          ),
          weight
        )
    ),
    _coatingBytes(data, relief, size),
    new Uint8Array(data.buffer)
  ))(
    COATING_TILE,
    new Float64Array(COATING_TILE ** 2),
    new Uint8ClampedArray(COATING_TILE ** 2 * 4)
  );
