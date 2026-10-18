import { type PackedPaths, unpackPaths } from './geometry-pack';
import {
  GEOMETRY_RECIPES,
  type GeometryRecipe,
  packParts,
  partsTransfer,
} from './geometry-recipes';

addEventListener(
  'message',
  ({
    data: { recipe, paths },
  }: MessageEvent<{ recipe: GeometryRecipe; paths: PackedPaths }>) =>
    ((packed) => postMessage({ packed }, { transfer: partsTransfer(packed) }))(
      packParts(GEOMETRY_RECIPES[recipe](unpackPaths(paths)))
    )
);
