import {
  type BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three';
import type { XYZ } from '$lib/common/types';

var _SCALE: XYZ = [0.0047, 0.0047, 0.0047 * 0.55];
export var SHEET_LIFT = 0.05;
export var PAPER_THICKNESS = 0.006;
var _TUCK = 0.12;
var _EDGE_END = 0.85;
var _UV_LENGTH = 5.75;

export type Face = [width: number, height: number];
export type FoldKind = 'line' | 'center' | 'm' | 'hem' | 'q' | 'f';
type Internal = { s: number; d: number; angle: number };

var _TIMING: Record<
  FoldKind,
  { turn: [number, number]; grow: [number, number] }
> = {
  line: { turn: [0, 0.5], grow: [0, 0.5] },
  center: { turn: [0, 0.5], grow: [0, 0.5] },
  m: { turn: [0, 0.5], grow: [0, 0.5] },
  hem: { turn: [0, 0.32], grow: [0, 0.5] },
  q: { turn: [0.38, 0.78], grow: [0.4, 0.72] },
  f: { turn: [0.62, 0.98], grow: [0.66, 0.94] },
};

type Skin = 'N' | 'K0' | 'K1' | 'K2' | 'K3' | 'W0' | 'W1' | 'W2' | 'S2';
var _SHARED = ['N', 'K0', 'K3'] as const;
var _SIDE = [
  'K1',
  'K2',
  'S2',
  'W0',
  'W1',
  'W2',
  'X',
  'E',
  'O1',
  'O2',
  'O3',
  'G',
  'R1',
  'R2',
  'R3',
  'C1',
] as const;
type Name = (typeof _SHARED)[number] | (typeof _SIDE)[number];
var _COUNT = _SHARED.length + _SIDE.length * 2;

var _index = (name: Name, side: number) =>
  ((shared) =>
    shared >= 0
      ? shared
      : _SHARED.length +
        side * _SIDE.length +
        _SIDE.indexOf(name as (typeof _SIDE)[number]))(
    _SHARED.indexOf(name as (typeof _SHARED)[number])
  );

var _PLACEMENT: [v: Name, a: Name, b: Name, p: Name | '^', kind: FoldKind][] = [
  ['N', 'K0', 'K3', '^', 'line'],
  ['K2', 'K0', 'K3', '^', 'center'],
  ['K1', 'K0', 'K2', 'K3', 'm'],
  ['S2', 'K1', 'K2', 'K0', 'm'],
  ['W0', 'K1', 'S2', 'K2', 'm'],
  ['W2', 'W0', 'S2', 'K1', 'm'],
  ['X', 'W0', 'W2', 'S2', 'hem'],
  ['E', 'X', 'W2', 'W0', 'm'],
  ['W1', 'W0', 'X', 'W2', 'm'],
  ['O1', 'N', 'K1', 'K0', 'q'],
  ['O2', 'K1', 'W0', 'S2', 'q'],
  ['O3', 'W0', 'W1', 'X', 'q'],
  ['G', 'W1', 'E', 'X', 'q'],
  ['R1', 'N', 'O1', 'K1', 'f'],
  ['R2', 'O1', 'O2', 'K1', 'f'],
  ['R3', 'O2', 'O3', 'W0', 'f'],
  ['C1', 'O3', 'G', 'W1', 'f'],
];

var _TRIANGLES: [Name, Name, Name, FoldKind][] = [
  ['K1', 'K0', 'N', 'm'],
  ['K0', 'K1', 'K2', 'm'],
  ['K0', 'K2', 'K3', 'm'],
  ['K1', 'W0', 'S2', 'm'],
  ['K1', 'S2', 'K2', 'm'],
  ['W0', 'W1', 'X', 'm'],
  ['W1', 'E', 'X', 'm'],
  ['E', 'W2', 'X', 'm'],
  ['W2', 'W0', 'X', 'm'],
  ['W0', 'W2', 'S2', 'm'],
  ['N', 'K1', 'O1', 'q'],
  ['K1', 'W0', 'O2', 'q'],
  ['K1', 'O2', 'O1', 'q'],
  ['W0', 'W1', 'O3', 'q'],
  ['W0', 'O3', 'O2', 'q'],
  ['W1', 'E', 'G', 'q'],
  ['W1', 'G', 'O3', 'q'],
  ['N', 'O1', 'R1', 'f'],
  ['O1', 'O2', 'R2', 'f'],
  ['O1', 'R2', 'R1', 'f'],
  ['O2', 'O3', 'R3', 'f'],
  ['O2', 'R3', 'R2', 'f'],
  ['O3', 'G', 'C1', 'f'],
  ['O3', 'C1', 'R3', 'f'],
];

var _clamp = (x: number) => Math.min(1, Math.max(0, x));
var _smooth = (from: number, to: number, x: number) =>
  ((t) => t * t * (3 - 2 * t))(_clamp((x - from) / (to - from)));
var _mix = (a: number, b: number, t: number) => a + (b - a) * t;

var _add = (a: XYZ, b: XYZ): XYZ => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
var _sub = (a: XYZ, b: XYZ): XYZ => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
var _scale = (a: XYZ, k: number): XYZ => [a[0] * k, a[1] * k, a[2] * k];
var _dot = (a: XYZ, b: XYZ) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
var _cross = (a: XYZ, b: XYZ): XYZ => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
var _length = (a: XYZ) => Math.hypot(a[0], a[1], a[2]);
var _normalize = (a: XYZ): XYZ =>
  ((length) => (length > 1e-12 ? _scale(a, 1 / length) : [0, 1, 0]))(
    _length(a)
  );
var _lerp = (a: XYZ, b: XYZ, t: number): XYZ => _add(a, _scale(_sub(b, a), t));

var _frame = (a: XYZ, b: XYZ, p: XYZ) =>
  ((x) =>
    ((w) =>
      ((y) => ({ x, y, n: _cross(x, y) }))(
        _normalize(_sub(w, _scale(x, _dot(w, x))))
      ))(_sub(p, a)))(_normalize(_sub(b, a)));

var _measure = (a: XYZ, b: XYZ, p: XYZ, v: XYZ): Internal =>
  ((frame, q) =>
    ((along) =>
      ((r) => ({
        s: along / _length(_sub(b, a)),
        d: _length(r),
        angle: Math.atan2(_dot(r, frame.n), _dot(r, frame.y)),
      }))(_sub(q, _scale(frame.x, along))))(_dot(q, frame.x)))(
    _frame(a, b, p),
    _sub(v, a)
  );

var _place = (a: XYZ, b: XYZ, p: XYZ, { s, d, angle }: Internal): XYZ =>
  ((frame) =>
    _add(
      _add(a, _scale(frame.x, s * _length(_sub(b, a)))),
      _add(
        _scale(frame.y, d * Math.cos(angle)),
        _scale(frame.n, d * Math.sin(angle))
      )
    ))(_frame(a, b, p));

var _basis = (a: XYZ, b: XYZ, up: XYZ) =>
  ((frame) =>
    new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(
        new Vector3(...frame.x),
        new Vector3(...frame.y),
        new Vector3(...frame.n)
      )
    ))(_frame(a, b, _add(a, up)));

var _numbers = (value: string) =>
  value
    .trim()
    .split(/[\s,]+/)
    .map(Number);
var _attribute = (tag: string, name: string) =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? '';
var _panel = (source: string, id: string) =>
  ((tag) =>
    ((plan, heights) =>
      heights.map(
        (height, i): XYZ => [plan[i * 2]!, plan[i * 2 + 1]!, height]
      ))(
      _numbers(_attribute(tag, 'points')),
      _numbers(_attribute(tag, 'data-height'))
    ))(source.match(new RegExp(`<[^>]*\\sid="${id}"[^>]*>`))?.[0] ?? '');

export type PlaneFold = {
  count: number;
  triangles: [number, number, number][];
  kinds: FoldKind[];
  pose: (unfold: number, face: Face) => XYZ[];
  sheet: (face: Face) => [number, number][];
  roll: number;
};

export var createPlaneFold = (source: string): PlaneFold => {
  const {
    0: wing,
    1: strip,
    2: keel,
    3: nose,
  } = ['wing', 'strip', 'keel', 'nose'].map((id) => _panel(source, id)) as [
    XYZ[],
    XYZ[],
    XYZ[],
    XYZ[],
  ];
  const plan: Record<Skin, XYZ> = {
    N: nose[2]!,
    K0: keel[0]!,
    K1: keel[1]!,
    K2: keel[2]!,
    K3: keel[3]!,
    W0: wing[0]!,
    W1: wing[1]!,
    W2: wing[2]!,
    S2: wing[3]!,
  };

  const _model = ({ 0: x, 1: y, 2: height }: XYZ): XYZ => [
    x * _SCALE[0],
    height * _SCALE[1],
    -y * _SCALE[2],
  ];
  const quads = [wing, strip, keel, nose].map((quad) => quad.map(_model));
  const all = quads.flatMap((quad) => [
    ...quad,
    ...quad.map(({ 0: x, 1: y, 2: z }): XYZ => [-x, y, z]),
  ]);
  const tip = quads[0]!.reduce((best, vertex) =>
    vertex[0] > best[0] ? vertex : best
  );
  const roll = Math.atan2(
    tip[1] - Math.min(...all.map(({ 1: y }) => y)),
    tip[0]
  );
  const _rolled = ({ 0: x, 1: y, 2: z }: XYZ): XYZ => [
    x * Math.cos(roll) - y * Math.sin(roll),
    x * Math.sin(roll) + y * Math.cos(roll),
    z,
  ];
  const floor = Math.min(...all.map((vertex) => _rolled(vertex)[1]));
  const _skin = (vertex: XYZ, side: number): XYZ =>
    ((rolled): XYZ => [rolled[0], rolled[1] - floor, rolled[2]])(
      _rolled(
        ((model): XYZ => [side ? -model[0] : model[0], model[1], model[2]])(
          _model(vertex)
        )
      )
    );
  const up: XYZ = [-Math.sin(roll), Math.cos(roll), 0];

  const _folded = (name: Name, side: number): XYZ =>
    name === 'X'
      ? _scale(
          _add(
            _add(_skin(plan.W0, side), _skin(plan.W1, side)),
            _skin(plan.W2, side)
          ),
          1 / 3
        )
      : name === 'E'
        ? _lerp(_skin(plan.W1, side), _skin(plan.W2, side), _EDGE_END)
        : name in plan
          ? _skin(plan[name as Skin], side)
          : [0, 0, 0];

  const _along = (name: Skin) =>
    (plan[name][1] - plan.N[1]) / (plan.K3[1] - plan.N[1]);
  const keelTail = Math.hypot(plan.K2[0] - plan.K3[0], plan.K2[2] - plan.K3[2]);
  const wingTail = Math.hypot(plan.W2[0] - plan.K2[0], plan.W2[2] - plan.K2[2]);
  const keelShare = keelTail / (keelTail + wingTail);
  const toothShare =
    keelShare +
    (1 - keelShare) * ((plan.S2[0] - plan.K2[0]) / (plan.W2[0] - plan.K2[0]));

  const _sheet = ({
    0: width,
    1: height,
  }: Face): Record<Name, [number, number]> =>
    ((L, H) =>
      ((slope) =>
        ((cos, tan, double) =>
          ((reach) =>
            ((edge, station) => ({
              N: [0, 0],
              K0: [_along('K0') * L, 0],
              K3: [L, 0],
              K2: [L, keelShare * H],
              S2: [L, toothShare * H],
              W2: [L, H],
              K1: edge('K1'),
              W0: edge('W0'),
              W1: edge('W1'),
              E: [H / tan, H],
              X: [
                (edge('W0')[0] + H / tan + L) / 3,
                (edge('W0')[1] + 2 * H) / 3,
              ],
              G: [H / Math.tan(double), H],
              C1: [0, H],
              O1: [
                station('K1') * Math.cos(double),
                station('K1') * Math.sin(double),
              ],
              O2: [
                station('W0') * Math.cos(double),
                station('W0') * Math.sin(double),
              ],
              O3: [
                station('W1') * Math.cos(double),
                station('W1') * Math.sin(double),
              ],
              R1: [0, station('K1') / Math.sin(double)],
              R2: [0, station('W0') / Math.sin(double)],
              R3: [0, station('W1') / Math.sin(double)],
            }))(
              (name: Skin): [number, number] =>
                ((alpha) => [alpha, alpha * tan])(_along(name) * reach),
              (name: Skin) => (_along(name) * reach) / (cos * cos)
            ))(
            Math.min(
              L,
              (0.75 * H * cos * cos * Math.sin(double)) / _along('W1')
            )
          ))(Math.cos(slope), Math.tan(slope), 2 * slope))(
        Math.max(Math.PI / 8, Math.atan(H / (0.92 * L)))
      ))(Math.max(width, height), Math.min(width, height) / 2);

  const _flat = (face: Face, { 0: alpha, 1: beta }: [number, number]): XYZ =>
    ((L): XYZ =>
      face[0] >= face[1]
        ? [L / 2 - alpha, SHEET_LIFT, -beta]
        : [beta, SHEET_LIFT, L / 2 - alpha])(Math.max(face[0], face[1]));

  const names = Array.from({ length: _COUNT }, (_, i): [Name, number] =>
    i < _SHARED.length
      ? [_SHARED[i]!, 0]
      : [
          _SIDE[(i - _SHARED.length) % _SIDE.length]!,
          Math.floor((i - _SHARED.length) / _SIDE.length),
        ]
  );
  const _sheetAt = (face: Face) =>
    ((sheet) =>
      names.map(({ 0: name, 1: side }): [number, number] => [
        sheet[name][0],
        side ? -sheet[name][1] : sheet[name][1],
      ]))(_sheet(face));

  const entries = [0, 1].flatMap((side) =>
    _PLACEMENT
      .filter(({ 0: v }) => !(side && _index(v, 0) < _SHARED.length))
      .map(({ 0: v, 1: a, 2: b, 3: p, 4: kind }) => ({
        v: _index(v, side),
        a: _index(a, side),
        b: _index(b, side),
        p: p === '^' ? -1 : _index(p, side),
        kind,
      }))
  );
  const root = { a: _index('K0', 0), b: _index('K3', 0) };
  const _tucked = (kind: FoldKind) => kind === 'q' || kind === 'f';

  const folded = names.map(({ 0: name, 1: side }) => _folded(name, side));
  const foldedInternal = entries.map(({ v, a, b, p, kind }) =>
    _tucked(kind)
      ? null
      : _measure(
          folded[a]!,
          folded[b]!,
          p < 0 ? _add(folded[root.a]!, up) : folded[p]!,
          folded[v]!
        )
  );
  const foldedFrame = {
    middle: _lerp(folded[root.a]!, folded[root.b]!, 0.5),
    length: _length(_sub(folded[root.b]!, folded[root.a]!)),
    turn: _basis(folded[root.a]!, folded[root.b]!, up),
  };

  const _unfolded = (face: Face) =>
    ((points) =>
      ((virtual) => ({
        frame: {
          middle: _lerp(points[root.a]!, points[root.b]!, 0.5),
          length: _length(_sub(points[root.b]!, points[root.a]!)),
          turn: _basis(points[root.a]!, points[root.b]!, [0, 1, 0]),
        },
        pairs: entries.map(({ v, a, b, p, kind }, i) =>
          ((flat, reference) =>
            _tucked(kind)
              ? ((sign) => ({
                  from: { s: flat.s, d: 0, angle: sign * _TUCK },
                  to: { ...flat, angle: sign * Math.PI },
                }))(
                  Math.sign(_frame(points[a]!, points[b]!, reference).n[1]) || 1
                )
              : ((from) => ({
                  from,
                  to:
                    kind === 'm' || kind === 'hem'
                      ? {
                          ...flat,
                          angle: (Math.sign(from.angle) || 1) * Math.PI,
                        }
                      : flat,
                }))(foldedInternal[i]!))(
            _measure(
              points[a]!,
              points[b]!,
              p < 0 ? virtual : points[p]!,
              points[v]!
            ),
            p < 0 ? virtual : points[p]!
          )
        ),
      }))(_add(points[root.a]!, [0, 1, 0])))(
      _sheetAt(face).map((point) => _flat(face, point))
    );

  let cached: { key: string; value: ReturnType<typeof _unfolded> } | null =
    null;
  const _layout = (face: Face) =>
    ((key) =>
      cached?.key === key
        ? cached.value
        : ((value) => ((cached = { key, value }), value))(_unfolded(face)))(
      `${face[0]}×${face[1]}`
    );

  const pose = (unfold: number, face: Face): XYZ[] =>
    ((layout, u) =>
      ((flatten) =>
        ((turn, middle, length) =>
          ((axis, lift) =>
            ((a, b) =>
              entries.reduce(
                (points, { v, a: from, b: to, p, kind }, i) =>
                  ((pair, grow, bend) => (
                    (points[v] = _place(
                      points[from]!,
                      points[to]!,
                      p < 0 ? _add(a, lift) : points[p]!,
                      {
                        s: _mix(pair.from.s, pair.to.s, grow),
                        d: _mix(pair.from.d, pair.to.d, grow),
                        angle: _mix(pair.from.angle, pair.to.angle, bend),
                      }
                    )),
                    points
                  ))(
                    layout.pairs[i]!,
                    _smooth(..._TIMING[kind].grow, u),
                    _smooth(..._TIMING[kind].turn, u)
                  ),
                Object.assign(
                  Array.from({ length: _COUNT }, (): XYZ => [0, 0, 0]),
                  { [root.a]: a, [root.b]: b }
                )
              ))(
              _add(middle, _scale(axis, -length / 2)),
              _add(middle, _scale(axis, length / 2))
            ))(
            new Vector3(1, 0, 0).applyQuaternion(turn).toArray() as XYZ,
            new Vector3(0, 1, 0).applyQuaternion(turn).toArray() as XYZ
          ))(
          foldedFrame.turn.clone().slerp(layout.frame.turn, flatten),
          _lerp(foldedFrame.middle, layout.frame.middle, flatten),
          _mix(foldedFrame.length, layout.frame.length, flatten)
        ))(_smooth(..._TIMING.center.turn, u)))(_layout(face), _clamp(unfold));

  const reference = ((face: Face) =>
    _sheetAt(face).map((point) => _flat(face, point)))([21, 15]);
  const triangles = [0, 1].flatMap((side) =>
    _TRIANGLES.map(({ 0: a, 1: b, 2: c }) =>
      (({ 0: i, 1: j, 2: k }): [number, number, number] =>
        _cross(
          _sub(reference[j]!, reference[i]!),
          _sub(reference[k]!, reference[i]!)
        )[1] > 0
          ? [i, j, k]
          : [i, k, j])([_index(a, side), _index(b, side), _index(c, side)])
    )
  );

  return {
    count: _COUNT,
    triangles,
    kinds: [0, 1].flatMap(() => _TRIANGLES.map(({ 3: kind }) => kind)),
    pose,
    sheet: _sheetAt,
    roll,
  };
};

var _dynamic = (count: number, size: number) =>
  new Float32BufferAttribute(new Float32Array(count * size), size).setUsage(
    DynamicDrawUsage
  );

var _writePaper = (
  geometry: BufferGeometry,
  fold: PlaneFold,
  unfold: number,
  face: Face
) =>
  ((points, sheet, unit, position, normal, uv) => (
    fold.triangles.forEach(
      (triangle, t) =>
        void ((n: XYZ) =>
          [1, -1].forEach(
            (sign, copy) =>
              void (
                sign > 0 ? triangle : [triangle[0], triangle[2], triangle[1]]
              ).forEach(
                (vertex, k) =>
                  void ((slot: number, point: XYZ) =>
                    void (position.setXYZ(slot, ...point),
                    normal.setXYZ(slot, n[0] * sign, n[1] * sign, n[2] * sign),
                    uv.setXY(
                      slot,
                      sheet[vertex]![0] * unit,
                      sheet[vertex]![1] * unit
                    )))(
                    (t * 2 + copy) * 3 + k,
                    _add(
                      points[vertex]!,
                      _scale(n, (sign * PAPER_THICKNESS) / 2)
                    )
                  )
              )
          ))(
          _normalize(
            _cross(
              _sub(points[triangle[1]]!, points[triangle[0]]!),
              _sub(points[triangle[2]]!, points[triangle[0]]!)
            )
          )
        )
    ),
    [position, normal, uv].forEach(
      (attribute) => void (attribute.needsUpdate = true)
    ),
    geometry.computeBoundingSphere(),
    geometry
  ))(
    fold.pose(unfold, face),
    fold.sheet(face),
    _UV_LENGTH / Math.max(face[0], face[1]),
    geometry.getAttribute('position') as BufferAttribute,
    geometry.getAttribute('normal') as BufferAttribute,
    geometry.getAttribute('uv') as BufferAttribute
  );

export var createPaperGeometry = (
  fold: PlaneFold,
  unfold = 0,
  face: Face = [21, 15]
) =>
  ((geometry) => ({
    geometry: _writePaper(geometry, fold, unfold, face),
    update: (next: number, size: Face) =>
      void _writePaper(geometry, fold, next, size),
  }))(
    ((count) =>
      new BufferGeometry()
        .setAttribute('position', _dynamic(count, 3))
        .setAttribute('normal', _dynamic(count, 3))
        .setAttribute('uv', _dynamic(count, 2)))(fold.triangles.length * 6)
  );
