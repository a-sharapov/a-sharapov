import { describe, expect, test } from 'bun:test';
import type { XYZ } from '#lib/common/types.ts';
import {
  createPaperGeometry,
  createPlaneFold,
  type Face,
  PAPER_THICKNESS,
  SHEET_LIFT,
} from '#lib/components/@Viewer/Scene/models/plane-fold.ts';

var source = await Bun.file(
  new URL(
    '../../lib/components/@Viewer/Scene/models/svg/paper-plane.svg',
    import.meta.url
  )
).text();
var fold = createPlaneFold(source);
var _FACES: Face[] = [
  [21, 15.2],
  [12, 18],
  [30, 12],
];

var _sub = (a: XYZ, b: XYZ): XYZ => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
var _dot = (a: XYZ, b: XYZ) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
var _cross = (a: XYZ, b: XYZ): XYZ => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
var _length = (a: XYZ) => Math.hypot(...a);
var _normal = (a: XYZ, b: XYZ, c: XYZ) => _cross(_sub(b, a), _sub(c, a));
var _area = (a: XYZ, b: XYZ, c: XYZ) => _length(_normal(a, b, c)) / 2;
var _corners = (points: XYZ[], triangle: number[]) =>
  triangle.map((i) => points[i]!) as [XYZ, XYZ, XYZ];

var _original = () => {
  const scale: XYZ = [0.0047, 0.0047, 0.0047 * 0.55];
  const quads = ['wing', 'strip', 'keel', 'nose'].map((id) =>
    ((tag) =>
      ((plan, heights) =>
        heights.map(
          (height, i): XYZ => [
            plan[i * 2]! * scale[0],
            height * scale[1],
            -plan[i * 2 + 1]! * scale[2],
          ]
        ))(
        tag
          .match(/\spoints="([^"]*)"/)![1]!
          .trim()
          .split(/[\s,]+/)
          .map(Number),
        tag
          .match(/\sdata-height="([^"]*)"/)![1]!
          .trim()
          .split(/[\s,]+/)
          .map(Number)
      ))(source.match(new RegExp(`<[^>]*\\sid="${id}"[^>]*>`))![0])
  );
  const mirrored = quads.map((quad) =>
    quad.map(({ 0: x, 1: y, 2: z }): XYZ => [-x, y, z])
  );
  const triangles = [...quads, ...mirrored].flatMap((quad, q) =>
    q % 4 === 3
      ? [[quad[0]!, quad[1]!, quad[2]!]]
      : [
          [quad[0]!, quad[1]!, quad[2]!],
          [quad[0]!, quad[2]!, quad[3]!],
        ]
  );
  const all = [...quads, ...mirrored].flat();
  const tip = quads[0]!.reduce((best, vertex) =>
    vertex[0] > best[0] ? vertex : best
  );
  const roll = Math.atan2(
    tip[1] - Math.min(...all.map(({ 1: y }) => y)),
    tip[0]
  );
  const rolled = ({ 0: x, 1: y, 2: z }: XYZ): XYZ => [
    x * Math.cos(roll) - y * Math.sin(roll),
    x * Math.sin(roll) + y * Math.cos(roll),
    z,
  ];
  const floor = Math.min(...all.map((vertex) => rolled(vertex)[1]));
  return triangles.map((triangle) =>
    triangle.map((vertex) =>
      ((r): XYZ => [r[0], r[1] - floor, r[2]])(rolled(vertex))
    )
  ) as [XYZ, XYZ, XYZ][];
};

var _onTriangle = (
  point: XYZ,
  { 0: a, 1: b, 2: c }: [XYZ, XYZ, XYZ],
  tolerance = 1e-7
) =>
  ((n) =>
    Math.abs(_dot(_sub(point, a), n) / _length(n)) < tolerance &&
    [
      [a, b],
      [b, c],
      [c, a],
    ].every(
      ({ 0: from, 1: to }) =>
        _dot(_cross(_sub(to!, from!), _sub(point, from!)), n) / _length(n) >
        -tolerance
    ))(_normal(a, b, c));

var _pierces = (
  p: XYZ,
  q: XYZ,
  { 0: a, 1: b, 2: c }: [XYZ, XYZ, XYZ],
  eps = 1e-4
) =>
  ((n) =>
    ((dp, dq) =>
      dp * dq < 0 &&
      Math.abs(dp) > eps &&
      Math.abs(dq) > eps &&
      ((t) =>
        ((x: XYZ) =>
          [
            [a, b],
            [b, c],
            [c, a],
          ].every(
            ({ 0: from, 1: to }) =>
              _dot(_cross(_sub(to!, from!), _sub(x, from!)), n) /
                _length(n) /
                _length(_sub(to!, from!)) >
              eps
          ))([
          p[0] + (q[0] - p[0]) * t,
          p[1] + (q[1] - p[1]) * t,
          p[2] + (q[2] - p[2]) * t,
        ]))(dp / (dp - dq)))(
      _dot(_sub(p, a), n) / _length(n),
      _dot(_sub(q, a), n) / _length(n)
    ))(_normal(a, b, c));

describe('paper plane fold', () => {
  test('сложенный — прежний самолётик: грани обшивки покрывают прежние грани без зазоров', () => {
    const points = fold.pose(0, [21, 15.2]);
    const original = _original();
    const skin = fold.triangles.filter((_, i) => fold.kinds[i] === 'm');
    const covered = original.map((triangle) =>
      skin
        .map((indices) => _corners(points, indices))
        .filter((part) => part.every((vertex) => _onTriangle(vertex, triangle)))
        .reduce((sum, part) => sum + _area(...part), 0)
    );
    covered.forEach(
      (area, i) => void expect(area).toBeCloseTo(_area(...original[i]!), 9)
    );
    expect(
      skin.reduce(
        (sum, indices) => sum + _area(..._corners(points, indices)),
        0
      )
    ).toBeCloseTo(
      original.reduce((sum, triangle) => sum + _area(...triangle), 0),
      9
    );
  });

  test('клапаны в самолётике сжаты в ноль на кромке крыла — их не видно', () => {
    const points = fold.pose(0, [21, 15.2]);
    fold.triangles
      .filter((_, i) => fold.kinds[i] !== 'm')
      .forEach(
        (indices) =>
          void expect(_area(..._corners(points, indices))).toBeLessThan(1e-12)
      );
  });

  test('развёрнутый — ровный лист w × h на высоте SHEET_LIFT, лицом вверх, без нахлёстов', () => {
    _FACES.forEach((face) => {
      const points = fold.pose(1, face);
      const { 0: width, 1: height } = face;
      points.forEach(({ 0: x, 1: y, 2: z }) => {
        expect(y).toBeCloseTo(SHEET_LIFT, 9);
        expect(Math.abs(x)).toBeLessThanOrEqual(width / 2 + 1e-9);
        expect(Math.abs(z)).toBeLessThanOrEqual(height / 2 + 1e-9);
      });
      const normals = fold.triangles.map((indices) =>
        _normal(..._corners(points, indices))
      );
      normals.forEach((n) => void expect(n[1]).toBeGreaterThan(0));
      expect(normals.reduce((sum, n) => sum + n[1] / 2, 0)).toBeCloseTo(
        width * height,
        6
      );
      [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].forEach(
        ({ 0: sx, 1: sz }) =>
          void expect(
            points.some(
              ({ 0: x, 2: z }) =>
                Math.abs(x - (sx! * width) / 2) < 1e-9 &&
                Math.abs(z - (sz! * height) / 2) < 1e-9
            )
          ).toBe(true)
      );
    });
  });

  var _crossings = (points: XYZ[], label: string) =>
    fold.triangles.flatMap((first, i) =>
      fold.triangles.slice(i + 1).flatMap((second, offset) =>
        ((common) =>
          common.length > 1 ||
          _area(..._corners(points, first)) < 1e-9 ||
          _area(..._corners(points, second)) < 1e-9
            ? []
            : ((edges) =>
                edges(first, second).some(({ 0: p, 1: q }) =>
                  _pierces(points[p]!, points[q]!, _corners(points, second))
                ) ||
                edges(second, first).some(({ 0: p, 1: q }) =>
                  _pierces(points[p]!, points[q]!, _corners(points, first))
                )
                  ? [`${label} ${i}×${i + 1 + offset}`]
                  : [])((own: number[], other: number[]) =>
                [
                  [own[0]!, own[1]!],
                  [own[1]!, own[2]!],
                  [own[2]!, own[0]!],
                ].filter(
                  (edge) => !edge.some((vertex) => other.includes(vertex))
                )
              ))(first.filter((vertex) => second.includes(vertex)))
      )
    );

  test('раскрытие плавное и бумага не проходит сама сквозь себя', () => {
    _FACES.forEach((face) => {
      const steps = Array.from({ length: 201 }, (_, i) => i / 200);
      const poses = steps.map((u) => fold.pose(u, face));
      expect(poses.flat(2).every(Number.isFinite)).toBe(true);
      poses
        .slice(1)
        .forEach(
          (points, i) =>
            void expect(
              Math.max(
                ...points.map((point, k) => _length(_sub(point, poses[i]![k]!)))
              )
            ).toBeLessThan(0.5)
        );
      expect(
        poses.flatMap((points, step) =>
          _crossings(points, `${face.join('×')} u=${steps[step]}`)
        )
      ).toEqual([]);
    });
  });

  test('сгибы не проворачиваются сквозь лист: нормали граней меняются плавно', () => {
    const poses = Array.from({ length: 201 }, (_, i) =>
      fold.pose(i / 200, [21, 15.2])
    );
    poses
      .slice(1)
      .forEach(
        (points, step) =>
          void fold.triangles.forEach(
            (indices) =>
              void ((before: XYZ, after: XYZ) =>
                _length(before) > 1e-9 &&
                _length(after) > 1e-9 &&
                expect(
                  _dot(before, after) / _length(before) / _length(after)
                ).toBeGreaterThan(Math.cos((15 * Math.PI) / 180)))(
                _normal(..._corners(poses[step]!, indices)),
                _normal(..._corners(points, indices))
              )
          )
      );
  });

  test('бумага двусторонняя: лицо вверх и оборот вниз, разнесены на толщину листа', () => {
    const { geometry } = createPaperGeometry(fold, 1, [21, 15.2]);
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    expect(position.count).toBe(fold.triangles.length * 6);
    Array.from({ length: position.count }, (_, i) =>
      ((front) => {
        expect(normal.getY(i)).toBeCloseTo(front ? 1 : -1, 9);
        expect(position.getY(i)).toBeCloseTo(
          SHEET_LIFT + ((front ? 1 : -1) * PAPER_THICKNESS) / 2,
          5
        );
      })(Math.floor(i / 3) % 2 === 0)
    );
    geometry.dispose();
  });
});
