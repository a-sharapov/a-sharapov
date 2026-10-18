import type { WebGPURenderer } from 'three/webgpu';

export var IDLE_FPS = 30;

var _SLACK = 2;

type Loop = Parameters<WebGPURenderer['setAnimationLoop']>[0];
type Frame = NonNullable<Loop>;

export var throttled = (callback: Frame, still: () => boolean): Frame =>
  (
    (last) =>
    (...args: Parameters<Frame>) =>
      still() && args[0] - last.at < 1000 / IDLE_FPS - _SLACK
        ? undefined
        : ((last.at = args[0]), callback(...args))
  )({
    at: Number.NEGATIVE_INFINITY,
  });

export var throttleIdle = (renderer: WebGPURenderer, still: () => boolean) =>
  ((loop) =>
    Object.assign(renderer, {
      setAnimationLoop: (callback: Loop) =>
        loop(callback && throttled(callback, still)),
    }))(renderer.setAnimationLoop.bind(renderer));
