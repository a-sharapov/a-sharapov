import type {
  ContactKind,
  ContactRecord,
  Shot,
  Theme,
} from '#lib/common/types.ts';
import { clamp } from '#lib/common/utils.ts';
import clips from './clips.json';

export type Spot =
  | 'intro'
  | 'resume'
  | 'sketchbook'
  | 'portrait'
  | 'tablet'
  | 'card';

export type Rect = [left: number, top: number, width: number, height: number];

export type Size = { width: number; height: number };

export type Clip = {
  seconds: number;
  reveal?: number;
  thrown?: number;
  away?: number;
};

export type Variant = 'uhd' | 'hd';

export type Manifest = {
  frame: Size;
  video: Record<Variant, Size> & { fps: number };
  faces: Partial<Record<Spot, Rect>>;
  card: { spot?: Rect; links?: (Rect | null)[] };
  loops: Record<Theme, Partial<Record<Spot, number>>>;
  clips: Record<Theme, Record<string, Clip>>;
  versions: Record<string, string>;
};

export type Leg = { name: string; from: Spot; to: Spot };

export type Display = { variant: Variant; pixelRatio: number };

export type Fit = {
  frame: Rect;
  scale: number;
  sheets: Partial<Record<Spot, Rect>>;
};

export var VIDEO = clips as unknown as Manifest;

export var FACED: Spot[] = ['resume', 'sketchbook', 'portrait', 'tablet'];

var _CARD_KINDS: ContactKind[] = ['phone', 'telegram', 'email'];

var _SPOTS: Partial<Record<Shot, Spot>> = {
  intro: 'intro',
  portrait: 'portrait',
  resume: 'resume',
  sketchbook: 'sketchbook',
  tablet: 'tablet',
};

var _ENDS: Record<string, [from: Spot, to: Spot]> = {
  'card-out': ['intro', 'card'],
  'card-in': ['card', 'intro'],
  toss: ['portrait', 'intro'],
};

export var spotOf = (shot: Shot): Spot | null => _SPOTS[shot] ?? null;

export var legOf = (name: string): Leg =>
  (({ 0: from, 1: to }) => ({ name, from, to }))(
    _ENDS[name] ?? (name.split('-') as [Spot, Spot])
  );

export var UHD_FROM = 2200;

export var SNAP = 0.03;

export var variantFor = (frameWidth: number, pixelRatio: number): Variant =>
  frameWidth * pixelRatio > UHD_FROM ? 'uhd' : 'hd';

export var clipUrl = (
  variant: Variant,
  theme: Theme,
  name: string,
  manifest: Manifest = VIDEO
) =>
  ((path) =>
    ((version) => `/video/${path}.webm${version ? `?v=${version}` : ''}`)(
      manifest.versions[path]
    ))(`${variant}/${theme}/${name}`);

var _direct = (
  available: Record<string, Clip>,
  from: Spot,
  to: Spot
): string | undefined =>
  ((name) => (name in available ? name : undefined))(
    from === 'intro' && to === 'card'
      ? 'card-out'
      : from === 'card' && to === 'intro'
        ? 'card-in'
        : `${from}-${to}`
  );

var _via = (
  available: Record<string, Clip>,
  from: Spot,
  to: Spot
): string[] | null =>
  ((out, back) => (out && back ? [out, back] : null))(
    _direct(available, from, 'intro'),
    _direct(available, 'intro', to)
  );

export var routeOf = (
  available: Record<string, Clip>,
  from: Spot,
  to: Spot
): string[] | null =>
  from === to
    ? []
    : ((direct) =>
        direct
          ? [direct]
          : from === 'card'
            ? ((rest) => (rest ? ['card-in', ...rest] : null))(
                routeOf(available, 'intro', to)
              )
            : to === 'card'
              ? ((head) => (head ? [...head, 'card-out'] : null))(
                  routeOf(available, from, 'intro')
                )
              : from === 'intro' || to === 'intro'
                ? null
                : _via(available, from, to))(_direct(available, from, to));

var _top = (manifest: Manifest) =>
  Math.min(
    ...FACED.map(
      (spot) => manifest.faces[spot]?.[1] ?? Number.POSITIVE_INFINITY
    )
  );

var _clip = (rect: Rect, bounds: Rect): Rect =>
  ((left, top, right, bottom) => [left, top, right - left, bottom - top])(
    Math.max(rect[0], bounds[0]),
    Math.max(rect[1], bounds[1]),
    Math.min(rect[0] + rect[2], bounds[0] + bounds[2]),
    Math.min(rect[1] + rect[3], bounds[1] + bounds[3])
  );

var _mapRect = (fit: Fit, rect: Rect): Rect => [
  fit.frame[0] + rect[0] * fit.scale,
  fit.frame[1] + rect[1] * fit.scale,
  rect[2] * fit.scale,
  rect[3] * fit.scale,
];

var _native = (display: Display, manifest: Manifest) =>
  manifest.video[display.variant].width /
  manifest.frame.width /
  display.pixelRatio;

var _snap = (cover: number, native: number) =>
  cover <= native && cover >= native * (1 - SNAP) ? native : cover;

var _scaleOf = (viewport: Size, manifest: Manifest, display?: Display) =>
  ((cover) => (display ? _snap(cover, _native(display, manifest)) : cover))(
    Math.max(
      viewport.width / manifest.frame.width,
      viewport.height / manifest.frame.height
    )
  );

var _pixel = (value: number, display?: Display) =>
  display ? Math.floor(value * display.pixelRatio) / display.pixelRatio : value;

var _frameOf = (
  viewport: Size,
  guard: Rect,
  manifest: Manifest,
  scale: number,
  display?: Display
): Rect =>
  ((width, height) =>
    ((crop) => [
      _pixel((viewport.width - width) / 2, display),
      _pixel(
        -clamp(Math.min(crop / 2, _top(manifest) * scale - guard[1]), 0, crop),
        display
      ),
      width,
      height,
    ])(Math.max(0, height - viewport.height)))(
    manifest.frame.width * scale,
    manifest.frame.height * scale
  );

var _sheets = (
  fit: Omit<Fit, 'sheets'>,
  guard: Rect,
  manifest: Manifest
): Fit['sheets'] =>
  Object.fromEntries(
    FACED.flatMap((spot) =>
      ((face) =>
        face
          ? [[spot, _clip(_mapRect({ ...fit, sheets: {} }, face), guard)]]
          : [])(manifest.faces[spot])
    )
  );

export var fitVideo = (
  viewport: Size,
  guard: Rect,
  manifest: Manifest = VIDEO,
  display?: Display
): Fit =>
  ((scale) =>
    ((frame) => ({
      frame,
      scale,
      sheets: _sheets({ frame, scale }, guard, manifest),
    }))(
      _frameOf(
        viewport,
        guard,
        manifest,
        scale,
        scale === _scaleOf(viewport, manifest) ? undefined : display
      )
    ))(_scaleOf(viewport, manifest, display));

export var insetOf = (rect: Rect, viewport: Size) =>
  `${rect[1]}px ${viewport.width - rect[0] - rect[2]}px ${viewport.height - rect[1] - rect[3]}px ${rect[0]}px`;

export var cardLinks = (
  contacts: ContactRecord[],
  manifest: Manifest = VIDEO
): { href: string; label: string; rect: Rect }[] =>
  ((reach) =>
    (manifest.card.links ?? []).length === reach.length
      ? reach.flatMap((contact, index) =>
          ((rect) =>
            rect && contact.href
              ? [{ href: contact.href, label: contact.label, rect }]
              : [])(manifest.card.links?.[index])
        )
      : [])(contacts.filter(({ kind }) => _CARD_KINDS.includes(kind)));

export var GRAIN_TILE = 256;

export var grainPixels = (size: number, random = Math.random) => {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
    const value = Math.round(random() * 255);
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  return data;
};

export var percentOf = (rect: Rect, manifest: Manifest = VIDEO) =>
  `left: ${(rect[0] / manifest.frame.width) * 100}%; top: ${(rect[1] / manifest.frame.height) * 100}%; width: ${(rect[2] / manifest.frame.width) * 100}%; height: ${(rect[3] / manifest.frame.height) * 100}%`;
