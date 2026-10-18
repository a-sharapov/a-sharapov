import { isClient } from '#lib/common/utils.ts';
import { viewer } from './state.svelte';

var _IDLE = { timeout: 1000, delay: 40 };

var _NOOP = () => {};

var _later = (task: () => void): (() => void) =>
  !isClient
    ? _NOOP
    : typeof requestIdleCallback === 'function'
      ? (
          (id) => () =>
            cancelIdleCallback(id)
        )(requestIdleCallback(() => task(), { timeout: _IDLE.timeout }))
      : (
          (id) => () =>
            clearTimeout(id)
        )(setTimeout(task, _IDLE.delay));

type Drain = { cancel: () => void };

var _drain = (pending: Array<() => void>, state: Drain): void =>
  void (state.cancel =
    pending.length > 0
      ? _later(() => (pending.shift()!(), _drain(pending, state)))
      : _NOOP);

var _chain = (pending: Array<() => void>) =>
  ((state: Drain) => (_drain(pending, state), () => state.cancel()))({
    cancel: _NOOP,
  });

export var idleWhenSettled = (tasks: Array<() => void>) => {
  const pending = [...tasks];
  $effect(() =>
    viewer.phase === 'settled' && pending.length > 0
      ? _chain(pending)
      : undefined
  );
};
