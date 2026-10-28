import type { WebGPURenderer } from 'three/webgpu';

type Create = (renderObject: unknown, promises: Promise<void>[] | null) => void;

type Backend = { createRenderPipeline: Create };

type Frame = NonNullable<Parameters<WebGPURenderer['setAnimationLoop']>[0]>;

type Window = { on: boolean; patched: boolean };

export var pipelines = { pending: 0 };

export var compiledAside =
  (create: Create, aside: () => boolean, onReady: () => void): Create =>
  (renderObject, promises) =>
    promises !== null || !aside()
      ? create(renderObject, promises)
      : ((queue: Promise<void>[]) =>
          void (create(renderObject, queue),
          queue.forEach(
            (promise) =>
              void ((pipelines.pending += 1),
              promise.then(() => ((pipelines.pending -= 1), onReady())))
          )))([]);

var _inFrame =
  (callback: Frame, frame: Window, patch: () => void) =>
  (...args: Parameters<Frame>) => {
    void (frame.patched || (patch(), (frame.patched = true)));
    frame.on = true;
    try {
      callback(...args);
    } finally {
      frame.on = false;
    }
  };

export var compileAside = (
  renderer: WebGPURenderer,
  aside: () => boolean,
  onReady: () => void
) => {
  const frame: Window = { on: false, patched: false };
  const loop = renderer.setAnimationLoop.bind(renderer);
  const _patch = (backend: Backend) =>
    void (backend.createRenderPipeline = compiledAside(
      backend.createRenderPipeline.bind(backend),
      () => frame.on && aside(),
      onReady
    ));
  return Object.assign(renderer, {
    setAnimationLoop: (callback: Frame | null) =>
      loop(
        callback &&
          _inFrame(callback, frame, () =>
            _patch(renderer.backend as unknown as Backend)
          )
      ),
  });
};
