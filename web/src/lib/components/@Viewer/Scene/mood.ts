import { Color } from 'three';
import type { Theme } from '#lib/common/types.ts';
import { lerp } from '#lib/common/utils.ts';
import { dusk } from './theme-cue';

export type Mood = 'day' | 'evening';

export type MoodNumbers = {
  hemisphere: number;
  sun: number;
  fill: number;
  reading: number;
  lamp: number;
  bulb: number;
  shadeGlow: number;
  environment: number;
  exposure: number;
  bloom: number;
  dust: number;
  specks: number;
  steam: number;
  fogDensity: number;
  vignette: number;
  reflection: number;
  reflectionFalloff: number;
  reflectionFar: number;
  shafts: number;
  beam: number;
  grade: number;
  halation: number;
};

export type MoodColors = {
  background: string;
  hemisphereSky: string;
  hemisphereGround: string;
  sun: string;
  lamp: string;
  dust: string;
  steam: string;
  desk: string;
  screen: string;
};

export type MoodSpec = MoodNumbers & { colors: MoodColors };

export var THEME_MOOD: Record<Theme, Mood> = { light: 'day', dark: 'evening' };

export var MOODS: Record<Mood, MoodSpec> = {
  day: {
    hemisphere: 0.62,
    sun: 2.7,
    fill: 0,
    reading: 0,
    lamp: 0,
    bulb: 0,
    shadeGlow: 0,
    environment: 0.38,
    exposure: 1,
    bloom: 0.4,
    dust: 0,
    specks: 1,
    steam: 0.6,
    fogDensity: 0.0032,
    vignette: 0.22,
    reflection: 1.25,
    reflectionFalloff: 3.6,
    reflectionFar: 0,
    shafts: 0.1,
    beam: 0,
    grade: 0,
    halation: 0.1,
    colors: {
      background: '#d4d4d4',
      hemisphereSky: '#f4f4f4',
      hemisphereGround: '#d6d6d6',
      sun: '#ffffff',
      lamp: '#ffe2c4',
      dust: '#fff6e8',
      steam: '#ffffff',
      desk: '#cacaca',
      screen: '#f4f5f6',
    },
  },
  evening: {
    hemisphere: 0.14,
    sun: 0.22,
    fill: 1,
    reading: 1,
    lamp: 1,
    bulb: 9,
    shadeGlow: 1,
    environment: 0.07,
    exposure: 1.1,
    bloom: 1.1,
    dust: 1,
    specks: 0,
    steam: 0.1,
    fogDensity: 0.006,
    vignette: 0.55,
    reflection: 0.42,
    reflectionFalloff: 4,
    reflectionFar: 0.25,
    shafts: 0,
    beam: 0.006,
    grade: 1,
    halation: 0.45,
    colors: {
      background: '#11151c',
      hemisphereSky: '#2f4268',
      hemisphereGround: '#12161d',
      sun: '#7d95d6',
      lamp: '#ffbb80',
      dust: '#ffc27a',
      steam: '#7a8292',
      desk: '#2b2f36',
      screen: '#1a1e25',
    },
  },
};

export type MixedMood = MoodNumbers & {
  colors: Record<keyof MoodColors, Color>;
  dusk: number;
  filament: number;
  night: number;
};

var _NUMBERS = Object.keys(MOODS.day).filter(
  (key) => key !== 'colors'
) as Array<keyof MoodNumbers>;

var _COLORS = Object.keys(MOODS.day.colors) as Array<keyof MoodColors>;

export var mixMood = (t: number): MixedMood => ({
  dusk: 0,
  filament: t,
  night: t,
  ...(_NUMBERS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: lerp(MOODS.day[key], MOODS.evening[key], t),
    }),
    {}
  ) as MoodNumbers),
  colors: _COLORS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: new Color(MOODS.day.colors[key]).lerp(
        new Color(MOODS.evening.colors[key]),
        t
      ),
    }),
    {} as Record<keyof MoodColors, Color>
  ),
});

var _LAMP_KEYS = ['lamp', 'bulb', 'shadeGlow', 'fill'] as const;

var _EMBER = new Color('#ff6a2a');

var _SUNSET = new Color('#ffcf9e');

export var mixLit = (ambient: number, power: number): MixedMood =>
  ((mood, glow) => ({
    ...mood,
    ...(Object.fromEntries(
      _LAMP_KEYS.map((key) => [key, MOODS.evening[key] * power])
    ) as Pick<MoodNumbers, (typeof _LAMP_KEYS)[number]>),
    dusk: glow,
    filament: power,
    colors: {
      ...mood.colors,
      lamp: _EMBER
        .clone()
        .lerp(new Color(MOODS.evening.colors.lamp), Math.sqrt(power)),
      sun: mood.colors.sun.clone().lerp(_SUNSET, 0.35 * glow),
    },
  }))(mixMood(ambient), dusk(ambient));
