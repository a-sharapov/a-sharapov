import type { BufferGeometry } from 'three';
import {
  type PackedGeometry,
  packGeometry,
  transferablesOf,
  unpackGeometry,
} from './geometry-pack';
import { buildPenHolderGeometry } from './pen-holder-geometry';
import { buildSketchbookGeometry } from './sketchbook-geometry';

export var GEOMETRY_RECIPES = {
  sketchbook: buildSketchbookGeometry,
  penHolder: buildPenHolderGeometry,
};

export type GeometryRecipe = keyof typeof GEOMETRY_RECIPES;

export type GeometryOf<R extends GeometryRecipe> = ReturnType<
  (typeof GEOMETRY_RECIPES)[R]
>;

type Packed = Record<string, PackedGeometry | PackedGeometry[]>;

export var packParts = (
  parts: Record<string, BufferGeometry | BufferGeometry[]>
): Packed =>
  Object.fromEntries(
    Object.entries(parts).map(({ 0: name, 1: part }) => [
      name,
      Array.isArray(part) ? part.map(packGeometry) : packGeometry(part),
    ])
  );

export var unpackParts = (packed: Packed) =>
  Object.fromEntries(
    Object.entries(packed).map(({ 0: name, 1: part }) => [
      name,
      Array.isArray(part) ? part.map(unpackGeometry) : unpackGeometry(part),
    ])
  );

export var partsTransfer = (packed: Packed): ArrayBuffer[] =>
  Object.values(packed).flatMap((part) =>
    (Array.isArray(part) ? part : [part]).flatMap(transferablesOf)
  );
