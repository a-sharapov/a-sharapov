import { isClient } from '#lib/common/utils.ts';
import { packPaths } from './geometry-pack';
import {
  GEOMETRY_RECIPES,
  type GeometryOf,
  type GeometryRecipe,
  unpackParts,
} from './geometry-recipes';
import { parseSvg } from './svg';
import penHolder from './svg/pen-holder.svg?raw';
import sketchbook from './svg/sketchbook.svg?raw';

var _SOURCES: Record<GeometryRecipe, string> = { sketchbook, penHolder };

var _OFF_THREAD = isClient && typeof Worker !== 'undefined';

var _ready = new Map<GeometryRecipe, unknown>();

var _state: { waiting: Promise<void> | null } = { waiting: null };

var _ask = (recipe: GeometryRecipe) =>
  new Promise<unknown>((resolve, reject) =>
    ((worker) => (
      (worker.onmessage = ({ data: { packed } }) =>
        void (resolve(unpackParts(packed)), worker.terminate())),
      (worker.onerror = (error) => void (reject(error), worker.terminate())),
      worker.postMessage({
        recipe,
        paths: packPaths(parseSvg(_SOURCES[recipe])),
      })
    ))(
      new Worker(new URL('./geometry.worker.ts', import.meta.url), {
        type: 'module',
      })
    )
  );

export var prepareGeometry = (): Promise<void> =>
  (_state.waiting ??= _OFF_THREAD
    ? Promise.all(
        (Object.keys(GEOMETRY_RECIPES) as GeometryRecipe[]).map((recipe) =>
          _ask(recipe).then(
            (parts) => void _ready.set(recipe, parts),
            () => undefined
          )
        )
      ).then(() => undefined)
    : Promise.resolve());

export var geometryOf = <R extends GeometryRecipe>(recipe: R): GeometryOf<R> =>
  ((parts) => (_ready.delete(recipe), parts as GeometryOf<R>))(
    _ready.get(recipe) ?? GEOMETRY_RECIPES[recipe](parseSvg(_SOURCES[recipe]))
  );
