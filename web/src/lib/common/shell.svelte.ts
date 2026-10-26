import { SCENE_MEDIA, STORAGE } from './constants';
import { probeDevice, weakDevice } from './graphics';
import type { SceneMode, Theme } from './types';
import { isClient } from './utils';

type ThemeState = { theme: Theme; until: number };

var _HOLD = 12 * 36e5;
var _LATE = 1e3;
var _TIMER_MAX = 2 ** 31 - 1;

const _root = (): HTMLElement | null =>
  isClient ? document.documentElement : null;

const _store = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

const _read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const _FORCED =
  import.meta.env.DEV && isClient
    ? new URLSearchParams(location.search).get('gpu')
    : null;

const _choosing = (): boolean =>
  isClient &&
  matchMedia(SCENE_MEDIA).matches &&
  (_FORCED === 'weak' ||
    (_FORCED === null &&
      _read(STORAGE.scene) === null &&
      weakDevice(probeDevice())));

const _mark = (scene: string | null): void =>
  ((root) =>
    void (
      root &&
      (scene === null
        ? delete root.dataset.scene
        : (root.dataset.scene = scene))
    ))(_root());

export var shell = $state({
  theme: (_root()?.dataset.theme ?? 'light') as Theme,
  sound: false,
  scene: (_root()?.dataset.scene === 'video' ? 'video' : '3d') as SceneMode,
  choosing: _choosing(),
});

void (shell.choosing && _mark('choose'));

const _resolve = (): ThemeState =>
  (isClient && (window as { __asTheme?: () => ThemeState }).__asTheme?.()) || {
    theme: shell.theme,
    until: Date.now() + _HOLD,
  };

const _apply = (theme: Theme): void => {
  shell.theme = theme;
  ((root) => void (root && (root.dataset.theme = theme)))(_root());
};

export var setTheme = (theme: Theme): void => (
  _store(STORAGE.theme, `${theme}@${_resolve().until}`), _apply(theme)
);

export var followDaylight = (): (() => void) => {
  const timer = { id: undefined as ReturnType<typeof setTimeout> | undefined };
  const _tick = (): void => {
    const { theme, until } = _resolve();
    clearTimeout(timer.id);
    void (theme === shell.theme || _apply(theme));
    timer.id = setTimeout(
      _tick,
      Math.min(Math.max(until - Date.now(), 0) + _LATE, _TIMER_MAX)
    );
  };
  const _visible = (): void =>
    void (document.visibilityState === 'visible' && _tick());
  return (
    _tick(),
    document.addEventListener('visibilitychange', _visible),
    () => (
      clearTimeout(timer.id),
      document.removeEventListener('visibilitychange', _visible)
    )
  );
};

export var setScene = (scene: SceneMode): void => {
  shell.scene = scene;
  _store(STORAGE.scene, scene);
  _mark(scene === 'video' ? 'video' : null);
};

export var chooseScene = (scene: SceneMode): void => (
  (shell.choosing = false),
  setScene(scene),
  (window as { __asWatch?: () => void }).__asWatch?.()
);

export var restoreSound = (): boolean =>
  (shell.sound = isClient && _read(STORAGE.sound) === 'on');

export var setSound = (on: boolean): void => {
  shell.sound = on;
  _store(STORAGE.sound, on ? 'on' : 'off');
};
