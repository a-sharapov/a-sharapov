import { describe, expect, test } from 'bun:test';
import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { XYZ } from '$lib/common/types';
import {
  type Carried,
  carryClearance,
  carryPath,
} from '$lib/components/@Viewer/Scene/carry';
import {
  CARD,
  CUP,
  PAPER_PLANE,
  PEN_HOLDER,
  PILE_PLACE,
} from '$lib/components/@Viewer/Scene/layout';
import {
  add,
  type Pose,
  type Rect,
  scale,
} from '$lib/components/@Viewer/Scene/shots';
import {
  carryTravel,
  FACES,
  facePoint,
  PILE,
  PILE_FOOTPRINTS,
  type Prop,
  pileAbove,
  pileLift,
  pileShift,
  RESTS,
  ROOM,
  ROOM_WARMUP,
  roomFor,
  roomOf,
  roomShare,
  SKETCH_TIMELINE,
  SLIDES,
  stageFit,
  yawQuaternion,
} from '$lib/components/@Viewer/Scene/staging';
import type { Actor } from '$lib/components/@Viewer/Scene/state.svelte';

const viewport = { width: 1440, height: 900 };

const _camera = (pose: Pose) => {
  const camera = new PerspectiveCamera(
    pose.fov,
    viewport.width / viewport.height,
    1,
    2000
  );
  camera.position.set(...pose.position);
  camera.up.set(...pose.up);
  camera.lookAt(...pose.target);
  camera.updateMatrixWorld();
  return camera;
};

const _project = (camera: PerspectiveCamera, point: XYZ) =>
  ((ndc) => ({
    x: ((ndc.x + 1) / 2) * viewport.width,
    y: ((1 - ndc.y) / 2) * viewport.height,
  }))(new Vector3(...point).project(camera));

const _RECTS: Record<Actor, Rect> = {
  resume: { left: 458, top: 104, width: 524, height: 741 },
  sketchbook: { left: 208, top: 120, width: 1024, height: 726.5 },
  tablet: { left: 208, top: 150, width: 1024, height: 648.5 },
  plane: { left: 208, top: 104, width: 1024, height: 714 },
};

const _ACTORS = Object.keys(_RECTS) as Actor[];

const _HOME: Record<Actor, number> = {
  resume: 0,
  sketchbook: 0,
  tablet: 0,
  plane: 0,
};

describe('stageFit', () => {
  test.each(
    _ACTORS
  )('%s: лицо предмета проецируется ровно в лист DOM', (actor) => {
    const rect = _RECTS[actor];
    const fit = stageFit(actor, viewport, rect);
    const camera = _camera(fit.pose);
    const topLeft = _project(camera, facePoint(fit.stage, -1, 1));
    const bottomRight = _project(camera, facePoint(fit.stage, 1, -1));
    expect(topLeft.x).toBeCloseTo(rect.left, 0);
    expect(topLeft.y).toBeCloseTo(rect.top, 0);
    expect(bottomRight.x).toBeCloseTo(rect.left + rect.width, 0);
    expect(bottomRight.y).toBeCloseTo(rect.top + rect.height, 0);
  });
});

describe('carryPath', () => {
  test.each(
    _ACTORS.filter((actor): actor is Carried => actor !== 'plane')
  )('%s: путь обходит лампу, карандаши и стопку', (actor) => {
    const fit = stageFit(actor, viewport, _RECTS[actor]);
    const restQ = new Quaternion(...yawQuaternion(RESTS[actor].yaw));
    const from = {
      position: new Vector3(...RESTS[actor].position)
        .add(new Vector3(...FACES[actor].center).applyQuaternion(restQ))
        .setY(FACES[actor].center[1] + pileLift(actor, _HOME)),
      quaternion: restQ,
    };
    const to = {
      position: new Vector3(...fit.stage.position),
      quaternion: new Quaternion(...fit.stage.quaternion),
    };
    const path = carryPath(actor, from, to, {
      slide: new Vector3(),
      rise: new Vector3(),
      land: new Vector3(),
    });
    expect(carryClearance(actor, from, to, path)).toBeGreaterThan(-1);
  });
});

describe('ROOM', () => {
  test('на столе визитка уступает место листу A4', () => {
    expect(Math.hypot(...ROOM.resume.card!)).toBeGreaterThan(5);
    roomFor('card', { ..._HOME, resume: 1 }).forEach(
      (value, i) => void expect(value).toBeCloseTo(ROOM.resume.card![i]!, 6)
    );
  });

  test('самолётик не раздвигает сам себя', () => {
    expect(ROOM.plane.plane ?? [0, 0, 0]).toEqual([0, 0, 0]);
  });
});

describe('ROOM лениво', () => {
  const _STAGING = '$lib/components/@Viewer/Scene/staging';
  const _PROP_NAMES: Prop[] = ['card', 'cup', 'penHolder', 'plane', 'pile'];
  let _instance = 0;

  const _fresh = async () =>
    (await import(
      `${_STAGING}.ts?lazy=${(_instance += 1)}`
    )) as typeof import('$lib/components/@Viewer/Scene/staging');

  const _EAGER = Object.fromEntries(
    (Object.keys(FACES) as Actor[]).map((actor) => [actor, roomOf(actor)])
  );

  const _weights = (actors: Record<Actor, number>) =>
    ((dominance) =>
      ((total) =>
        Object.fromEntries(
          _ACTORS.map((actor) => [
            actor,
            total > 0
              ? (roomShare(actors[actor]) * dominance[actor]!) / total
              : 0,
          ])
        ) as Record<Actor, number>)(
        Object.values(dominance).reduce((sum, value) => sum + value, 0)
      ))(
      Object.fromEntries(
        _ACTORS.map((actor) => [actor, carryTravel(actor, actors[actor]) ** 6])
      )
    );

  const _fullSum = (
    actors: Record<Actor, number>,
    offset: (actor: Actor) => XYZ | undefined,
    skip?: Actor
  ) =>
    ((weights) =>
      _ACTORS
        .filter((actor) => actor !== skip)
        .reduce<XYZ>(
          (sum, actor) =>
            add(sum, scale(offset(actor) ?? [0, 0, 0], weights[actor])),
          [0, 0, 0]
        ))(_weights(actors));

  test('на главной roomFor и pileShift раскладку не запрашивают', async () => {
    const staging = await _fresh();
    expect(staging.roomPending()).toEqual(_ACTORS);
    _PROP_NAMES.forEach(
      (prop) => void expect(staging.roomFor(prop, _HOME)).toEqual([0, 0, 0])
    );
    PILE.forEach(
      ({ 0: actor }) =>
        void expect(staging.pileShift(actor, _HOME)).toEqual([0, 0, 0])
    );
    expect(staging.roomPending()).toEqual(_ACTORS);
  });

  test('на странице считается только раскладка поданного предмета', async () => {
    const staging = await _fresh();
    staging.roomFor('cup', { ..._HOME, sketchbook: 1 });
    staging.pileShift('tablet', { ..._HOME, sketchbook: 1 });
    expect(staging.roomPending()).toEqual(['resume', 'tablet', 'plane']);
  });

  test('ленивые значения равны полному расчёту для всех актёров', async () => {
    const staging = await _fresh();
    ROOM_WARMUP.forEach((actor) => void staging.warmRoom(actor));
    expect(staging.roomPending()).toEqual([]);
    expect(Object.keys(staging.ROOM)).toEqual(Object.keys(_EAGER));
    _ACTORS.forEach(
      (actor) => void expect(staging.ROOM[actor]).toEqual(_EAGER[actor]!)
    );
    expect(ROOM_WARMUP.toSorted()).toEqual(_ACTORS.toSorted());
  });

  test('пропуск нулевых весов не меняет roomFor и pileShift', () =>
    [
      _HOME,
      { ..._HOME, resume: 1 },
      { ..._HOME, sketchbook: 0.3 },
      { ..._HOME, resume: 0.4, sketchbook: 0.7 },
      { ..._HOME, tablet: 0.9, plane: 0.2 },
      { ..._HOME, plane: 1 },
    ].forEach((actors) => {
      _PROP_NAMES.forEach(
        (prop) =>
          void expect(roomFor(prop, actors)).toEqual(
            _fullSum(actors, (actor) => _EAGER[actor]![prop])
          )
      );
      PILE.forEach(
        ({ 0: actor }) =>
          void expect(pileShift(actor, actors)).toEqual(
            _fullSum(actors, (other) => _EAGER[other]!.pile, actor)
          )
      );
    }));
});

describe('стопка', () => {
  test('снизу вверх: резюме, скетчбук, планшет — каждый лежит на предыдущем', () => {
    expect(PILE.map(({ 0: actor }) => actor)).toEqual([
      'resume',
      'sketchbook',
      'tablet',
    ]);
    expect(pileLift('resume', _HOME)).toBe(0);
    expect(pileLift('sketchbook', _HOME)).toBeCloseTo(0.17 + 0.09, 6);
    expect(pileLift('tablet', _HOME)).toBeCloseTo(0.17 + 2.08, 6);
  });

  test('следы лежат друг на друге: центры почти совпадают', () => {
    const {
      0: tablet,
      1: sketchbook,
      2: resume,
    } = (['tablet', 'sketchbook', 'resume'] as Actor[]).map(
      (actor) => PILE_FOOTPRINTS[actor]!.center
    );
    expect(
      Math.hypot(sketchbook![0] - tablet![0], sketchbook![1] - tablet![1])
    ).toBeLessThan(2);
    expect(
      Math.hypot(resume![0] - sketchbook![0], resume![1] - sketchbook![1])
    ).toBeLessThan(2);
  });

  test('верхний не выезжает, из середины и снизу — выезжают вбок', () => {
    expect(SLIDES.tablet).toEqual([0, 0, 0]);
    expect(SLIDES.plane).toEqual([0, 0, 0]);
    expect(Math.hypot(...SLIDES.sketchbook)).toBeGreaterThan(10);
    expect(Math.hypot(...SLIDES.resume)).toBeGreaterThan(10);
    expect(pileAbove('resume')).toEqual(['sketchbook', 'tablet']);
  });

  test('выехал скетчбук — планшет оседает на резюме; выехало резюме — оседают оба', () => {
    expect(pileLift('tablet', { ..._HOME, sketchbook: 0.55 })).toBeCloseTo(
      0.17,
      6
    );
    expect(pileLift('tablet', { ..._HOME, resume: 1 })).toBeCloseTo(2.08, 6);
    expect(pileLift('sketchbook', { ..._HOME, resume: 1 })).toBeCloseTo(
      0.09,
      6
    );
    expect(pileLift('tablet', { ..._HOME, sketchbook: 0.1 })).toBeCloseTo(
      0.17 + 2.08,
      6
    );
  });

  test('скетчбук сначала ложится на место, потом раскрывается', () => {
    expect(carryTravel('sketchbook', SKETCH_TIMELINE.open[0])).toBe(1);
    expect(SKETCH_TIMELINE.open[1]).toBeLessThanOrEqual(
      SKETCH_TIMELINE.blank[0]
    );
  });
});

describe('раскладка соседей', () => {
  const _PROPS = {
    cup: [CUP.position, 6.6],
    penHolder: [PEN_HOLDER.position, 4.6],
    card: [CARD.position, 4.8],
    plane: [PAPER_PLANE.position, 3.5],
    pile: [PILE_PLACE.position, 10.5],
  } as const;

  const _at = (actor: Actor, prop: keyof typeof _PROPS, t = 1) =>
    ((offset) => [
      _PROPS[prop][0][0] + offset[0] * t,
      _PROPS[prop][0][2] + offset[2] * t,
    ])(ROOM[actor][prop] ?? [0, 0, 0]);

  const _props = (actor: Actor) =>
    (Object.keys(_PROPS) as Array<keyof typeof _PROPS>).filter(
      (prop) => prop !== actor
    );

  test.each(
    _ACTORS
  )('%s: соседи не задевают друг друга ни на месте, ни по пути', (actor) => {
    _props(actor).forEach(
      (a, i) =>
        void _props(actor)
          .slice(i + 1)
          .forEach(
            (b) =>
              void Array.from({ length: 11 }, (_, k) => k / 10).forEach(
                (t) =>
                  void ((pa, pb) =>
                    void expect(
                      Math.hypot(pa[0]! - pb[0]!, pa[1]! - pb[1]!)
                    ).toBeGreaterThan(
                      Math.min(
                        _PROPS[a][1] +
                          _PROPS[b][1] -
                          (a === 'pile' || b === 'pile' ? 4.5 : 0),
                        ((ra, rb) =>
                          Math.hypot(ra[0]! - rb[0]!, ra[1]! - rb[1]!))(
                          _at(actor, a, 0),
                          _at(actor, b, 0)
                        ) - 0.01
                      )
                    ))(_at(actor, a, t), _at(actor, b, t))
              )
          )
    );
  });

  test('«Обо мне»: все соседи хотя бы частью в кадре сверху', () => {
    const fit = stageFit('resume', viewport, _RECTS.resume);
    const camera = _camera(fit.pose);
    const k = fit.stage.face[1] / _RECTS.resume.height;
    _props('resume').forEach(
      (prop) =>
        void ((screen, reach) => {
          expect(screen.x).toBeGreaterThan(-reach);
          expect(screen.x).toBeLessThan(viewport.width + reach);
          expect(screen.y).toBeGreaterThan(-reach);
          expect(screen.y).toBeLessThan(viewport.height + reach);
        })(
          _project(camera, [
            _at('resume', prop)[0]!,
            1,
            _at('resume', prop)[1]!,
          ]),
          (_PROPS[prop][1] * 0.6) / k
        )
    );
  });
});
