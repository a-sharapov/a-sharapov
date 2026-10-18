import { dB } from './cues';
import type { Cue } from './voices';

export type SampleName =
  | 'paper-lift'
  | 'paper-pat'
  | 'book-lift'
  | 'book-pat'
  | 'strap'
  | 'cover-open'
  | 'cover-close'
  | 'lamp-click'
  | 'pen'
  | 'pencil'
  | 'stylus'
  | 'clink'
  | 'plane-launch'
  | 'plane-pat'
  | 'card-flick'
  | 'card-slide'
  | 'card-tap'
  | 'tablet-pat'
  | 'crinkle'
  | 'room';

export type Clip = { buffer: AudioBuffer; offset: number };

export type Bank = Map<SampleName, Clip[]>;

export type SampleCue = { sample: SampleName; level: number; rate?: number };

export var SAMPLE_BASE = '/sounds';

export var SAMPLE_FILES: Record<SampleName, string[]> = {
  'paper-lift': ['paper-lift-1', 'paper-lift-2'],
  'paper-pat': ['paper-pat'],
  'book-lift': ['book-lift-1', 'book-lift-2'],
  'book-pat': ['book-pat-1', 'book-pat-2', 'book-pat-3'],
  strap: ['strap'],
  'cover-open': ['cover-open'],
  'cover-close': ['cover-close'],
  'lamp-click': ['lamp-click-1', 'lamp-click-2'],
  pen: ['pen-1', 'pen-2'],
  pencil: ['pencil-1', 'pencil-2'],
  stylus: ['stylus'],
  clink: ['clink-1', 'clink-2', 'clink-3'],
  'plane-launch': ['plane-launch-1', 'plane-launch-2'],
  'plane-pat': ['plane-pat-1', 'plane-pat-2'],
  'card-flick': ['card-flick'],
  'card-slide': ['card-slide-1', 'card-slide-2'],
  'card-tap': ['card-tap'],
  'tablet-pat': ['tablet-pat-1', 'tablet-pat-2'],
  crinkle: ['crinkle'],
  room: ['room'],
};

export var SAMPLE_CUES: Partial<Record<Cue, SampleCue>> = {
  paperLift: { sample: 'paper-lift', level: dB(-31.5) },
  bookLift: { sample: 'book-lift', level: dB(-31) },
  tabletLift: { sample: 'book-lift', level: dB(-33), rate: 0.88 },
  paperPat: { sample: 'paper-pat', level: dB(-20.5) },
  bookPat: { sample: 'book-pat', level: dB(-18.5) },
  tabletPat: { sample: 'tablet-pat', level: dB(-15) },
  planePat: { sample: 'plane-pat', level: dB(-27.5) },
  planeLaunch: { sample: 'plane-launch', level: dB(-34.5) },
  strap: { sample: 'strap', level: dB(-32) },
  coverOpen: { sample: 'cover-open', level: dB(-30.5) },
  coverClose: { sample: 'cover-close', level: dB(-24) },
  click: { sample: 'lamp-click', level: dB(-21.5) },
  flick: { sample: 'card-flick', level: dB(-27) },
  slide: { sample: 'card-slide', level: dB(-34.5) },
  tap: { sample: 'card-tap', level: dB(-28.5) },
  penTock: { sample: 'pen', level: dB(-25.5) },
  pencilTock: { sample: 'pencil', level: dB(-26.5) },
  stylusTock: { sample: 'stylus', level: dB(-28.5) },
  clink: { sample: 'clink', level: dB(-28) },
};

export var ROOM_LOOP = { start: 0.5, length: 10 };

export var JITTER = { rate: 0.06, gain: 3 };

export var leadOffset = (data: Float32Array, sampleRate: number) =>
  ((peak) =>
    ((threshold) =>
      ((index) => Math.max(0, (index < 0 ? 0 : index) / sampleRate - 0.002))(
        data.findIndex((value) => Math.abs(value) > threshold)
      ))(peak * dB(-40)))(
    data.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
  );

export var pickClip = (clips: Clip[], random: number) =>
  clips[Math.min(clips.length - 1, Math.floor(random * clips.length))]!;

export var jitter = (random: number, spread: number) =>
  1 + (random - 0.5) * spread;

export var jitterGain = (random: number) => dB((random - 0.5) * JITTER.gain);

var _clip = (buffer: AudioBuffer, name: SampleName): Clip => ({
  buffer,
  offset:
    name === 'room'
      ? 0
      : leadOffset(buffer.getChannelData(0), buffer.sampleRate),
});

var _load = (ctx: BaseAudioContext, file: string, base: string) =>
  fetch(`${base}/${file}.mp3`)
    .then((response) =>
      response.ok
        ? response.arrayBuffer()
        : Promise.reject(new Error(`${file}: ${response.status}`))
    )
    .then((data) => ctx.decodeAudioData(data));

export var loadBank = (
  ctx: BaseAudioContext,
  bank: Bank,
  base = SAMPLE_BASE
): Promise<Bank> =>
  Promise.all(
    (Object.entries(SAMPLE_FILES) as Array<[SampleName, string[]]>).flatMap(
      ({ 0: name, 1: files }) =>
        files.map((file) =>
          _load(ctx, file, base).then(
            (buffer) =>
              void bank.set(name, [
                ...(bank.get(name) ?? []),
                _clip(buffer, name),
              ]),
            () => undefined
          )
        )
    )
  ).then(() => bank);
