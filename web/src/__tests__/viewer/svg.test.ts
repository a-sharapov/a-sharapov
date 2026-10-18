import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { type BufferGeometry, ShapePath, Vector3 } from 'three';
import {
  anchor,
  extrudeFrom,
  latheFrom,
  sweepFrom,
} from '$lib/components/@Viewer/Scene/models/svg';

var _line = (points: [number, number][]) =>
  ((path) => (
    points.forEach(
      ({ 0: x, 1: y }, i) =>
        void (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y))
    ),
    path
  ))(new ShapePath());

var _STRAIGHT: [number, number][] = [
  [0, 0],
  [10, 0],
  [20, 0],
  [30, 0],
];

var _outwardness = (squareness?: number) =>
  ((geometry) => {
    const position = geometry.getAttribute('position');
    const index = geometry.getIndex()!;
    const {
      0: a,
      1: b,
      2: c,
      3: ab,
      4: ac,
      5: normal,
      6: centroid,
    } = Array.from({ length: 7 }, () => new Vector3());
    return (
      Array.from({ length: index.count / 3 }).reduce<number>((sum, _, face) => {
        a.fromBufferAttribute(position, index.getX(face * 3));
        b.fromBufferAttribute(position, index.getX(face * 3 + 1));
        c.fromBufferAttribute(position, index.getX(face * 3 + 2));
        normal
          .crossVectors(ab.subVectors(b, a), ac.subVectors(c, a))
          .normalize();
        centroid.copy(a).add(b).add(c).divideScalar(3);
        const radial = new Vector3(0, centroid.y, centroid.z).normalize();
        return sum + normal.dot(radial);
      }, 0) /
      (index.count / 3)
    );
  })(
    sweepFrom(_line(_STRAIGHT), {
      radius: [2, 3],
      segments: 24,
      radial: 24,
      squareness,
    })
  );

describe('sweepFrom', () => {
  test('грани трубки смотрят наружу', () => {
    expect(_outwardness()).toBeGreaterThan(0.9);
  });

  test('подъём оси (скрепка: две петли на разной высоте) сдвигает кольца по высоте', () => {
    const lift = (t: number) => (t < 0.5 ? 1 : 0);
    const geometry = sweepFrom(_line(_STRAIGHT), {
      radius: [2, 3],
      segments: 24,
      radial: 24,
      lift,
    });
    const position = geometry.getAttribute('position');
    const ringZ = (ring: number) =>
      Array.from({ length: 24 }).reduce<number>(
        (sum, _, j) => sum + position.getZ(ring * 24 + j),
        0
      ) / 24;
    expect(ringZ(0)).toBeCloseTo(0.1, 5);
    expect(ringZ(24)).toBeCloseTo(0, 5);
  });

  test('прямоугольный профиль: грани наружу, вершины кольца на гранях прямоугольника', () => {
    expect(_outwardness(8)).toBeGreaterThan(0.6);
    const position = sweepFrom(_line(_STRAIGHT), {
      radius: [2, 3],
      segments: 4,
      radial: 24,
      squareness: 8,
    }).getAttribute('position');
    const ring = Array.from({ length: 24 }, (_, i) => [
      Math.abs(position.getY(i)),
      Math.abs(position.getZ(i)),
    ]);
    const onEdge = ring.filter(
      ({ 0: y, 1: z }) => Math.abs(y! - 0.2) < 0.02 || Math.abs(z! - 0.3) < 0.02
    );
    expect(onEdge.length / ring.length).toBeGreaterThan(0.8);
  });
});

var _DRAW: Record<string, (path: ShapePath, n: number[]) => void> = {
  M: (path, n) => void path.moveTo(n[0]!, n[1]!),
  L: (path, n) => void path.lineTo(n[0]!, n[1]!),
  Q: (path, n) => void path.quadraticCurveTo(n[0]!, n[1]!, n[2]!, n[3]!),
  C: (path, n) =>
    void path.bezierCurveTo(n[0]!, n[1]!, n[2]!, n[3]!, n[4]!, n[5]!),
  Z: (path) => void (path.currentPath!.autoClose = true),
};

var _shapePath = (d: string) =>
  (d.match(/[MLQCZ][^MLQCZ]*/g) ?? []).reduce(
    (path, command) => (
      _DRAW[command[0]!]!(
        path,
        command
          .slice(1)
          .trim()
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(Number)
      ),
      path
    ),
    new ShapePath()
  );

var _PEN: Record<string, ShapePath> = Object.fromEntries(
  [
    ...readFileSync(
      new URL(
        '../../components/@Viewer/Scene/models/svg/pen.svg',
        import.meta.url
      ),
      'utf8'
    ).matchAll(/<path id="([^"]+)" d="([^"]+)"/g),
  ].map((match) => [match[1]!, _shapePath(match[2]!)])
);

var _LATHE = ['tip', 'nose', 'barrel', 'crown', 'cap'].map((id) =>
  latheFrom(_PEN[id]!, { baseline: 140, segments: 48, divisions: 6 })
);
var _CLIP = anchor(
  extrudeFrom(_PEN.clip!, { depth: 3.2, bevel: 0.4, bevelSegments: 4 }),
  'none',
  'none',
  'center'
).translate(0, 14, 0);

var _orientation = (geometry: BufferGeometry) =>
  ((position, normal, index) =>
    ((faces) =>
      faces.reduce<{ volume: number; agreement: number }>(
        (acc, corners) =>
          ((a, b, c) =>
            ((face) => ({
              volume: acc.volume + a.dot(b.clone().cross(c)) / 6,
              agreement:
                acc.agreement +
                corners.reduce(
                  (sum, i) =>
                    sum +
                    face.dot(new Vector3().fromBufferAttribute(normal, i)),
                  0
                ) /
                  3 /
                  faces.length,
            }))(b.clone().sub(a).cross(c.clone().sub(a)).normalize()))(
            ...(corners.map((i) =>
              new Vector3().fromBufferAttribute(position, i)
            ) as [Vector3, Vector3, Vector3])
          ),
        { volume: 0, agreement: 0 }
      ))(
      Array.from({ length: (index?.count ?? position.count) / 3 }, (_, face) =>
        [0, 1, 2].map((k) => index?.getX(face * 3 + k) ?? face * 3 + k)
      ).filter((corners) =>
        ((a, b, c) => b.clone().sub(a).cross(c.clone().sub(a)).length() > 1e-9)(
          ...(corners.map((i) =>
            new Vector3().fromBufferAttribute(position, i)
          ) as [Vector3, Vector3, Vector3])
        )
      )
    ))(
    geometry.getAttribute('position'),
    geometry.getAttribute('normal'),
    geometry.getIndex()
  );

var _extent = (geometries: BufferGeometry[]) =>
  geometries.reduce(
    (acc, geometry) =>
      ((position) =>
        Array.from({ length: position.count }).reduce<typeof acc>(
          (inner, _, i) => ({
            bottom: Math.min(inner.bottom, position.getY(i)),
            top: Math.max(inner.top, position.getY(i)),
            radius: Math.max(
              inner.radius,
              Math.hypot(position.getX(i), position.getZ(i))
            ),
            reach: Math.max(inner.reach, position.getX(i)),
          }),
          acc
        ))(geometry.getAttribute('position')),
    {
      bottom: Number.POSITIVE_INFINITY,
      top: Number.NEGATIVE_INFINITY,
      radius: 0,
      reach: Number.NEGATIVE_INFINITY,
    }
  );

describe('ручка (pen.svg)', () => {
  test('каждая деталь замкнута и не вывернута: объём > 0, нормали вершин — по граням', () => {
    [..._LATHE, _CLIP].forEach((geometry) => {
      const { volume, agreement } = _orientation(geometry);
      expect(volume).toBeGreaterThan(0);
      expect(agreement).toBeGreaterThan(0.7);
    });
  });

  test('габариты для стакана: длина 13.5–14.5 см, корпус ≤ 0.45 см от оси, клипса — на +X не дальше 0.75 см', () => {
    const body = _extent(_LATHE);
    const clip = _extent([_CLIP]);
    expect(body.bottom).toBeCloseTo(0, 5);
    expect(body.top).toBeGreaterThanOrEqual(13.5);
    expect(body.top).toBeLessThanOrEqual(14.5);
    expect(body.radius).toBeLessThanOrEqual(0.45);
    expect(clip.reach).toBeLessThanOrEqual(0.75);
    expect(clip.radius).toBeLessThanOrEqual(0.75);
    expect(clip.top).toBeLessThan(body.top);
  });
});
