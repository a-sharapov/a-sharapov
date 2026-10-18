import { describe, expect, test } from 'bun:test';
import { type BufferGeometry, ShapePath, Triangle, Vector3 } from 'three';
import {
  ELASTIC,
  ELASTIC_ANCHOR,
  ELASTIC_REACH,
  elasticScale,
  FLAT,
  foldSketchbook,
  HINGE,
  pageHeight,
  pageProfile,
  RIBBON,
  ribbonForms,
  SPINE,
} from '#lib/components/@Viewer/Scene/models/sketchbook-rig.ts';
import {
  extrudeFrom,
  sheetFrom,
  sweepFrom,
} from '#lib/components/@Viewer/Scene/models/svg.ts';

var _pageRight = () =>
  ((path) => (
    path.moveTo(0, -3.4),
    path.bezierCurveTo(2.5, -8, 18, -10, 40, -10),
    path.bezierCurveTo(80, -10, 120, -9.6, 148, -9.4),
    path
  ))(new ShapePath());

var _pageLeft = () =>
  ((path) => (
    path.moveTo(-148, -9.4),
    path.bezierCurveTo(-120, -9.6, -80, -10, -40, -10),
    path.bezierCurveTo(-18, -10, -2.5, -8, 0, -3.4),
    path
  ))(new ShapePath());

var _blockLeft = () =>
  ((path) => (
    path.moveTo(0, -1.8),
    path.lineTo(0, -3.4),
    path.bezierCurveTo(-2.5, -8, -18, -10, -40, -10),
    path.bezierCurveTo(-80, -10, -120, -9.6, -148, -9.4),
    path.lineTo(-148, -2.5),
    path.lineTo(-16, -2.5),
    path.bezierCurveTo(-11, -2.5, -9, -1.8, -6, -1.8),
    path
  ))(new ShapePath());

var _blockRight = () =>
  ((path) => (
    path.moveTo(148, -2.5),
    path.lineTo(148, -9.4),
    path.bezierCurveTo(120, -9.6, 80, -10, 40, -10),
    path.bezierCurveTo(18, -10, 2.5, -8, 0, -3.4),
    path.lineTo(0, -1.8),
    path.lineTo(6, -1.8),
    path.bezierCurveTo(9, -1.8, 11, -2.5, 16, -2.5),
    path
  ))(new ShapePath());

var _faces = (geometry: BufferGeometry) =>
  ((position, index) =>
    Array.from(
      { length: (index?.count ?? position.count) / 3 },
      (_, face) =>
        new Triangle(
          ...([0, 1, 2].map((k) =>
            new Vector3().fromBufferAttribute(
              position,
              index ? index.getX(face * 3 + k) : face * 3 + k
            )
          ) as [Vector3, Vector3, Vector3])
        )
    ))(geometry.getAttribute('position'), geometry.getIndex());

describe('sheetFrom', () => {
  test('страницы разворота смотрят вверх, включая крутой спуск к корешку', () => {
    [_pageLeft(), _pageRight()].forEach((path) => {
      const normals = _faces(
        sheetFrom(path, { depth: 210, divisions: 32 })
      ).map((face) => face.getNormal(new Vector3()));
      expect(normals.length).toBeGreaterThan(60);
      expect(Math.min(...normals.map((normal) => normal.y))).toBeGreaterThan(
        0.3
      );
    });
  });

  test('UV: u — по дуге от начала пути к концу, v — 0 и 1 по краям', () => {
    const geometry = sheetFrom(_pageRight(), { depth: 210, divisions: 32 });
    const uv = geometry.getAttribute('uv');
    const u = Array.from({ length: uv.count / 2 }, (_, i) => uv.getX(i * 2));
    expect(u[0]).toBe(0);
    expect(u.at(-1)).toBeCloseTo(1, 6);
    expect(u.every((value, i) => i === 0 || value > u[i - 1]!)).toBe(true);
    expect(
      Array.from({ length: uv.count }, (_, i) => uv.getY(i)).every(
        (v, i) => v === i % 2
      )
    ).toBe(true);
    const position = geometry.getAttribute('position');
    expect(position.getZ(0)).toBe(0);
    expect(position.getZ(1)).toBeCloseTo(21, 6);
  });
});

describe('блок страниц', () => {
  test('половины блока с провалом у корешка вытягиваются без вывернутых граней', () => {
    [_blockLeft(), _blockRight()].forEach((path) => {
      const geometry = extrudeFrom(path, { depth: 210, curveSegments: 32 });
      const volume = _faces(geometry).reduce(
        (sum, { a, b, c }) => sum + a.dot(new Vector3().crossVectors(b, c)) / 6,
        0
      );
      expect(volume).toBeGreaterThan(200);
      expect(volume).toBeLessThan(230);
    });
  });
});

describe('sweepFrom: pitch', () => {
  var _ramp = (pitch: boolean) =>
    sweepFrom(
      ((path) => (
        path.moveTo(0, 0), path.lineTo(15, 0), path.lineTo(30, 0), path
      ))(new ShapePath()),
      {
        radius: [2, 0.5],
        segments: 24,
        radial: 16,
        squareness: 8,
        lift: (t) => t * 30,
        pitch,
      }
    );

  test('сечение поперёк оси с подъёмом: толщина на спуске сохраняется', () => {
    const axis = new Vector3(1, 0, 1).normalize();
    const position = _ramp(true).getAttribute('position');
    const ring = Array.from({ length: 16 }, (_, j) =>
      new Vector3().fromBufferAttribute(position, 12 * 16 + j)
    );
    const center = ring
      .reduce((sum, point) => sum.add(point), new Vector3())
      .divideScalar(16);
    expect(
      Math.max(
        ...ring.map((point) => Math.abs(point.clone().sub(center).dot(axis)))
      )
    ).toBeLessThan(1e-3);
    expect(
      Math.max(...ring.map((point) => point.clone().sub(center).length()))
    ).toBeGreaterThan(0.2);
  });

  test('грани трубки на спуске смотрят наружу', () => {
    const axis = new Vector3(1, 0, 1).normalize();
    const faces = _faces(_ramp(true));
    const outward =
      faces.reduce((sum, face) => {
        const centroid = face.getMidpoint(new Vector3());
        const radial = centroid
          .clone()
          .sub(axis.clone().multiplyScalar(centroid.dot(axis)))
          .normalize();
        return sum + face.getNormal(new Vector3()).dot(radial);
      }, 0) / faces.length;
    expect(outward).toBeGreaterThan(0.6);
  });

  test('без pitch сечение по-прежнему вертикальное', () => {
    const position = _ramp(false).getAttribute('position');
    const ring = Array.from({ length: 16 }, (_, j) =>
      new Vector3().fromBufferAttribute(position, 12 * 16 + j)
    );
    expect(
      Math.max(...ring.map((point) => point.x)) -
        Math.min(...ring.map((point) => point.x))
    ).toBeLessThan(1e-6);
  });
});

describe('sweepFrom: roll', () => {
  var _band = (angle: number) =>
    sweepFrom(
      ((path) => (
        path.moveTo(0, 0), path.lineTo(15, 0), path.lineTo(30, 0), path
      ))(new ShapePath()),
      {
        radius: [2, 0.2],
        segments: 12,
        radial: 16,
        squareness: 8,
        roll: () => angle,
      }
    );

  test('крен поднимает левую по ходу пути сторону: ширина ленты ложится вдоль склона', () => {
    const position = _band(Math.PI / 3).getAttribute('position');
    const ring = Array.from({ length: 16 }, (_, j) =>
      new Vector3().fromBufferAttribute(position, 6 * 16 + j)
    );
    const center = ring
      .reduce((sum, point) => sum.add(point), new Vector3())
      .divideScalar(16);
    const edge = ring[0]!.clone().sub(center);
    expect(edge.z).toBeGreaterThan(0.1);
    expect(Math.atan2(edge.z, edge.y)).toBeCloseTo(Math.PI / 3, 5);
  });

  test('с креном грани смотрят наружу, без крена сечение прежнее', () => {
    const faces = _faces(_band(Math.PI / 3));
    const outward = faces.filter((face) =>
      ((centroid) =>
        face
          .getNormal(new Vector3())
          .dot(new Vector3(0, centroid.y, centroid.z)) > 0)(
        face.getMidpoint(new Vector3())
      )
    );
    expect(outward.length / faces.length).toBeGreaterThan(0.99);
    const flat = _band(0).getAttribute('position');
    expect(
      Math.max(...Array.from({ length: 16 }, (_, j) => Math.abs(flat.getZ(j))))
    ).toBeCloseTo(0.02, 4);
  });
});

var _profile = pageProfile(_pageRight().subPaths[0]!.getPoints(32));
var _opens = Array.from({ length: 801 }, (_, i) => i / 800);
var _world = (angle: number, x: number, y: number): [number, number] => [
  x * Math.cos(angle) - (y - HINGE) * Math.sin(angle),
  HINGE + x * Math.sin(angle) + (y - HINGE) * Math.cos(angle),
];
var _frame = (angle: number, x: number, y: number): [number, number] => [
  x * Math.cos(angle) + (y - HINGE) * Math.sin(angle),
  HINGE - x * Math.sin(angle) + (y - HINGE) * Math.cos(angle),
];

describe('скетчбук: закрытие', () => {
  test('крайние позы: раскрыт — как разворот, закрыт — стянут резинкой', () => {
    const open = foldSketchbook(1);
    expect(open.angle).toBe(0);
    expect(open.flat).toBe(0);
    expect(open.ribbon).toEqual([0, 0]);
    expect(open.elastic).toEqual({ angle: 0, stretch: 1, twist: 0 });
    const closed = foldSketchbook(0);
    expect(closed.angle).toBeCloseTo(Math.PI, 9);
    expect(closed.flat).toBe(1);
    expect(closed.ribbon).toEqual([0, 1]);
    expect(closed.elastic.angle).toBeCloseTo(Math.PI / 2, 9);
    expect(closed.elastic.twist).toBe(1);
    expect(closed.elastic.stretch).toBeCloseTo(1, 9);
  });

  test('правая страница не проходит сквозь левую', () => {
    _opens.forEach((open) => {
      const { angle, flat } = foldSketchbook(open);
      Array.from({ length: 297 }, (_, i) => i / 2).forEach((x) => {
        const { 0: X, 1: Y } = _world(angle, x, pageHeight(_profile, x, flat));
        void (
          X < -0.01 &&
          X > -148 &&
          expect(Y).toBeGreaterThanOrEqual(pageHeight(_profile, X, flat))
        );
      });
    });
  });

  test('закладка лежит на левой странице и не заходит в правый блок', () => {
    const forms = ribbonForms(_profile);
    const corners = ({ shift, lift, roll }: (typeof forms)[number]) =>
      ((r) =>
        Array.from({ length: 21 }, (_, i) => i / 10 - 1).flatMap((u) =>
          [-1, 1].map((v): [number, number] => [
            shift + u * RIBBON[0] * Math.cos(r) - v * RIBBON[1] * Math.sin(r),
            lift(shift) +
              u * RIBBON[0] * Math.sin(r) +
              v * RIBBON[1] * Math.cos(r),
          ])
        ))(roll(shift));
    const all = forms.map(corners);
    _opens.forEach((open) => {
      const { angle, flat, ribbon: weights } = foldSketchbook(open);
      const w = [1 - weights[0] - weights[1], weights[0], weights[1]];
      all[0]!.forEach((_, k) => {
        const X = w.reduce(
          (sum, weight, f) => sum + weight * all[f]![k]![0],
          0
        );
        const Y = w.reduce(
          (sum, weight, f) => sum + weight * all[f]![k]![1],
          0
        );
        void (
          (X <= 0 || angle === 0) &&
          expect(Y).toBeGreaterThan(pageHeight(_profile, X, flat))
        );
        const { 0: x, 1: y } = _frame(angle, X, Y);
        void (
          x > 0 &&
          x < 148 &&
          expect(y).toBeGreaterThan(pageHeight(_profile, x, flat))
        );
      });
    });
    all[2]!.forEach(({ 0: x }) => void expect(x).toBeLessThan(0));
  });

  test('середина корешка: на столе, снаружи блоков; у закрытой — стенка от низа до верха', () => {
    _opens.forEach((open) => {
      const { angle, spine } = foldSketchbook(open);
      const direction = [Math.cos(spine.angle), Math.sin(spine.angle)];
      const outward = [Math.sin(spine.angle), -Math.cos(spine.angle)];
      expect(spine.y + outward[1]! * SPINE).toBeGreaterThan(-1e-9);
      const along = (x: number, y: number) =>
        (x - spine.x) * outward[0]! + (y - spine.y) * outward[1]!;
      expect(Math.abs(along(0, SPINE))).toBeLessThan(1e-9);
      expect(Math.abs(along(..._world(angle, 0, SPINE)))).toBeLessThan(1e-9);
      const at = (x: number, y: number) =>
        (x - spine.x) * direction[0]! + (y - spine.y) * direction[1]!;
      expect(at(0, SPINE)).toBeGreaterThanOrEqual(-1e-9);
      expect(at(..._world(angle, 0, SPINE))).toBeLessThanOrEqual(
        spine.length + 1e-9
      );
    });
    const { spine } = foldSketchbook(0);
    expect(spine.angle).toBeCloseTo(Math.PI / 2, 9);
    expect(spine.x).toBeCloseTo(0, 9);
    expect(spine.y).toBeCloseTo(0, 9);
    expect(spine.length).toBeCloseTo(2 * HINGE, 9);
  });

  test('резинка обходит закрытую книгу снаружи и ложится под неё', () => {
    const reachOpen = 155.5 - ELASTIC_ANCHOR[0];
    const poses = _opens
      .map((open) => foldSketchbook(open))
      .filter(({ angle }) => angle === Math.PI);
    expect(
      poses.filter(({ elastic }) => elastic.angle > 0.1 && elastic.angle < 1.5)
        .length
    ).toBeGreaterThan(20);
    poses.forEach(({ elastic: { angle, stretch, twist } }) => {
      const reach = stretch * (reachOpen + (ELASTIC_REACH - reachOpen) * twist);
      const { 0: X, 1: Y } = _world(
        Math.PI,
        ELASTIC_ANCHOR[0] + reach * Math.cos(angle),
        ELASTIC_ANCHOR[1] + reach * Math.sin(angle)
      );
      const scale = elasticScale(twist);
      expect(
        Math.min(X + ELASTIC[0] * scale + 150, Y + ELASTIC[1] * scale)
      ).toBeLessThanOrEqual(1e-9);
    });
    const { elastic } = foldSketchbook(0);
    const { 1: Y } = _world(
      Math.PI,
      ELASTIC_ANCHOR[0],
      ELASTIC_ANCHOR[1] + elastic.stretch * ELASTIC_REACH
    );
    expect(Y).toBeCloseTo(-ELASTIC[1], 9);
  });

  test('ровный верх закрытого блока не выворачивает торцы', () => {
    [_blockLeft(), _blockRight()].forEach((path) => {
      const faces = _faces(
        extrudeFrom(path, { depth: 210, curveSegments: 32 })
      );
      const flatten = (point: Vector3) =>
        point.clone().setY(point.y > 0.29 ? FLAT / 10 : point.y);
      faces.forEach((face) => {
        const before = face.getNormal(new Vector3());
        const after = new Triangle(
          flatten(face.a),
          flatten(face.b),
          flatten(face.c)
        ).getNormal(new Vector3());
        void (
          after.lengthSq() > 0 && expect(before.dot(after)).toBeGreaterThan(0)
        );
      });
    });
  });
});
