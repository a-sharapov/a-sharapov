import { describe, expect, test } from 'bun:test';
import {
  compileAside,
  compiledAside,
  pipelines,
} from '#lib/components/@Viewer/Scene/pipelines.ts';

type Promises = Promise<void>[] | null;

var _backend = () => {
  const calls: Promises[] = [];
  const done: (() => void)[] = [];
  const create = (_: unknown, promises: Promises) =>
    void (calls.push(promises),
    promises?.push(new Promise<void>((resolve) => void done.push(resolve))));
  return { calls, done, create };
};

describe('pipelines compiled aside', () => {
  test('while loading, a pipeline is requested asynchronously and counted until it is ready', async () => {
    const backend = _backend();
    const ready: number[] = [];
    const create = compiledAside(
      backend.create,
      () => true,
      () => void ready.push(pipelines.pending)
    );
    create({}, null);
    create({}, null);
    expect(backend.calls.every((promises) => Array.isArray(promises))).toBe(
      true
    );
    expect(pipelines.pending).toBe(2);
    backend.done.forEach((resolve) => void resolve());
    await Promise.resolve();
    await Promise.resolve();
    expect(pipelines.pending).toBe(0);
    expect(ready).toEqual([1, 0]);
  });

  test('outside loading, pipelines are built synchronously as before', () => {
    const backend = _backend();
    compiledAside(
      backend.create,
      () => false,
      () => undefined
    )({}, null);
    expect(backend.calls).toEqual([null]);
    expect(pipelines.pending).toBe(0);
  });

  test('compileAsync keeps its own promises', () => {
    const backend = _backend();
    const own: Promise<void>[] = [];
    compiledAside(
      backend.create,
      () => true,
      () => undefined
    )({}, own);
    expect(backend.calls[0]).toBe(own);
    expect(pipelines.pending).toBe(0);
  });

  test('a backend without parallel compilation finishes at once and leaves nothing pending', () => {
    const calls: Promises[] = [];
    compiledAside(
      (_, promises) => void calls.push(promises),
      () => true,
      () => undefined
    )({}, null);
    expect(calls).toEqual([[]]);
    expect(pipelines.pending).toBe(0);
  });

  test('only renders inside the animation loop go aside, one-shot bakes stay synchronous', async () => {
    const backend = _backend();
    const loops: ((time: number) => void)[] = [];
    const renderer = {
      backend: { createRenderPipeline: backend.create },
      setAnimationLoop: (callback: ((time: number) => void) | null) =>
        void (callback && loops.push(callback)),
    };
    const _build = () => renderer.backend.createRenderPipeline({}, null);
    compileAside(
      renderer as never,
      () => true,
      () => undefined
    );
    _build();
    renderer.setAnimationLoop(_build);
    loops.forEach((frame) => void frame(0));
    _build();
    expect(backend.calls.map((promises) => Array.isArray(promises))).toEqual([
      false,
      true,
      false,
    ]);
    expect(pipelines.pending).toBe(1);
    backend.done.forEach((resolve) => void resolve());
    await Promise.resolve();
    await Promise.resolve();
    expect(pipelines.pending).toBe(0);
  });
});
