import {
  type BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
} from 'three';

type Layout = { name: string; size: number; morph: number }[];

type Morphs = Record<string, BufferAttribute[]>;

var _morphs = (geometry: BufferGeometry) =>
  geometry.morphAttributes as unknown as Morphs;

var _layout = (geometry: BufferGeometry): Layout => [
  ...Object.entries(geometry.attributes)
    .sort(
      ({ 0: a }, { 0: b }) =>
        Number(b === 'position') - Number(a === 'position')
    )
    .map(({ 0: name, 1: attribute }) => ({
      name,
      size: attribute.itemSize,
      morph: -1,
    })),
  ...Object.entries(geometry.morphAttributes).flatMap(
    ({ 0: name, 1: targets }) =>
      targets.map((target, morph) => ({ name, size: target.itemSize, morph }))
  ),
];

var _source = (geometry: BufferGeometry, name: string, morph: number) =>
  (morph < 0
    ? geometry.getAttribute(name)
    : _morphs(geometry)[name]![morph]!) as BufferAttribute;

var _record = (geometry: BufferGeometry, layout: Layout, i: number) =>
  layout.flatMap(({ name, size, morph }) =>
    ((attribute) =>
      Array.from({ length: size }, (_, k) => attribute.getComponent(i, k)))(
      _source(geometry, name, morph)
    )
  );

var _mix = (a: number[], b: number[], t: number) =>
  a.map((value, k) => value + (b[k]! - value) * t);

var _before = (a: number[], b: number[], axis: number) =>
  a[axis]! < b[axis]! ||
  (a[axis] === b[axis] &&
    (a[0]! < b[0]! ||
      (a[0] === b[0] && (a[1]! < b[1]! || (a[1] === b[1] && a[2]! < b[2]!)))));

var _cut = (p: number[], q: number[], axis: number, plane: number) =>
  ((point) => ((point[axis] = plane), point))(
    _before(p, q, axis)
      ? _mix(p, q, (plane - p[axis]!) / (q[axis]! - p[axis]!))
      : _mix(q, p, (plane - q[axis]!) / (p[axis]! - q[axis]!))
  );

var _clip = (
  polygon: number[][],
  axis: number,
  plane: number,
  keep: (value: number) => boolean
) =>
  polygon.flatMap((point, i) =>
    ((next) =>
      keep(point[axis]!)
        ? keep(next[axis]!)
          ? [point]
          : [point, _cut(point, next, axis, plane)]
        : keep(next[axis]!)
          ? [_cut(point, next, axis, plane)]
          : [])(polygon[(i + 1) % polygon.length]!)
  );

var _area = (polygon: number[][]) =>
  polygon
    .slice(2)
    .reduce(
      (sum, c, i) =>
        ((a, b) =>
          ((ux, uy, uz, vx, vy, vz) =>
            sum +
            Math.hypot(
              uy * vz - uz * vy,
              uz * vx - ux * vz,
              ux * vy - uy * vx
            ))(
            b[0]! - a[0]!,
            b[1]! - a[1]!,
            b[2]! - a[2]!,
            c[0]! - a[0]!,
            c[1]! - a[1]!,
            c[2]! - a[2]!
          ))(polygon[0]!, polygon[i + 1]!),
      0
    );

var _slab = (triangle: number[][], axis: number, from: number, to: number) =>
  _clip(
    _clip(triangle, axis, from, (value) => value >= from),
    axis,
    to,
    (value) => value <= to
  );

var _fan = (polygon: number[][]) =>
  polygon.length < 3 || _area(polygon) < 1e-10
    ? []
    : polygon.slice(2).flatMap((c, i) => [polygon[0]!, polygon[i + 1]!, c]);

var _normalize = (values: number[], at: number) =>
  ((length) =>
    length > 1e-12 &&
    [0, 1, 2].forEach((k) => void (values[at + k] = values[at + k]! / length)))(
    Math.hypot(values[at]!, values[at + 1]!, values[at + 2]!)
  );

export var sliceGeometry = (
  source: BufferGeometry,
  axis: 0 | 1 | 2,
  step: number
): BufferGeometry =>
  ((geometry) =>
    ((layout) =>
      ((records) =>
        ((output) => (
          layout.reduce(
            (offset, { name, size, morph }) => (
              ((values) => (
                name === 'normal' &&
                  records.forEach((_, i) => void _normalize(values, i * size)),
                morph < 0
                  ? output.setAttribute(
                      name,
                      new Float32BufferAttribute(values, size)
                    )
                  : (_morphs(output)[name] = [
                      ...(_morphs(output)[name] ?? []),
                      new Float32BufferAttribute(values, size),
                    ])
              ))(
                records.flatMap((record) => record.slice(offset, offset + size))
              ),
              offset + size
            ),
            0
          ),
          (output.morphTargetsRelative = geometry.morphTargetsRelative),
          output.computeBoundingBox(),
          output.computeBoundingSphere(),
          geometry !== source && geometry.dispose(),
          output
        ))(new BufferGeometry()))(
        Array.from(
          { length: geometry.getAttribute('position').count / 3 },
          (_, face) =>
            [0, 1, 2].map((k) => _record(geometry, layout, face * 3 + k))
        ).flatMap((triangle) =>
          ((low, high) =>
            Array.from(
              {
                length: Math.max(
                  1,
                  Math.ceil(high / step) - Math.floor(low / step)
                ),
              },
              (_, k) =>
                _fan(
                  _slab(
                    triangle,
                    axis,
                    (Math.floor(low / step) + k) * step,
                    (Math.floor(low / step) + k + 1) * step
                  )
                )
            ).flat())(
            Math.min(...triangle.map((point) => point[axis]!)),
            Math.max(...triangle.map((point) => point[axis]!))
          )
        )
      ))(_layout(geometry)))(source.index ? source.toNonIndexed() : source);
