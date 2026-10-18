import {
  BufferAttribute,
  BufferGeometry,
  Path,
  ShapePath,
  type TypedArray,
} from 'three';
import type { SvgPaths } from './svg';

type PackedAttribute = { array: TypedArray; size: number; normalized: boolean };

export type PackedGeometry = {
  attributes: Record<string, PackedAttribute>;
  morphs: Record<string, PackedAttribute[]>;
  relative: boolean;
  index: TypedArray | null;
  groups: { start: number; count: number; materialIndex?: number }[];
};

export type PackedPaths = Record<string, ReturnType<Path['toJSON']>[]>;

var _packAttribute = (attribute: BufferAttribute): PackedAttribute => ({
  array: attribute.array,
  size: attribute.itemSize,
  normalized: attribute.normalized,
});

var _unpackAttribute = ({ array, size, normalized }: PackedAttribute) =>
  new BufferAttribute(array, size, normalized);

export var packGeometry = (geometry: BufferGeometry): PackedGeometry => ({
  attributes: Object.fromEntries(
    Object.entries(geometry.attributes).map(({ 0: name, 1: attribute }) => [
      name,
      _packAttribute(attribute as BufferAttribute),
    ])
  ),
  morphs: Object.fromEntries(
    Object.entries(geometry.morphAttributes).map(({ 0: name, 1: list }) => [
      name,
      (list as BufferAttribute[]).map(_packAttribute),
    ])
  ),
  relative: geometry.morphTargetsRelative,
  index: geometry.index?.array ?? null,
  groups: geometry.groups.map(({ start, count, materialIndex }) => ({
    start,
    count,
    materialIndex,
  })),
});

export var unpackGeometry = (packed: PackedGeometry): BufferGeometry =>
  ((geometry) => (
    Object.entries(packed.attributes).forEach(
      ({ 0: name, 1: attribute }) =>
        void geometry.setAttribute(name, _unpackAttribute(attribute))
    ),
    Object.entries(packed.morphs).forEach(
      ({ 0: name, 1: list }) =>
        void ((geometry.morphAttributes as Record<string, BufferAttribute[]>)[
          name
        ] = list.map(_unpackAttribute))
    ),
    (geometry.morphTargetsRelative = packed.relative),
    packed.index && geometry.setIndex(new BufferAttribute(packed.index, 1)),
    packed.groups.forEach(
      ({ start, count, materialIndex }) =>
        void geometry.addGroup(start, count, materialIndex)
    ),
    geometry.computeBoundingBox(),
    geometry.computeBoundingSphere(),
    geometry
  ))(new BufferGeometry());

export var transferablesOf = (packed: PackedGeometry): ArrayBuffer[] => [
  ...new Set(
    [
      ...Object.values(packed.attributes),
      ...Object.values(packed.morphs).flat(),
    ]
      .map(({ array }) => array.buffer as ArrayBuffer)
      .concat(packed.index ? [packed.index.buffer as ArrayBuffer] : [])
  ),
];

export var packPaths = (paths: SvgPaths): PackedPaths =>
  Object.fromEntries(
    Object.entries(paths).map(({ 0: id, 1: path }) => [
      id,
      path.subPaths.map((subPath) => subPath.toJSON()),
    ])
  );

export var unpackPaths = (packed: PackedPaths): SvgPaths =>
  Object.fromEntries(
    Object.entries(packed).map(({ 0: id, 1: subPaths }) => [
      id,
      Object.assign(new ShapePath(), {
        subPaths: subPaths.map((json) => new Path().fromJSON(json)),
      }),
    ])
  );
