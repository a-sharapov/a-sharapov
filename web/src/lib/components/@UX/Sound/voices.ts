import {
  AMBIENCE,
  CLOCK_PAN,
  CRINKLE_RATE,
  dB,
  GRAIN_RATE,
  grainCount,
  LAMP_HUM,
  type Lamp,
  type Mood,
  type Placement,
} from './cues';
import {
  type Bank,
  CLOCK_LOOP,
  type Clip,
  JITTER,
  jitter,
  jitterGain,
  pickClip,
  ROOM_LOOP,
  SAMPLE_CUES,
  type SampleCue,
} from './samples';

export type Noise = {
  white: AudioBuffer;
  pink: AudioBuffer;
  brown: AudioBuffer;
};

export type Voice = {
  ctx: BaseAudioContext;
  out: AudioNode;
  noise: Noise;
  bank: Bank;
};

type Envelope = { attack: number; peak: number; decay: number; hold?: number };

type Partials = { frequencies: number[]; amps: number[]; decays: number[] };

export type Cue =
  | 'paperLift'
  | 'bookLift'
  | 'tabletLift'
  | 'paperPat'
  | 'bookPat'
  | 'tabletPat'
  | 'planePat'
  | 'planeLaunch'
  | 'strap'
  | 'coverOpen'
  | 'coverClose'
  | 'click'
  | 'flick'
  | 'slide'
  | 'tap'
  | 'penTock'
  | 'pencilTock'
  | 'stylusTock'
  | 'clink'
  | 'tone';

var _seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

var _SHAPES: Record<keyof Noise, (white: () => number) => () => number> = {
  white: (white) => white,
  pink: (white) =>
    (
      (b) => () =>
        ((w) => (
          (b[0] = 0.99886 * b[0]! + w * 0.0555179),
          (b[1] = 0.99332 * b[1]! + w * 0.0750759),
          (b[2] = 0.969 * b[2]! + w * 0.153852),
          (b[3] = 0.8665 * b[3]! + w * 0.3104856),
          (b[4] = 0.55 * b[4]! + w * 0.5329522),
          (b[5] = -0.7616 * b[5]! - w * 0.016898),
          ((sum) => ((b[6] = w * 0.115926), sum))(
            b[0]! + b[1]! + b[2]! + b[3]! + b[4]! + b[5]! + b[6]! + w * 0.5362
          )
        ))(white())
    )([0, 0, 0, 0, 0, 0, 0]),
  brown: (white) =>
    ((last) => () => ((last[0] = (last[0]! + 0.02 * white()) / 1.02), last[0]))(
      [0]
    ),
};

var _FADE = 0.08;

var _buffer = (
  ctx: BaseAudioContext,
  kind: keyof Noise,
  seconds: number,
  seed: number
) => {
  const random = _seeded(seed);
  const next = _SHAPES[kind](() => random() * 2 - 1);
  const length = Math.round(ctx.sampleRate * seconds);
  const fade = Math.round(ctx.sampleRate * _FADE);
  const raw = Float32Array.from({ length: length + fade }, next);
  const mean = raw.reduce((sum, value) => sum + value, 0) / raw.length;
  const data = Float32Array.from({ length }, (_, i) =>
    i < fade
      ? (raw[i]! - mean) * (i / fade) +
        (raw[length + i]! - mean) * (1 - i / fade)
      : raw[i]! - mean
  );
  const rms = Math.sqrt(
    data.reduce((sum, value) => sum + value * value, 0) / data.length
  );
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  buffer.getChannelData(0).set(data.map((value) => (value / rms) * 0.25));
  return buffer;
};

export var createNoise = (ctx: BaseAudioContext): Noise => ({
  white: _buffer(ctx, 'white', 2, 11),
  pink: _buffer(ctx, 'pink', 3, 23),
  brown: _buffer(ctx, 'brown', 5, 37),
});

var _chain = (...nodes: AudioNode[]) =>
  nodes.reduce((from, to) => (from.connect(to), to));

var _filter = (
  ctx: BaseAudioContext,
  type: BiquadFilterType,
  frequency: number,
  q = 0.7
) =>
  ((filter) => (
    (filter.type = type),
    filter.frequency.setValueAtTime(frequency, 0),
    filter.Q.setValueAtTime(q, 0),
    filter
  ))(ctx.createBiquadFilter());

var _gainTo = (ctx: BaseAudioContext, value: number, to: AudioNode) =>
  ((gain) => (gain.gain.setValueAtTime(value, 0), gain.connect(to), gain))(
    ctx.createGain()
  );

var _envelope = (
  ctx: BaseAudioContext,
  at: number,
  { attack, peak, decay, hold = 0 }: Envelope
) =>
  ((gain) => (
    gain.gain.setValueAtTime(0, at),
    gain.gain.linearRampToValueAtTime(peak, at + attack),
    gain.gain.setValueAtTime(peak, at + attack + hold),
    gain.gain.setTargetAtTime(0, at + attack + hold, decay / 4),
    gain
  ))(ctx.createGain());

var _end = ({ attack, decay, hold = 0 }: Envelope) =>
  attack + hold + decay * 1.6;

var _noise = (
  { ctx, noise }: Voice,
  kind: keyof Noise,
  at: number,
  seconds: number
) =>
  ((source) => (
    (source.buffer = noise[kind]),
    source.start(
      at,
      Math.random() * Math.max(0, noise[kind].duration - seconds - 0.05)
    ),
    source.stop(at + seconds + 0.02),
    source
  ))(ctx.createBufferSource());

var _tone = (
  ctx: BaseAudioContext,
  at: number,
  seconds: number,
  frequency: number,
  type: OscillatorType = 'sine'
) =>
  ((oscillator) => (
    (oscillator.type = type),
    oscillator.frequency.setValueAtTime(frequency, at),
    oscillator.start(at),
    oscillator.stop(at + seconds + 0.02),
    oscillator
  ))(ctx.createOscillator());

var _bus = ({ ctx, out }: Voice, at: number, { pan, gain }: Placement) =>
  ((panner, level) => (
    panner.pan.setValueAtTime(pan, at),
    level.gain.setValueAtTime(gain, at),
    _chain(panner, level, out),
    panner
  ))(ctx.createStereoPanner(), ctx.createGain());

var _layer = (
  voice: Voice,
  input: AudioNode,
  at: number,
  kind: keyof Noise,
  filters: AudioNode[],
  envelope: Envelope
) =>
  ((seconds) =>
    _chain(
      _noise(voice, kind, at, seconds),
      ...filters,
      _envelope(voice.ctx, at, envelope),
      input
    ))(_end(envelope));

var _grains = (
  voice: Voice,
  input: AudioNode,
  at: number,
  {
    count,
    spread,
    band,
    q,
    length,
    level,
  }: {
    count: number;
    spread: number;
    band: [number, number];
    q: number;
    length: [number, number];
    level: number;
  }
) =>
  Array.from({ length: count }, () =>
    ((start, seconds) =>
      _layer(
        voice,
        input,
        start,
        'white',
        [
          _filter(
            voice.ctx,
            'bandpass',
            band[0] * (band[1] / band[0]) ** Math.random(),
            q
          ),
        ],
        {
          attack: 0.0015,
          peak: level * (0.35 + 0.65 * Math.random()),
          decay: seconds,
        }
      ))(
      at + spread * Math.random() ** 1.6,
      length[0] + (length[1] - length[0]) * Math.random()
    )
  );

var _partials = (
  voice: Voice,
  input: AudioNode,
  at: number,
  { frequencies, amps, decays }: Partials,
  level: number
) =>
  frequencies.map((frequency, i) =>
    ((envelope) =>
      _chain(
        _tone(voice.ctx, at, _end(envelope), frequency),
        _envelope(voice.ctx, at, envelope),
        input
      ))({ attack: 0.0008, peak: level * amps[i]!, decay: decays[i]! })
  );

var _transient = (
  voice: Voice,
  input: AudioNode,
  at: number,
  cutoff: number,
  level: number,
  decay = 0.004
) =>
  _layer(
    voice,
    input,
    at,
    'white',
    [_filter(voice.ctx, 'highpass', cutoff, 0.7)],
    { attack: 0.0005, peak: level, decay }
  );

var _thump = (
  voice: Voice,
  input: AudioNode,
  at: number,
  frequency: number,
  level: number,
  decay: number
) =>
  ((oscillator, envelope) => (
    oscillator.frequency.setValueAtTime(frequency * 1.35, at),
    oscillator.frequency.exponentialRampToValueAtTime(frequency, at + 0.018),
    _chain(oscillator, _envelope(voice.ctx, at, envelope), input),
    _layer(
      voice,
      input,
      at,
      'brown',
      [_filter(voice.ctx, 'lowpass', frequency * 3, 0.7)],
      { attack: 0.002, peak: level * 1.4, decay: decay * 0.6 }
    )
  ))(_tone(voice.ctx, at, decay * 1.7, frequency), {
    attack: 0.002,
    peak: level,
    decay,
  });

var _slide = (
  voice: Voice,
  input: AudioNode,
  at: number,
  center: number,
  q: number,
  envelope: Envelope
) =>
  _layer(
    voice,
    input,
    at,
    'pink',
    [_filter(voice.ctx, 'bandpass', center, q)],
    envelope
  );

var _pat = (
  voice: Voice,
  input: AudioNode,
  at: number,
  { low, thump, slap }: { low: number; thump: number; slap: number }
) => (
  _thump(voice, input, at, low, thump, 0.085),
  _layer(
    voice,
    input,
    at + 0.002,
    'white',
    [_filter(voice.ctx, 'highpass', 1700, 0.7)],
    { attack: 0.001, peak: slap, decay: 0.03 }
  )
);

var _CERAMIC: Partials = {
  frequencies: [1870, 2960, 4630, 6900],
  amps: [1, 0.7, 0.45, 0.25],
  decays: [0.26, 0.19, 0.13, 0.08],
};

var _PLATINUM: Partials = {
  frequencies: [2650, 4120, 6380, 8900],
  amps: [1, 0.6, 0.35, 0.2],
  decays: [0.12, 0.08, 0.05, 0.03],
};

var _ALUMINIUM: Partials = {
  frequencies: [3300, 5600],
  amps: [1, 0.5],
  decays: [0.06, 0.04],
};

var _WIRE: Partials = {
  frequencies: [3150, 4870, 7020],
  amps: [1, 0.5, 0.25],
  decays: [0.05, 0.035, 0.02],
};

var _bounce = (
  play: (at: number, level: number) => unknown,
  at: number,
  level: number
) => (play(at, level), play(at + 0.065 + Math.random() * 0.03, level * 0.32));

var _press = (voice: Voice, input: AudioNode, at: number, ring: number) => (
  _transient(voice, input, at, 1200, 0.9),
  _chain(
    _noise(voice, 'white', at, 0.06),
    _filter(voice.ctx, 'bandpass', ring, 16),
    _envelope(voice.ctx, at, { attack: 0.0005, peak: 4, decay: 0.03 }),
    input
  ),
  _chain(
    _tone(voice.ctx, at, 0.05, 185),
    _envelope(voice.ctx, at, { attack: 0.001, peak: 0.35, decay: 0.03 }),
    input
  )
);

var _VOICES: Record<
  Cue,
  {
    level: number;
    play: (voice: Voice, input: AudioNode, at: number) => unknown;
  }
> = {
  paperLift: {
    level: dB(-24),
    play: (voice, input, at) => (
      _slide(voice, input, at, 2600, 0.6, {
        attack: 0.05,
        peak: 0.5,
        hold: 0.08,
        decay: 0.3,
      }),
      _grains(voice, input, at, {
        count: 12,
        spread: 0.35,
        band: [2000, 7500],
        q: 2.5,
        length: [0.008, 0.026],
        level: 0.9,
      })
    ),
  },
  bookLift: {
    level: dB(-23),
    play: (voice, input, at) => (
      _slide(voice, input, at, 1300, 0.7, {
        attack: 0.06,
        peak: 0.6,
        hold: 0.1,
        decay: 0.28,
      }),
      _grains(voice, input, at, {
        count: 4,
        spread: 0.25,
        band: [1500, 5000],
        q: 2,
        length: [0.01, 0.02],
        level: 0.6,
      })
    ),
  },
  tabletLift: {
    level: dB(-25),
    play: (voice, input, at) =>
      _slide(voice, input, at, 950, 0.8, {
        attack: 0.07,
        peak: 0.6,
        hold: 0.1,
        decay: 0.25,
      }),
  },
  paperPat: {
    level: dB(-23),
    play: (voice, input, at) =>
      _pat(voice, input, at, { low: 125, thump: 0.7, slap: 0.55 }),
  },
  bookPat: {
    level: dB(-23),
    play: (voice, input, at) =>
      _pat(voice, input, at, { low: 88, thump: 1, slap: 0.35 }),
  },
  tabletPat: {
    level: dB(-23),
    play: (voice, input, at) => (
      _pat(voice, input, at, { low: 98, thump: 0.9, slap: 0.15 }),
      _partials(voice, input, at, _ALUMINIUM, 0.06)
    ),
  },
  planePat: {
    level: dB(-25),
    play: (voice, input, at) =>
      _pat(voice, input, at, { low: 170, thump: 0.25, slap: 0.6 }),
  },
  planeLaunch: {
    level: dB(-24),
    play: (voice, input, at) =>
      _layer(
        voice,
        input,
        at,
        'pink',
        [_filter(voice.ctx, 'bandpass', 1400, 0.9)],
        { attack: 0.015, peak: 0.8, decay: 0.14 }
      ),
  },
  strap: {
    level: dB(-29),
    play: (voice, input, at) =>
      ((oscillator) => (
        oscillator.frequency.setValueAtTime(390, at),
        oscillator.frequency.exponentialRampToValueAtTime(125, at + 0.07),
        _chain(
          oscillator,
          _envelope(voice.ctx, at, { attack: 0.002, peak: 0.8, decay: 0.12 }),
          input
        ),
        _transient(voice, input, at, 3000, 0.5, 0.012)
      ))(_tone(voice.ctx, at, 0.2, 390, 'triangle')),
  },
  coverOpen: {
    level: dB(-27),
    play: (voice, input, at) => (
      _slide(voice, input, at, 1700, 0.7, {
        attack: 0.04,
        peak: 0.6,
        hold: 0.12,
        decay: 0.3,
      }),
      _grains(voice, input, at, {
        count: 6,
        spread: 0.4,
        band: [1500, 6000],
        q: 2,
        length: [0.01, 0.024],
        level: 0.6,
      })
    ),
  },
  coverClose: {
    level: dB(-25),
    play: (voice, input, at) =>
      _pat(voice, input, at, { low: 105, thump: 0.6, slap: 0.4 }),
  },
  click: {
    level: dB(-22),
    play: (voice, input, at) => (
      _press(voice, input, at, 2350),
      _press(voice, _gainTo(voice.ctx, 0.45, input), at + 0.085, 2900)
    ),
  },
  flick: {
    level: dB(-21),
    play: (voice, input, at) =>
      ((filter) => (
        filter.frequency.setValueAtTime(650, at),
        filter.frequency.exponentialRampToValueAtTime(1900, at + 0.16),
        _chain(
          _noise(voice, 'pink', at, 0.32),
          filter,
          _envelope(voice.ctx, at, { attack: 0.025, peak: 1, decay: 0.18 }),
          input
        ),
        _transient(voice, input, at, 2500, 0.3, 0.006)
      ))(_filter(voice.ctx, 'bandpass', 650, 1.2)),
  },
  slide: {
    level: dB(-33),
    play: (voice, input, at) =>
      _layer(
        voice,
        input,
        at,
        'white',
        [
          _filter(voice.ctx, 'highpass', 3500, 0.7),
          _filter(voice.ctx, 'bandpass', 6000, 0.7),
        ],
        { attack: 0.012, peak: 1, hold: 0.05, decay: 0.12 }
      ),
  },
  tap: {
    level: dB(-29),
    play: (voice, input, at) => (
      _partials(voice, input, at, _WIRE, 0.35),
      _transient(voice, input, at, 1800, 0.5, 0.01)
    ),
  },
  penTock: {
    level: dB(-27),
    play: (voice, input, at) =>
      _bounce(
        (when, level) => (
          _partials(voice, input, when, _PLATINUM, 0.3 * level),
          _transient(voice, input, when, 2000, 0.8 * level)
        ),
        at,
        1
      ),
  },
  pencilTock: {
    level: dB(-23),
    play: (voice, input, at) =>
      _bounce(
        (when, level) => (
          _layer(
            voice,
            input,
            when,
            'white',
            [_filter(voice.ctx, 'bandpass', 1150, 3)],
            { attack: 0.0008, peak: 2.2 * level, decay: 0.03 }
          ),
          _chain(
            _tone(voice.ctx, when, 0.05, 540),
            _envelope(voice.ctx, when, {
              attack: 0.001,
              peak: 0.25 * level,
              decay: 0.025,
            }),
            input
          )
        ),
        at,
        1
      ),
  },
  stylusTock: {
    level: dB(-26),
    play: (voice, input, at) =>
      _bounce(
        (when, level) => (
          _partials(voice, input, when, _ALUMINIUM, 0.3 * level),
          _transient(voice, input, when, 2200, 0.7 * level)
        ),
        at,
        1
      ),
  },
  clink: {
    level: dB(-28),
    play: (voice, input, at) => (
      _partials(voice, input, at, _CERAMIC, 0.3),
      _transient(voice, input, at, 2500, 0.7, 0.003)
    ),
  },
  tone: {
    level: dB(-44),
    play: (voice, input, at) =>
      ((lowpass) => (
        _chain(lowpass, input),
        [1046.5, 1568].map((frequency, i) =>
          _chain(
            _tone(voice.ctx, at, 0.9, frequency),
            _envelope(voice.ctx, at, {
              attack: 0.035,
              peak: i ? 0.45 : 1,
              decay: 0.7,
            }),
            lowpass
          )
        )
      ))(_filter(voice.ctx, 'lowpass', 3000, 0.5)),
  },
};

export var CUES = Object.keys(_VOICES) as Cue[];

var _playClip = (
  voice: Voice,
  spec: SampleCue,
  clip: Clip,
  at: number,
  placement: Placement
) =>
  ((source) => (
    (source.buffer = clip.buffer),
    source.playbackRate.setValueAtTime(
      (spec.rate ?? 1) * jitter(Math.random(), JITTER.rate),
      at
    ),
    source.connect(
      _bus(voice, at, {
        ...placement,
        gain: placement.gain * spec.level * jitterGain(Math.random()),
      })
    ),
    source.start(at, clip.offset),
    source
  ))(voice.ctx.createBufferSource());

var _synth = (voice: Voice, cue: Cue, at: number, placement: Placement) =>
  ((voiceSpec) =>
    voiceSpec.play(
      voice,
      _bus(voice, at, { ...placement, gain: placement.gain * voiceSpec.level }),
      at
    ))(_VOICES[cue]);

export var playCue = (
  voice: Voice,
  cue: Cue,
  at: number,
  placement: Placement
) =>
  ((spec) =>
    ((clips) =>
      spec && clips?.length
        ? _playClip(voice, spec, pickClip(clips, Math.random()), at, placement)
        : _synth(voice, cue, at, placement))(
      spec && voice.bank.get(spec.sample)
    ))(SAMPLE_CUES[cue]);

var _target = (param: AudioParam, value: number, at: number, lag: number) =>
  param.setTargetAtTime(value, at, lag);

var _loop = ({ ctx, noise }: Voice, kind: keyof Noise, at: number) =>
  ((source) => (
    Object.assign(source, { buffer: noise[kind], loop: true }),
    source.start(at, Math.random() * noise[kind].duration),
    source
  ))(ctx.createBufferSource());

var _sampleLoop = (
  ctx: BaseAudioContext,
  clip: Clip,
  window: { start: number; length: number },
  when: number
) =>
  ((source) => (
    Object.assign(source, {
      buffer: clip.buffer,
      loop: true,
      loopStart: window.start,
      loopEnd: window.start + window.length,
    }),
    source.start(when, window.start + Math.random() * window.length),
    source
  ))(ctx.createBufferSource());

var _humTone = (ctx: BaseAudioContext, at: number) =>
  ((oscillator) => (
    oscillator.setPeriodicWave(
      ctx.createPeriodicWave(
        new Float32Array(LAMP_HUM.harmonics.length + 1),
        Float32Array.of(0, ...LAMP_HUM.harmonics)
      )
    ),
    oscillator
  ))(_tone(ctx, at, 1e6, LAMP_HUM.mains));

export var createAmbience = (voice: Voice, mood: Mood, at = 0) => {
  const { ctx, out } = voice;
  const settings = AMBIENCE[mood];
  const lowpass = _filter(ctx, 'lowpass', settings.lowpass, 0.5);
  const bed = ctx.createGain();
  const air = ctx.createGain();
  const wobble = ctx.createGain();
  const lfo = _tone(ctx, at, 1e6, 0.05);
  bed.gain.setValueAtTime(settings.bed, at);
  air.gain.setValueAtTime(settings.air, at);
  wobble.gain.setValueAtTime(settings.bed * settings.wobble, at);
  _chain(lfo, wobble);
  wobble.connect(bed.gain);
  _chain(
    _loop(voice, 'brown', at),
    lowpass,
    _filter(ctx, 'highpass', 35, 0.6),
    bed,
    out
  );
  _chain(
    _loop(voice, 'pink', at),
    _filter(ctx, 'bandpass', 3200, 0.45),
    air,
    out
  );
  const room = ctx.createGain();
  const roomLowpass = _filter(ctx, 'lowpass', settings.roomLowpass, 0.5);
  const state = { mood, real: false };
  room.gain.setValueAtTime(0, at);
  _chain(roomLowpass, room, out);
  const clock = ctx.createGain();
  clock.gain.setValueAtTime(settings.clock, at);
  _chain(clock, _bus(voice, at, { pan: CLOCK_PAN, gain: 1 }));
  const hum = ctx.createGain();
  const humPan = ctx.createStereoPanner();
  const tremolo = ctx.createGain();
  const tremoloDepth = ctx.createGain();
  hum.gain.setValueAtTime(0, at);
  tremoloDepth.gain.setValueAtTime(LAMP_HUM.tremolo.depth, at);
  _chain(_tone(ctx, at, 1e6, LAMP_HUM.tremolo.rate), tremoloDepth);
  tremoloDepth.connect(tremolo.gain);
  _chain(_humTone(ctx, at), tremolo, hum, humPan, out);
  const _synthGain = (target: (typeof AMBIENCE)[Mood], when: number) => (
    _target(bed.gain, state.real ? 0 : target.bed, when, 0.8),
    _target(air.gain, state.real ? 0 : target.air, when, 0.8),
    _target(wobble.gain, state.real ? 0 : target.bed * target.wobble, when, 0.8)
  );
  return {
    mood: (next: Mood, when: number) =>
      ((target) => (
        (state.mood = next),
        _target(lowpass.frequency, target.lowpass, when, 0.8),
        _target(roomLowpass.frequency, target.roomLowpass, when, 0.8),
        _target(room.gain, state.real ? target.room : 0, when, 0.8),
        _target(clock.gain, target.clock, when, 0.8),
        _synthGain(target, when)
      ))(AMBIENCE[next]),
    lamp: ({ power, pan, gain }: Lamp, when: number) => (
      _target(hum.gain, power * gain * LAMP_HUM.level, when, 0.05),
      _target(humPan.pan, pan, when, 0.1)
    ),
    room: (clip: Clip, when: number) =>
      ((target) => (
        _sampleLoop(ctx, clip, ROOM_LOOP, when).connect(roomLowpass),
        (state.real = true),
        _target(room.gain, target.room, when, 0.8),
        _synthGain(target, when)
      ))(AMBIENCE[state.mood]),
    clock: (clip: Clip, when: number) =>
      void _sampleLoop(ctx, clip, CLOCK_LOOP, when).connect(clock),
  };
};

export type WhooshState = {
  gain: number;
  frequency: number;
  q: number;
  flutter: number;
  pan: number;
};

export var createWhoosh = (voice: Voice, at = 0) => {
  const { ctx, out } = voice;
  const band = _filter(ctx, 'bandpass', 400, 1.2);
  const level = ctx.createGain();
  const flutter = ctx.createGain();
  const flutterDepth = ctx.createGain();
  const panner = ctx.createStereoPanner();
  const lfo = _tone(ctx, at, 1e6, 15, 'triangle');
  level.gain.setValueAtTime(0, at);
  flutter.gain.setValueAtTime(0, at);
  flutterDepth.gain.setValueAtTime(0, at);
  _chain(_loop(voice, 'pink', at), band, level, panner, out);
  _chain(
    _loop(voice, 'white', at),
    _filter(ctx, 'bandpass', 2600, 0.9),
    flutter,
    panner
  );
  _chain(lfo, flutterDepth);
  flutterDepth.connect(flutter.gain);
  return {
    update: (state: WhooshState, when: number) => (
      _target(band.frequency, state.frequency, when, 0.06),
      _target(band.Q, state.q, when, 0.06),
      _target(level.gain, state.gain, when, 0.06),
      _target(flutter.gain, state.gain * state.flutter * 0.18, when, 0.06),
      _target(flutterDepth.gain, state.gain * state.flutter * 0.16, when, 0.06),
      _target(panner.pan, state.pan, when, 0.08)
    ),
  };
};

export var createRustle = (voice: Voice, at = 0) => {
  const { ctx, out } = voice;
  const panner = ctx.createStereoPanner();
  const bed = ctx.createGain();
  const level = ctx.createGain();
  bed.gain.setValueAtTime(0, at);
  level.gain.setValueAtTime(dB(-24), at);
  _chain(panner, level, out);
  _chain(
    _loop(voice, 'pink', at),
    _filter(ctx, 'bandpass', 3000, 0.5),
    bed,
    panner
  );
  const crinkle = ctx.createGain();
  const crinkleFilter = _filter(ctx, 'highpass', 900, 0.7);
  crinkle.gain.setValueAtTime(dB(-1.5), at);
  _chain(crinkleFilter, crinkle, panner);
  const _slices = (clip: Clip, activity: number, delta: number, when: number) =>
    Array.from(
      { length: grainCount(activity, delta, Math.random(), CRINKLE_RATE) },
      () =>
        ((start, seconds, source) => (
          (source.buffer = clip.buffer),
          _chain(
            source,
            _envelope(ctx, start, {
              attack: 0.004,
              peak: 0.5 + 0.5 * Math.random(),
              hold: seconds * 0.4,
              decay: seconds * 0.6,
            }),
            crinkleFilter
          ),
          source.start(
            start,
            Math.random() * Math.max(0, clip.buffer.duration - seconds * 2),
            seconds * 1.2
          )
        ))(
          when + delta * Math.random(),
          0.035 + 0.055 * Math.random(),
          ctx.createBufferSource()
        )
    );
  return {
    update: (activity: number, pan: number, delta: number, when: number) =>
      ((clip) => (
        _target(bed.gain, activity * (clip ? 0.12 : 0.35), when, 0.05),
        _target(panner.pan, pan, when, 0.08),
        clip
          ? _slices(clip, activity, delta, when)
          : _grains(voice, panner, when, {
              count: grainCount(activity, delta, Math.random()),
              spread: delta,
              band: [1800, 7500],
              q: 2.4,
              length: [0.008, 0.028],
              level: 0.8,
            })
      ))(voice.bank.get('crinkle')?.[0]),
    rate: GRAIN_RATE,
  };
};
