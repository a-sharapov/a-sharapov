import { describe, expect, test } from 'bun:test';
import {
  BoxGeometry,
  type BufferGeometry,
  ShapePath,
  Vector2,
  Vector3,
} from 'three';
import { extrudeFrom } from '#lib/components/@Viewer/Scene/models/svg.ts';
import {
  createFlex,
  createSag,
  FLEX,
  SAG,
  sliceGeometry,
  stepFlex,
  stepSag,
} from '#lib/components/@Viewer/Scene/paper-bend.ts';

var _ease = (t: number) =>
  ((x) => x * x * x * (x * (x * 6 - 15) + 10))(Math.min(1, Math.max(0, t)));

var _carry = (t: number) =>
  t < 0.4
    ? 0
    : t < 1.1
      ? 22 * _ease((t - 0.4) / 0.7)
      : t < 1.6
        ? 22
        : 22 * (1 - _ease((t - 1.6) / 0.7));

var _area = (geometry: BoxGeometry | ReturnType<typeof sliceGeometry>) =>
  ((position) =>
    Array.from({ length: position.count / 3 }, (_, face) =>
      ((a, b, c) => b.sub(a).cross(c.sub(a)).length() / 2)(
        new Vector3().fromBufferAttribute(position, face * 3),
        new Vector3().fromBufferAttribute(position, face * 3 + 1),
        new Vector3().fromBufferAttribute(position, face * 3 + 2)
      )
    ).reduce((sum, value) => sum + value, 0))(
    (geometry.index ? geometry.toNonIndexed() : geometry).getAttribute(
      'position'
    )
  );

describe('sliceGeometry', () => {
  const box = new BoxGeometry(21, 0.01, 29.7, 1, 1, 1);
  const sliced = sliceGeometry(box, 2, 1);

  test('keeps the surface area', () =>
    void expect(_area(sliced)).toBeCloseTo(_area(box), 3));

  test('cuts the long side into strips no longer than the step', () => {
    const position = sliced.getAttribute('position');
    const zs = new Set(
      Array.from(
        { length: position.count },
        (_, i) => Math.round(position.getZ(i) * 1e4) / 1e4
      )
    );
    expect(zs.size).toBeGreaterThanOrEqual(30);
    const faces = Array.from({ length: position.count / 3 }, (_, face) =>
      [0, 1, 2].map((k) => position.getZ(face * 3 + k))
    );
    faces.forEach(
      (zs) =>
        void expect(Math.max(...zs) - Math.min(...zs)).toBeLessThanOrEqual(
          1 + 1e-6
        )
    );
  });

  test('keeps winding and normals outward', () => {
    const position = sliced.getAttribute('position');
    const normal = sliced.getAttribute('normal');
    Array.from({ length: position.count / 3 }, (_, face) =>
      ((a, b, c, n) => b.sub(a).cross(c.sub(a)).normalize().dot(n))(
        new Vector3().fromBufferAttribute(position, face * 3),
        new Vector3().fromBufferAttribute(position, face * 3 + 1),
        new Vector3().fromBufferAttribute(position, face * 3 + 2),
        new Vector3().fromBufferAttribute(normal, face * 3)
      )
    ).forEach((dot) => void expect(dot).toBeGreaterThan(0.99));
  });

  test('interpolates morph targets along the cut', () => {
    const source = new BoxGeometry(10, 1, 1, 1, 1, 1).toNonIndexed();
    source.morphAttributes.position = [source.getAttribute('position').clone()];
    const target = source.morphAttributes.position[0]!;
    Array.from({ length: target.count }).forEach(
      (_, i) => void target.setY(i, target.getY(i) + target.getX(i))
    );
    const cut = sliceGeometry(source, 0, 1);
    const position = cut.getAttribute('position');
    const morph = cut.morphAttributes.position![0]!;
    Array.from({ length: position.count }).forEach(
      (_, i) =>
        void expect(morph.getY(i) - position.getY(i)).toBeCloseTo(
          position.getX(i),
          4
        )
    );
  });
});

var _rect = (x0: number, y0: number, x1: number, y1: number) =>
  ((path) => (
    path.moveTo(x0, y0),
    path.lineTo(x1, y0),
    path.lineTo(x1, y1),
    path.lineTo(x0, y1),
    path.lineTo(x0, y0),
    path
  ))(new ShapePath());

var _orientation = (geometry: BufferGeometry) =>
  ((position, normal) =>
    Array.from({ length: position.count / 3 }, (_, face) =>
      [0, 1, 2].map((k) =>
        new Vector3().fromBufferAttribute(position, face * 3 + k)
      )
    ).reduce(
      (acc, { 0: a, 1: b, 2: c }, face) =>
        ((cross) => ({
          volume: acc.volume + a.dot(b.clone().cross(c)) / 6,
          agreement:
            cross.length() < 1e-9
              ? acc.agreement
              : acc.agreement +
                (cross
                  .normalize()
                  .dot(new Vector3().fromBufferAttribute(normal, face * 3)) >
                0.5
                  ? 1
                  : 0),
          faces: acc.faces + (cross.length() < 1e-9 ? 0 : 1),
        }))(b.clone().sub(a).cross(c.clone().sub(a))),
      { volume: 0, agreement: 0, faces: 0 }
    ))(geometry.getAttribute('position'), geometry.getAttribute('normal'));

describe('нарезка настоящих деталей не выворачивает их', () => {
  const parts = {
    cover: extrudeFrom(_rect(15, -107, 150, 107), {
      depth: 2.5,
      bevel: 0.6,
      bevelSegments: 4,
    }).rotateX(-Math.PI / 2),
    sheet: extrudeFrom(_rect(-105, -148.5, 105, 148.5), { depth: 0.1 }).rotateX(
      -Math.PI / 2
    ),
  };

  Object.entries(parts).forEach(
    ({ 0: name, 1: geometry }) =>
      void test(`${name}: объём тот же и положителен, нормали граней наружу`, () => {
        const before = _orientation(geometry);
        const after = _orientation(
          sliceGeometry(
            geometry,
            name === 'cover' ? 0 : 2,
            name === 'cover' ? 0.6 : 1
          )
        );
        expect(after.volume).toBeGreaterThan(0);
        expect(after.volume).toBeCloseTo(before.volume, 4);
        expect(after.agreement / after.faces).toBeGreaterThan(0.95);
        expect(after.faces).toBeGreaterThan(before.faces);
      })
  );
});

describe('stepSag', () => {
  const run = () =>
    ((sag) =>
      Array.from({ length: 4 * 120 }, (_, i) =>
        ((t, y) => (
          stepSag(
            sag,
            1 / 120,
            y,
            y,
            new Vector2(0, -1),
            i > 0
              ? Math.abs(y - _carry((i - 1) / 120)) * 120 + 20 * Number(y > 0)
              : 0
          ),
          {
            t,
            y,
            droop: sag.droop.value,
            curl: sag.curl.value,
            active: sag.active,
          }
        ))(i / 120, _carry(i / 120))
      ))(createSag());

  const frames = run();

  test('droops while carried, within a few millimetres', () => {
    const peak = Math.max(...frames.map(({ droop }) => droop));
    expect(peak).toBeGreaterThan(SAG.droop * 0.7);
    expect(peak).toBeLessThanOrEqual(0.5);
  });

  test('never pushes the ends below the table', () =>
    frames.forEach(
      ({ y, droop }) =>
        void expect(droop).toBeLessThanOrEqual(Math.max(0, y) + 1e-9)
    ));

  test('lies perfectly flat at rest', () => {
    const rest = frames.filter(({ t }) => t < 0.4);
    rest.forEach(
      ({ droop, curl, active }) =>
        void expect([droop, curl, active]).toEqual([0, 0, false])
    );
    const last = frames.at(-1)!;
    expect([last.droop, last.curl, last.active]).toEqual([0, 0, false]);
  });

  test('settles after landing with a small flutter', () => {
    const after = frames.filter(({ t }) => t > 2.3);
    expect(Math.min(...after.map(({ droop }) => droop))).toBeGreaterThan(-0.25);
  });
});

describe('stepFlex', () => {
  const open = (t: number) => Math.PI * (1 - _ease((t - 0.3) / 0.6));
  const frames = ((flex) =>
    Array.from({ length: 3 * 120 }, (_, i) =>
      ((angle) => (
        stepFlex(flex, 1 / 120, angle),
        {
          t: i / 120,
          angle,
          bend: flex.bend.value,
          fan: flex.fan.value,
          active: flex.active,
        }
      ))(open(i / 120))
    ))(createFlex());

  test('the free edge lags while the cover swings', () => {
    const swing = frames.filter(({ t }) => t > 0.35 && t < 0.6);
    expect(Math.max(...swing.map(({ bend }) => bend))).toBeGreaterThan(0.05);
    expect(
      Math.max(...frames.map(({ bend }) => Math.abs(bend)))
    ).toBeLessThanOrEqual(0.5);
    expect(Math.max(...frames.map(({ fan }) => fan))).toBeLessThanOrEqual(
      FLEX.fan + 1e-9
    );
  });

  test('cover and pages stay on the table side of the hinge and off the closed half', () =>
    frames.forEach(({ angle, bend, fan }) => {
      expect(bend).toBeGreaterThanOrEqual(-angle * FLEX.reach - 1e-9);
      expect(bend + fan).toBeLessThanOrEqual(
        (Math.PI - angle) * FLEX.reach + 1e-9
      );
      expect(fan).toBeGreaterThanOrEqual(0);
    }));

  test('rests exactly flat once open', () => {
    const last = frames.at(-1)!;
    expect([last.bend, last.fan, last.active]).toEqual([0, 0, false]);
    frames
      .filter(({ t }) => t < 0.29)
      .forEach(({ bend, fan }) => void expect([bend, fan]).toEqual([0, 0]));
  });
});
