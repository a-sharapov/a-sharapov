export var GLITCH = {
  taps: 5,
  gap: 2,
  seconds: 5.5,
  pixel: 26,
  step: 0.07,
};

var _taps: number[] = [];

var _smooth = (from: number, to: number, x: number) =>
  ((t) => t * t * (3 - 2 * t))(
    Math.min(1, Math.max(0, (x - from) / (to - from)))
  );

export var tapCard = (now: number, idle = true): boolean =>
  ((chain) =>
    ((ready) => ((_taps = ready ? [] : chain), ready))(
      idle && chain.length >= GLITCH.taps
    ))(
    _taps.length && now - _taps[_taps.length - 1]! <= GLITCH.gap * 1000
      ? [..._taps, now]
      : [now]
  );

export var glitchAt = (seconds: number, reduced = false) =>
  ((fall) => ({
    pixel: 1 + (GLITCH.pixel - 1) * _smooth(0.4, 3.4, seconds) ** 2 * fall,
    glitch: reduced
      ? 0
      : _smooth(0, 0.5, seconds) *
        fall *
        (0.55 +
          0.45 *
            Math.max(0, Math.sin(seconds * 7.3) * Math.sin(seconds * 2.9 + 1))),
  }))(1 - _smooth(4.6, GLITCH.seconds, seconds));
