import { describe, expect, test } from 'bun:test';
import type { ContactRecord } from '#lib/common/types.ts';
import {
  cardLinks,
  clipUrl,
  FACED,
  fitVideo,
  insetOf,
  legOf,
  type Manifest,
  type Rect,
  routeOf,
  spotOf,
  VIDEO,
  variantFor,
} from '#lib/components/@Viewer/Video/video.ts';

var _clip = { seconds: 2, reveal: 1.5 };

var _MANIFEST: Manifest = {
  frame: { width: 1360, height: 720 },
  video: {
    uhd: { width: 3840, height: 2040 },
    hd: { width: 1920, height: 1020 },
    fps: 31.25,
  },
  faces: {
    resume: [430, 72, 395, 559],
    sketchbook: [287, 72, 787, 559],
    portrait: [168, 72, 1024, 559],
    tablet: [239, 72, 883, 559],
  },
  card: { spot: [570, 320, 218, 118], links: [[523, 378, 114, 17.5], null] },
  loops: { light: { intro: 6 }, dark: {} },
  clips: {
    light: {
      'intro-resume': _clip,
      'resume-intro': _clip,
      'resume-sketchbook': _clip,
      'intro-sketchbook': _clip,
      'tablet-intro': _clip,
      'card-out': _clip,
      'card-in': _clip,
      toss: _clip,
    },
    dark: {},
  },
  versions: { 'uhd/light/intro': '0123456789' },
};

var _GUARD: Rect = [16, 72, 1408, 739];

var _inside = (rect: Rect, bounds: Rect) =>
  rect[0] >= bounds[0] - 1e-6 &&
  rect[1] >= bounds[1] - 1e-6 &&
  rect[0] + rect[2] <= bounds[0] + bounds[2] + 1e-6 &&
  rect[1] + rect[3] <= bounds[1] + bounds[3] + 1e-6;

describe('video version: routes', () => {
  const clips = _MANIFEST.clips.light;

  test('a recorded transition plays directly', () => {
    expect(routeOf(clips, 'intro', 'resume')).toEqual(['intro-resume']);
    expect(routeOf(clips, 'resume', 'sketchbook')).toEqual([
      'resume-sketchbook',
    ]);
    expect(routeOf(clips, 'resume', 'resume')).toEqual([]);
  });

  test('the business card returns to its stand before the camera leaves', () => {
    expect(routeOf(clips, 'intro', 'card')).toEqual(['card-out']);
    expect(routeOf(clips, 'card', 'intro')).toEqual(['card-in']);
    expect(routeOf(clips, 'card', 'resume')).toEqual([
      'card-in',
      'intro-resume',
    ]);
    expect(routeOf(clips, 'resume', 'card')).toEqual([
      'resume-intro',
      'card-out',
    ]);
  });

  test('a missing pair goes through the home shot, otherwise it has no route', () => {
    expect(routeOf(clips, 'tablet', 'sketchbook')).toEqual([
      'tablet-intro',
      'intro-sketchbook',
    ]);
    expect(routeOf(clips, 'intro', 'tablet')).toBeNull();
    expect(routeOf(clips, 'resume', 'tablet')).toBeNull();
  });

  test('clip names carry their ends', () => {
    expect(legOf('resume-sketchbook')).toEqual({
      name: 'resume-sketchbook',
      from: 'resume',
      to: 'sketchbook',
    });
    expect(legOf('toss')).toEqual({
      name: 'toss',
      from: 'portrait',
      to: 'intro',
    });
    expect(legOf('card-out')).toEqual({
      name: 'card-out',
      from: 'intro',
      to: 'card',
    });
    expect(spotOf('landscape')).toBeNull();
    expect(spotOf('portrait')).toBe('portrait');
  });
});

describe('video version: framing', () => {
  const viewports = [
    { width: 1360, height: 720 },
    { width: 1440, height: 900 },
    { width: 1920, height: 960 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1300 },
    { width: 1366, height: 650 },
    { width: 1024, height: 700 },
  ];

  test('the frame always covers the window', () =>
    viewports.forEach((viewport) => {
      const { frame } = fitVideo(viewport, _GUARD, _MANIFEST);
      expect(frame[0]).toBeLessThanOrEqual(1e-6);
      expect(frame[1]).toBeLessThanOrEqual(1e-6);
      expect(frame[0] + frame[2]).toBeGreaterThanOrEqual(viewport.width - 1e-6);
      expect(frame[1] + frame[3]).toBeGreaterThanOrEqual(
        viewport.height - 1e-6
      );
      expect(frame[2] / frame[3]).toBeCloseTo(1360 / 720, 6);
    }));

  test('at the recorded size the sheets sit exactly on the faces', () => {
    const fit = fitVideo(
      { width: 1360, height: 720 },
      [16, 72, 1328, 559],
      _MANIFEST
    );
    FACED.forEach(
      (spot) => void expect(fit.sheets[spot]).toEqual(_MANIFEST.faces[spot])
    );
  });

  test('sheets stay on the paper and between the header and the footer', () =>
    viewports.forEach((viewport) => {
      const guard: Rect = [
        16,
        72,
        viewport.width - 32,
        viewport.height - 72 - 89,
      ];
      const fit = fitVideo(viewport, guard, _MANIFEST);
      FACED.forEach((spot) => {
        const sheet = fit.sheets[spot]!;
        const face = _MANIFEST.faces[spot]!;
        const paper: Rect = [
          fit.frame[0] + face[0] * fit.scale,
          fit.frame[1] + face[1] * fit.scale,
          face[2] * fit.scale,
          face[3] * fit.scale,
        ];
        expect(_inside(sheet, guard)).toBe(true);
        expect(_inside(sheet, paper)).toBe(true);
      });
    }));

  test('a wide window crops the floor first, keeping the top of the sheet below the header', () => {
    const viewport = { width: 1920, height: 960 };
    const fit = fitVideo(viewport, [16, 72, 1888, 799], _MANIFEST);
    expect(fit.frame[1] + 72 * fit.scale).toBeGreaterThanOrEqual(72 - 1e-6);
  });

  test('a frame just below the video size snaps to one video pixel per screen pixel', () => {
    const viewport = { width: 1900, height: 1000 };
    const guard: Rect = [16, 72, 1868, 839];
    const hd = fitVideo(viewport, guard, _MANIFEST, {
      variant: 'hd',
      pixelRatio: 1,
    });
    expect(hd.scale).toBeCloseTo(1920 / 1360, 9);
    expect(fitVideo(viewport, guard, _MANIFEST).scale).toBeCloseTo(
      1900 / 1360,
      9
    );
    const laptop = fitVideo({ width: 1520, height: 800 }, guard, _MANIFEST, {
      variant: 'hd',
      pixelRatio: 1.25,
    });
    expect(laptop.frame[2] * 1.25).toBeCloseTo(1920, 9);
    expect(
      Number.isInteger(Math.round(laptop.frame[0] * 1.25 * 1e6) / 1e6)
    ).toBe(true);
    expect(
      Number.isInteger(Math.round(laptop.frame[1] * 1.25 * 1e6) / 1e6)
    ).toBe(true);
    expect(laptop.frame[0]).toBeLessThanOrEqual(0);
    expect(laptop.frame[0] + laptop.frame[2]).toBeGreaterThanOrEqual(1520);
    expect(laptop.frame[1] + laptop.frame[3]).toBeGreaterThanOrEqual(800);
  });

  test('a frame far from the video size keeps the cover scale', () => {
    const viewport = { width: 1440, height: 900 };
    const cover = fitVideo(viewport, _GUARD, _MANIFEST);
    const retina = fitVideo(viewport, _GUARD, _MANIFEST, {
      variant: 'uhd',
      pixelRatio: 2,
    });
    expect(retina).toEqual(cover);
  });

  test('clip addresses carry the recorded version', () => {
    expect(clipUrl('uhd', 'light', 'intro', _MANIFEST)).toBe(
      '/video/uhd/light/intro.webm?v=0123456789'
    );
    expect(clipUrl('hd', 'light', 'intro', _MANIFEST)).toBe(
      '/video/hd/light/intro.webm'
    );
  });

  test('4K goes only to screens that show more than its lighter half', () => {
    expect(variantFor(1530, 1)).toBe('hd');
    expect(variantFor(2040, 1)).toBe('hd');
    expect(variantFor(2300, 1)).toBe('uhd');
    expect(variantFor(2720, 1)).toBe('uhd');
    expect(variantFor(1530, 2)).toBe('uhd');
  });

  test('the inset of a sheet describes the same box', () => {
    expect(insetOf([100, 72, 400, 500], { width: 1440, height: 900 })).toBe(
      '72px 940px 328px 100px'
    );
  });
});

describe('video version: business card', () => {
  const _contact = (kind: ContactRecord['kind'], href: string) =>
    ({
      id: kind + href,
      kind,
      href,
      label: href,
      group: '',
    }) as unknown as ContactRecord;

  test('links follow the order of the card back and skip contacts without one', () => {
    const contacts = [
      _contact('phone', 'tel:+1'),
      _contact('linkedin', 'https://linkedin.com'),
      _contact('telegram', 'https://t.me/x'),
    ];
    expect(cardLinks(contacts, _MANIFEST)).toEqual([
      { href: 'tel:+1', label: 'tel:+1', rect: [523, 378, 114, 17.5] },
    ]);
  });

  test('a changed list of contacts drops the hotspots instead of mislabelling them', () => {
    expect(cardLinks([_contact('phone', 'tel:+1')], _MANIFEST)).toEqual([]);
  });
});

describe('video version: recorded manifest', () => {
  test('every page with a face has its loop and transitions in both themes', () =>
    (['light', 'dark'] as const).forEach((theme) => {
      ['intro', 'resume', 'sketchbook', 'portrait', 'tablet', 'card'].forEach(
        (spot) => void expect(VIDEO.loops[theme]).toHaveProperty(spot)
      );
      ['intro', 'resume', 'sketchbook', 'portrait'].forEach(
        (to) =>
          void ['intro', 'resume', 'sketchbook', 'portrait', 'tablet']
            .filter((from) => from !== to)
            .forEach(
              (from) =>
                void expect(VIDEO.clips[theme]).toHaveProperty(`${from}-${to}`)
            )
      );
      ['card-out', 'card-in', 'toss'].forEach(
        (name) => void expect(VIDEO.clips[theme]).toHaveProperty(name)
      );
      Object.values(VIDEO.clips[theme]).forEach((clip) => {
        expect(clip.seconds).toBeGreaterThan(0.5);
        expect(clip.reveal ?? 0).toBeLessThanOrEqual(clip.seconds);
      });
    }));

  test('faces are measured for every page with a sheet', () =>
    FACED.forEach((spot) => void expect(VIDEO.faces[spot]?.length).toBe(4)));
});
