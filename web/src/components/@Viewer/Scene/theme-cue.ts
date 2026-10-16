import { clamp, lerp } from '$lib/common/utils';

export type ThemeState = { ambient: number; power: number };

export type ThemeCue = ThemeState & { press: number; done: boolean };

export var THEME_CUE = {
  dusk: 1.4,
  click: 1.05,
  down: 0.07,
  up: 0.16,
  warm: 0.13,
  cool: 0.045,
  dawnDelay: 0.3,
  dawn: 1.35,
  quick: 0.4,
};

var _ease = (t: number) => ((k) => k * k * (3 - 2 * k))(clamp(t));

var _press = (x: number) =>
  x < 0
    ? 0
    : x < THEME_CUE.down
      ? _ease(x / THEME_CUE.down)
      : 1 - _ease((x - THEME_CUE.down) / THEME_CUE.up);

export var clickAt = (from: ThemeState, night: boolean): number | null =>
  night
    ? from.power < 0.99
      ? THEME_CUE.click
      : null
    : from.power > 0.01
      ? 0
      : null;

var _night = (from: ThemeState, t: number): ThemeCue =>
  ((click) => ({
    ambient: lerp(from.ambient, 1, _ease(t / THEME_CUE.dusk)),
    power:
      click === null || t < click + THEME_CUE.down
        ? from.power
        : 1 -
          (1 - from.power) *
            Math.exp(-(t - click - THEME_CUE.down) / THEME_CUE.warm),
    press: click === null ? 0 : _press(t - click),
    done:
      t >=
      Math.max(
        THEME_CUE.dusk,
        (click ?? 0) + THEME_CUE.down + THEME_CUE.up,
        (click ?? 0) + THEME_CUE.down + 7 * THEME_CUE.warm
      ),
  }))(clickAt(from, true));

var _day = (from: ThemeState, t: number): ThemeCue =>
  ((click) => ({
    ambient: lerp(
      from.ambient,
      0,
      _ease((t - THEME_CUE.dawnDelay) / THEME_CUE.dawn)
    ),
    power:
      click === null || t < THEME_CUE.down
        ? from.power
        : from.power * Math.exp(-(t - THEME_CUE.down) / THEME_CUE.cool),
    press: click === null ? 0 : _press(t),
    done: t >= THEME_CUE.dawnDelay + THEME_CUE.dawn,
  }))(clickAt(from, false));

var _quick = (from: ThemeState, night: boolean, t: number): ThemeCue =>
  ((k, target) => ({
    ambient: lerp(from.ambient, target, k),
    power: lerp(from.power, target, k),
    press: 0,
    done: t >= THEME_CUE.quick,
  }))(_ease(t / THEME_CUE.quick), night ? 1 : 0);

export var themeCue = (
  from: ThemeState,
  night: boolean,
  t: number,
  reduced = false
): ThemeCue =>
  ((cue) =>
    cue.done
      ? { ambient: night ? 1 : 0, power: night ? 1 : 0, press: 0, done: true }
      : cue)(
    reduced ? _quick(from, night, t) : night ? _night(from, t) : _day(from, t)
  );

export var dusk = (ambient: number) => Math.sin(Math.PI * clamp(ambient));
