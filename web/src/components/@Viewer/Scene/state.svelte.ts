import type { Locale, Shot, XYZ } from '$lib/common/types';
import { PAPER } from './layout';
import type { Mood } from './mood';
import { type Pose, SHEET_REST, type Sheet } from './shots';

export type Phase = 'boot' | 'loaded' | 'leaving' | 'moving' | 'settled';

export type Actor = 'resume' | 'sketchbook' | 'tablet' | 'plane';

export var ACTORS: Actor[] = ['resume', 'sketchbook', 'tablet', 'plane'];

export type Stage = {
  position: XYZ;
  quaternion: [x: number, y: number, z: number, w: number];
  face: [width: number, height: number];
};

export var viewer = $state({
  phase: 'boot' as Phase,
  shot: 'intro' as Shot,
  mood: 'day' as Mood,
  locale: 'ru' as Locale,
  hover: false,
  glitch: false,
});

var _stages = Object.fromEntries(
  ACTORS.map((actor) => [
    actor,
    { position: [0, 10, 20], quaternion: [0, 0, 0, 1], face: [21, 14.8] },
  ])
) as Record<Actor, Stage>;

export var rig = {
  pose: null as Pose | null,
  morph: 0,
  actors: { resume: 0, sketchbook: 0, tablet: 0, plane: 0 } as Record<
    Actor,
    number
  >,
  stages: _stages,
  thrown: -1,
  shadowsDirty: true,
  shadowsRedrawn: true,
  still: false,
  sheet: { size: [...SHEET_REST], yaw: PAPER.yaw } as Sheet,
  card: { flip: 0, focus: [0, 0, 0] as XYZ },
  lamp: { power: 0, clicks: 0, press: 0 },
  glitch: -1,
};
