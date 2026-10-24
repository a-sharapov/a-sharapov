export type Mood = 'day' | 'night';

export type Placement = { pan: number; gain: number };

export type Lamp = Placement & { power: number };

export type Motion = 'start' | 'stop' | null;

export type MotionTracker = {
  step: (speed: number, delta: number) => Motion;
  reset: () => Motion;
  readonly moving: boolean;
};

export var dB = (value: number) => 10 ** (value / 20);

var _clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

var _smooth = (from: number, to: number, value: number) =>
  ((t) => t * t * (3 - 2 * t))(_clamp((value - from) / (to - from), 0, 1));

export var panOf = (ndcX: number) => _clamp(ndcX * 0.75, -0.8, 0.8);

export var distanceGain = (distance: number) =>
  _clamp(55 / Math.max(distance, 1), 0.55, 1.35);

export var crossed = (previous: number, next: number, at: number) =>
  previous < at && next >= at ? 1 : previous >= at && next < at ? -1 : 0;

export var createMotion = ({
  start,
  stop,
  peak,
  settle,
}: {
  start: number;
  stop: number;
  peak: number;
  settle: number;
}): MotionTracker => {
  const state = { moving: false, top: 0, still: 0 };
  const _begin = (speed: number): Motion =>
    speed > start
      ? (Object.assign(state, { moving: true, top: speed, still: 0 }), 'start')
      : null;
  const _follow = (speed: number, delta: number): Motion => (
    (state.top = Math.max(state.top, speed)),
    (state.still = speed < stop ? state.still + delta : 0),
    state.still >= settle
      ? ((state.moving = false), state.top >= peak ? 'stop' : null)
      : null
  );

  return {
    step: (speed, delta) =>
      state.moving ? _follow(speed, delta) : _begin(speed),
    reset: () => (
      Object.assign(state, { moving: false, top: 0, still: 0 }), null
    ),
    get moving() {
      return state.moving;
    },
  };
};

export var planeVoice = (speed: number) =>
  ((s) => ({
    gain: dB(-26) * s,
    frequency: 380 + 1250 * s,
    q: 1.3 - 0.55 * s,
    flutter: s * s,
  }))(_smooth(4, 90, speed));

export var rustleActivity = (rate: number, full: number) =>
  _clamp(Math.abs(rate) / full, 0, 1);

export type Contact = { event: 'lift' | 'land'; home: boolean } | null;

export var CONTACT_ENDS: [home: number, away: number] = [0.005, 0.995];

export var contact = (previous: number, next: number): Contact =>
  crossed(previous, next, CONTACT_ENDS[1]) === 1
    ? { event: 'land', home: false }
    : crossed(previous, next, CONTACT_ENDS[0]) === -1
      ? { event: 'land', home: true }
      : crossed(previous, next, CONTACT_ENDS[0]) === 1
        ? { event: 'lift', home: true }
        : crossed(previous, next, CONTACT_ENDS[1]) === -1
          ? { event: 'lift', home: false }
          : null;

export var AMBIENCE: Record<
  Mood,
  {
    lowpass: number;
    bed: number;
    air: number;
    wobble: number;
    room: number;
    roomLowpass: number;
    clock: number;
  }
> = {
  day: {
    lowpass: 640,
    bed: dB(-47),
    air: dB(-60),
    wobble: 0.12,
    room: dB(-34),
    roomLowpass: 9000,
    clock: 0,
  },
  night: {
    lowpass: 330,
    bed: dB(-48.5),
    air: 0,
    wobble: 0.08,
    room: dB(-34.5),
    roomLowpass: 3000,
    clock: dB(-44),
  },
};

export var CLOCK_PAN = -0.45;

export var LAMP_HUM = {
  level: dB(-61),
  mains: 100,
  harmonics: [1, 0.55, 0.32, 0.2, 0.12, 0.08, 0.05, 0.035, 0.025, 0.018],
  tremolo: { rate: 0.21, depth: 0.25 },
};

export var GRAIN_RATE = 110;

export var CRINKLE_RATE = 28;

export var grainCount = (
  activity: number,
  delta: number,
  random: number,
  rate = GRAIN_RATE
) =>
  ((expected) =>
    Math.floor(expected) + (random < expected - Math.floor(expected) ? 1 : 0))(
    activity * rate * delta
  );
