import { CanvasTexture, SRGBColorSpace } from 'three';
import { isClient } from '#lib/common/utils.ts';
import { softCanvas } from '../textures';
import { sheet } from './canvas';
import {
  drawSketchPage,
  loadSketchHand,
  type Side,
  SKETCH_PAGE_SIZE,
  sketchHandReady,
  sketchPageSteps,
} from './pages';

type Reply = { id: number; bitmap?: ImageBitmap; error?: string };

type Request = {
  resolve: (bitmap: ImageBitmap) => void;
  reject: (error: Error) => void;
};

var _pending = new Map<number, Request>();
var _ids = { next: 0 };
var _state: { worker: Worker | null; failed: boolean } = {
  worker: null,
  failed:
    !isClient ||
    typeof Worker === 'undefined' ||
    typeof OffscreenCanvas === 'undefined',
};

var _settle = ({ data: { id, bitmap, error } }: MessageEvent<Reply>) =>
  void (_pending.get(id) &&
    (bitmap
      ? _pending.get(id)!.resolve(bitmap)
      : _pending.get(id)!.reject(new Error(error ?? 'sketch page failed'))),
  _pending.delete(id),
  _pending.size === 0 && (_state.worker?.terminate(), (_state.worker = null)));

var _fail = () =>
  void ((_state.failed = true),
  _state.worker?.terminate(),
  (_state.worker = null),
  _pending.forEach(
    ({ reject }) => void reject(new Error('sketch worker failed'))
  ),
  _pending.clear());

var _spawn = (): Worker =>
  (_state.worker ??= Object.assign(
    new Worker(new URL('./pages.worker.ts', import.meta.url), {
      type: 'module',
    }),
    { onmessage: _settle, onerror: _fail }
  ));

var _request = (side: Side): Promise<ImageBitmap> =>
  new Promise((resolve, reject) =>
    ((id) => (
      _pending.set(id, { resolve, reject }), _spawn().postMessage({ id, side })
    ))((_ids.next += 1))
  );

var _copy = (texture: CanvasTexture, source: CanvasImageSource) =>
  void ((texture.image as HTMLCanvasElement)
    .getContext('2d')!
    .drawImage(source, 0, 0),
  (texture.needsUpdate = true));

var _paintHere = (texture: CanvasTexture, side: Side) =>
  void (_copy(texture, drawSketchPage(side)),
  sketchHandReady() ||
    void loadSketchHand().then(
      () => _copy(texture, drawSketchPage(side)),
      () => undefined
    ));

export var createSketchPageTexture = () =>
  Object.assign(new CanvasTexture(softCanvas(...SKETCH_PAGE_SIZE)), {
    colorSpace: SRGBColorSpace,
    anisotropy: 16,
  });

var _offThread = (texture: CanvasTexture, side: Side) => {
  const state = {
    page: null as Promise<ImageBitmap | null> | null,
    shown: false,
  };
  const ask = () =>
    (state.page ??= _request(side).then(
      (bitmap) => bitmap,
      () => null
    ));
  const show = () =>
    void (
      state.shown ||
      ((state.shown = true),
      ask().then((bitmap) =>
        bitmap
          ? (_copy(texture, bitmap), bitmap.close())
          : _paintHere(texture, side)
      ))
    );
  const finish = () =>
    void (state.shown || ((state.shown = true), _paintHere(texture, side)));
  return { tasks: [show], finish };
};

var _inPlace = (texture: CanvasTexture, side: Side) => {
  const canvas = sheet(...SKETCH_PAGE_SIZE);
  const steps = [
    ...sketchPageSteps(canvas, side),
    () =>
      void (_copy(texture, canvas),
      sketchHandReady() ||
        void loadSketchHand().then(
          () => _copy(texture, drawSketchPage(side)),
          () => undefined
        )),
  ];
  const state = { done: 0 };
  const next = () =>
    void (
      state.done < steps.length && (steps[state.done]!(), (state.done += 1))
    );
  return {
    tasks: steps.map(() => next),
    finish: () => steps.slice(state.done).forEach(next),
  };
};

export var sketchPagePainter = (texture: CanvasTexture, side: Side) =>
  _state.failed ? _inPlace(texture, side) : _offThread(texture, side);
