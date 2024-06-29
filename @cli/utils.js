import { $ } from "bun";

export var pipe =
  (...fns) =>
  (payload) =>
    fns.reduce(
      (value, fn) => (value instanceof Promise ? value.then(fn) : fn(value)),
      payload
    );

export var _clear = async () => await $`clear`;
export var _getLastUpdates = async () => await $`git pull origin`;
export var _dockerComposeUp = async () => await $`make run`;
export var _dockerComposeDown = async () => await $`make stop`;
export var _dockerRebuild = async () => await $`make rerun`;
export var _initialize = async () => await $`make init`;
export var _reloadProxy = async () => await $`make nginx-reload`;
