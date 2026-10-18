import {
  BufferGeometry,
  CatmullRomCurve3,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  type Shape,
  type ShapePath,
  Vector2,
  Vector3,
} from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export var MM = 0.1;

export type SvgPaths = Record<string, ShapePath>;

var _cache = new Map<string, SvgPaths>();

export var parseSvg = (source: string): SvgPaths =>
  _cache.get(source) ??
  ((paths) => (_cache.set(source, paths), paths))(
    new SVGLoader()
      .parse(source)
      .paths.reduce<SvgPaths>(
        (acc, path) =>
          ((id) => (id ? { ...acc, [id]: path } : acc))(
            (path.userData?.node as Element | undefined)?.getAttribute('id')
          ),
        {}
      )
  );

var _points = (path: ShapePath, divisions: number): Vector2[] =>
  path.subPaths
    .flatMap((subPath) => subPath.getPoints(divisions))
    .filter((point, i, all) => i === 0 || point.distanceTo(all[i - 1]!) > 1e-4);

export type LatheOptions = {
  segments?: number;
  divisions?: number;
  baseline?: number;
  phase?: number;
};

export var latheFrom = (
  path: ShapePath,
  { segments = 64, divisions = 12, baseline, phase = 0 }: LatheOptions = {}
): BufferGeometry =>
  ((points) =>
    ((bottom) =>
      new LatheGeometry(
        points.map(
          (point) =>
            new Vector2(Math.max(0, point.x) * MM, (bottom - point.y) * MM)
        ),
        segments,
        phase
      ))(baseline ?? Math.max(...points.map((point) => point.y))))(
    _points(path, divisions)
  );

export type ExtrudeOptions = {
  depth: number;
  bevel?: number;
  bevelSegments?: number;
  curveSegments?: number;
};

export var extrudeFrom = (
  path: ShapePath,
  { depth, bevel = 0, bevelSegments = 3, curveSegments = 16 }: ExtrudeOptions
): BufferGeometry =>
  new ExtrudeGeometry(path.toShapes(), {
    depth: Math.max(0.001, depth - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments,
    curveSegments,
  })
    .rotateX(Math.PI)
    .scale(MM, MM, MM)
    .translate(0, 0, (depth - bevel) * MM);

export type Anchor = 'min' | 'center' | 'max' | 'none';

export var anchor = (
  geometry: BufferGeometry,
  x: Anchor = 'center',
  y: Anchor = 'min',
  z: Anchor = 'center'
): BufferGeometry => {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const pick = (mode: Anchor, min: number, max: number) =>
    ({ min, max, center: (min + max) / 2, none: 0 })[mode];

  return geometry.translate(
    -pick(x, box.min.x, box.max.x),
    -pick(y, box.min.y, box.max.y),
    -pick(z, box.min.z, box.max.z)
  );
};

export var normalizeUv = (geometry: BufferGeometry): BufferGeometry => {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const uv = geometry.getAttribute('uv');
  const position = geometry.getAttribute('position');
  Array.from({ length: uv.count }).forEach(
    (_, i) =>
      void uv.setXY(
        i,
        (position.getX(i) - box.min.x) / (box.max.x - box.min.x),
        (position.getY(i) - box.min.y) / (box.max.y - box.min.y)
      )
  );
  uv.needsUpdate = true;
  return geometry;
};

export var shapeWithHoles = (outer: ShapePath, ...holes: ShapePath[]): Shape =>
  Object.assign(outer.toShapes()[0]!, {
    holes: holes.flatMap((hole) => hole.toShapes()),
  });

export var projectedUv = (geometry: BufferGeometry): BufferGeometry =>
  ((position) =>
    geometry.setAttribute(
      'uv',
      new Float32BufferAttribute(
        Array.from({ length: position.count }).flatMap((_, i) => [
          position.getX(i) + position.getZ(i),
          position.getY(i),
        ]),
        2
      )
    ))(geometry.getAttribute('position'));

export var smoothNormals = (
  geometry: BufferGeometry,
  tolerance = 1e-3
): BufferGeometry =>
  ((merged) => (merged.computeVertexNormals(), projectedUv(merged)))(
    mergeVertices(
      (() => {
        const copy = geometry.index
          ? geometry.toNonIndexed()
          : geometry.clone();
        copy.deleteAttribute('normal');
        copy.deleteAttribute('uv');
        return copy;
      })(),
      tolerance
    )
  );

export type SweepOptions = {
  radius: [inPlane: number, across: number];
  profile?: (t: number) => number | [inPlane: number, across: number];
  segments?: number;
  radial?: number;
  closed?: boolean;
  squareness?: number;
  lift?: (t: number, point: [x: number, y: number]) => number;
  shift?: (t: number, point: [x: number, y: number]) => number;
  pitch?: boolean;
  roll?: (t: number, point: [x: number, y: number]) => number;
  reach?: (t: number, side: number) => number;
};

var _superellipse = (angle: number, n: number): [number, number] =>
  ((c, s) => [
    Math.sign(c) * Math.abs(c) ** (2 / n),
    Math.sign(s) * Math.abs(s) ** (2 / n),
  ])(Math.cos(angle), Math.sin(angle));

export var sweepFrom = (
  path: ShapePath,
  {
    radius,
    profile = () => 1,
    segments = 64,
    radial = 18,
    closed = false,
    squareness = 2,
    lift = () => 0,
    shift,
    pitch = false,
    roll = () => 0,
    reach = (t) => t,
  }: SweepOptions
): BufferGeometry => {
  const points = _points(path, 24).map(
    (point) => new Vector3(point.x * MM, -point.y * MM, 0)
  );
  const curve = new CatmullRomCurve3(
    closed && points.length > 1 && points[0]!.distanceTo(points.at(-1)!) < 1e-6
      ? points.slice(0, -1)
      : points,
    closed,
    'centripetal'
  );
  const up = new Vector3(0, 0, 1);
  const at = (s: number) =>
    ((point) =>
      ((plan: [number, number]) =>
        shift
          ? point
              .addScaledVector(up, lift(s, plan) * MM)
              .addScaledVector(
                new Vector3()
                  .crossVectors(up, curve.getTangentAt(s))
                  .normalize(),
                shift(s, plan) * MM
              )
          : point.addScaledVector(up, lift(s, plan) * MM))([
        point.x / MM,
        -point.y / MM,
      ]))(curve.getPointAt(s));
  const frame = (t: number) => {
    const tangent = pitch
      ? at(Math.min(1, t + 1e-3))
          .sub(at(Math.max(0, t - 1e-3)))
          .normalize()
      : curve.getTangentAt(t);
    const normal = new Vector3().crossVectors(up, tangent).normalize();
    const lean = pitch ? new Vector3().crossVectors(tangent, normal) : up;
    const angle = ((plan) => roll(t, [plan.x / MM, -plan.y / MM]))(
      curve.getPointAt(t)
    );
    return {
      center: at(t),
      side: normal
        .clone()
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(lean, Math.sin(angle)),
      rise: lean
        .clone()
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(normal, -Math.sin(angle)),
    };
  };
  const rings = Array.from({ length: segments + 1 }, (_, i) => {
    const t = closed ? (i % segments) / segments : i / segments;
    const ring = frame(t);
    const factor = profile(t);
    const { 0: inPlane, 1: across } =
      typeof factor === 'number' ? [factor, factor] : factor;
    return Array.from({ length: radial }, (__, j) => {
      const { 0: cos, 1: sin } = _superellipse(
        (j / radial) * Math.PI * 2,
        squareness
      );
      const { center, side, rise } = ((s) => (s === t ? ring : frame(s)))(
        reach(t, cos)
      );
      return center
        .clone()
        .addScaledVector(side, cos * radius[0] * inPlane * MM)
        .addScaledVector(rise, sin * radius[1] * across * MM);
    });
  });
  const positions = rings.flat().flatMap((point) => point.toArray());
  const index = rings.slice(0, -1).flatMap((_, i) =>
    Array.from({ length: radial }, (__, j) => {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      return [a, b, c, b, d, c];
    }).flat()
  );
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
};

export type SheetOptions = {
  depth: number;
  divisions?: number;
};

export var sheetFrom = (
  path: ShapePath,
  { depth, divisions = 12 }: SheetOptions
): BufferGeometry =>
  ((points) =>
    ((lengths) =>
      ((geometry) => (
        geometry.setAttribute(
          'position',
          new Float32BufferAttribute(
            points.flatMap((point) => [
              point.x * MM,
              -point.y * MM,
              0,
              point.x * MM,
              -point.y * MM,
              depth * MM,
            ]),
            3
          )
        ),
        geometry.setAttribute(
          'uv',
          new Float32BufferAttribute(
            lengths.flatMap((length) => [
              length / lengths.at(-1)!,
              0,
              length / lengths.at(-1)!,
              1,
            ]),
            2
          )
        ),
        geometry.setIndex(
          points
            .slice(1)
            .flatMap((_, i) => [
              i * 2,
              i * 2 + 1,
              i * 2 + 2,
              i * 2 + 2,
              i * 2 + 1,
              i * 2 + 3,
            ])
        ),
        geometry.computeVertexNormals(),
        geometry
      ))(new BufferGeometry()))(
      points.reduce<number[]>(
        (acc, point, i) => [
          ...acc,
          i === 0 ? 0 : acc.at(-1)! + point.distanceTo(points[i - 1]!),
        ],
        []
      )
    ))(_points(path, divisions));
