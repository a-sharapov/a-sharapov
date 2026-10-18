import type { Data3DTexture, DataTexture } from 'three';
import { isClient } from '#lib/common/utils.ts';
import {
  computePixels,
  type PixelJob,
  type Pixels,
  pixelKey,
} from './pixel-recipes';

type Filled = DataTexture | Data3DTexture;

type Request = { job: PixelJob; resolve: (pixels: Pixels) => void };

var _cache = new Map<string, Pixels | Promise<Pixels>>();
var _pending = new Map<number, Request>();
var _ids = { next: 0 };
var _state: { worker: Worker | null; failed: boolean } = {
  worker: null,
  failed: !isClient || typeof Worker === 'undefined',
};

var _answer = ({
  data: { id, pixels },
}: MessageEvent<{ id: number; pixels: Pixels }>) =>
  void (_pending.get(id)?.resolve(pixels), _pending.delete(id));

var _fallback = () =>
  void ((_state.failed = true),
  _state.worker?.terminate(),
  (_state.worker = null),
  _pending.forEach(({ job, resolve }) => void resolve(computePixels(job))),
  _pending.clear());

var _spawn = (): Worker =>
  (_state.worker ??= Object.assign(
    new Worker(new URL('./pixels.worker.ts', import.meta.url), {
      type: 'module',
    }),
    { onmessage: _answer, onerror: _fallback }
  ));

var _request = (job: PixelJob): Promise<Pixels> =>
  new Promise((resolve) =>
    ((id) => (
      _pending.set(id, { job, resolve }), _spawn().postMessage({ id, job })
    ))((_ids.next += 1))
  );

var _pixels = (job: PixelJob): Pixels | Promise<Pixels> =>
  ((key) =>
    _cache.get(key) ??
    ((pixels) => (_cache.set(key, pixels), pixels))(
      _state.failed ? computePixels(job) : _request(job)
    ))(pixelKey(job));

var _apply = <T extends Filled>(texture: T, pixels: Pixels): T => (
  (texture.image.data = pixels), (texture.needsUpdate = true), texture
);

export var fillPixels = <T extends Filled>(texture: T, job: PixelJob): T =>
  ((pixels) =>
    pixels instanceof Promise
      ? (void pixels.then((ready) => _apply(texture, ready)), texture)
      : _apply(texture, pixels))(_pixels(job));
