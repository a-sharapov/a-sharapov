import { dB, type Lamp, type Mood, type Placement } from './cues';
import { type Bank, loadBank } from './samples';
import {
  type Cue,
  createAmbience,
  createNoise,
  createRustle,
  createWhoosh,
  playCue,
  type Voice,
  type WhooshState,
} from './voices';

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  voice: Voice;
  ambience: ReturnType<typeof createAmbience>;
  whoosh: ReturnType<typeof createWhoosh>;
  rustle: ReturnType<typeof createRustle>;
};

export type SoundFrame = {
  delta: number;
  whoosh: WhooshState;
  rustle: { activity: number; pan: number };
  lamp: Lamp;
};

var _LEVEL = dB(5);
var _FADE = 0.25;
var _LOOKAHEAD = 0.012;
var _GESTURES = ['pointerdown', 'keydown'] as const;

var _limiter = (ctx: AudioContext) =>
  ((limiter) => (
    limiter.threshold.setValueAtTime(-12, 0),
    limiter.knee.setValueAtTime(6, 0),
    limiter.ratio.setValueAtTime(8, 0),
    limiter.attack.setValueAtTime(0.003, 0),
    limiter.release.setValueAtTime(0.25, 0),
    limiter
  ))(ctx.createDynamicsCompressor());

export var defineSoundService = () => {
  const state = {
    engine: null as Engine | null,
    on: false,
    armed: false,
    mood: 'day' as Mood,
    log: [] as Array<[time: number, cue: string]>,
  };

  const _fade = (engine: Engine, to: number) =>
    engine.master.gain.setTargetAtTime(to, engine.ctx.currentTime, _FADE / 3);

  const _resume = (engine: Engine) =>
    engine.ctx.resume().then(
      () => _fade(engine, state.on && !document.hidden ? _LEVEL : 0),
      () => undefined
    );

  const _suspend = (engine: Engine) => (
    _fade(engine, 0),
    setTimeout(
      () =>
        void (
          (!state.on || document.hidden) &&
          engine.ctx.state === 'running' &&
          engine.ctx.suspend()
        ),
      _FADE * 2000
    )
  );

  const _visibility = () =>
    void (
      state.engine &&
      (document.hidden || !state.on
        ? _suspend(state.engine)
        : _resume(state.engine))
    );

  const _load = (engine: Engine) => (
    loadBank(engine.ctx, engine.voice.bank).then(
      (bank) =>
        ((room, clock, at) =>
          void (room && engine.ambience.room(room, at),
          clock && engine.ambience.clock(clock, at)))(
          bank.get('room')?.[0],
          bank.get('clock')?.[0],
          engine.ctx.currentTime
        ),
      () => undefined
    ),
    engine
  );

  const _create = (): Engine => {
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    const master = ctx.createGain();
    const voice = {
      ctx,
      out: master,
      noise: createNoise(ctx),
      bank: new Map() as Bank,
    };
    master.gain.setValueAtTime(0, 0);
    master.connect(_limiter(ctx)).connect(ctx.destination);
    document.addEventListener('visibilitychange', _visibility);
    return _load({
      ctx,
      master,
      voice,
      ambience: createAmbience(voice, state.mood, ctx.currentTime),
      whoosh: createWhoosh(voice, ctx.currentTime),
      rustle: createRustle(voice, ctx.currentTime),
    });
  };

  const _running = () =>
    state.on && state.engine?.ctx.state === 'running' ? state.engine : null;

  const enable = () => (
    (state.on = true), (state.engine ??= _create()), _resume(state.engine)
  );

  const disable = () =>
    void ((state.on = false), state.engine && _suspend(state.engine));

  const _onGesture = () => (
    _GESTURES.forEach(
      (type) => void window.removeEventListener(type, _onGesture, true)
    ),
    (state.armed = false),
    state.on && enable()
  );

  const arm = () =>
    void (
      !state.armed &&
      ((state.on = true),
      (state.armed = true),
      _GESTURES.forEach(
        (type) => void window.addEventListener(type, _onGesture, true)
      ))
    );

  const play = (cue: Cue, placement: Placement) =>
    ((engine) =>
      void (
        engine &&
        (playCue(
          engine.voice,
          cue,
          engine.ctx.currentTime + _LOOKAHEAD,
          placement
        ),
        import.meta.env.DEV &&
          state.log.push([Math.round(performance.now()), cue]))
      ))(_running());

  const frame = ({ delta, whoosh, rustle, lamp }: SoundFrame) =>
    ((engine) =>
      void (
        engine &&
        (engine.whoosh.update(whoosh, engine.ctx.currentTime),
        engine.ambience.lamp(lamp, engine.ctx.currentTime),
        engine.rustle.update(
          rustle.activity,
          rustle.pan,
          Math.min(delta, 0.1),
          engine.ctx.currentTime + _LOOKAHEAD
        ))
      ))(_running());

  const mood = (next: Mood) =>
    void ((state.mood = next),
    state.engine?.ambience.mood(next, state.engine.ctx.currentTime));

  return {
    enable,
    disable,
    arm,
    play,
    frame,
    mood,
    get active() {
      return Boolean(_running());
    },
    get state() {
      return state;
    },
  };
};

var sound = defineSoundService();

void (
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  Object.assign(window, { __asSound: sound })
);

export default sound;
