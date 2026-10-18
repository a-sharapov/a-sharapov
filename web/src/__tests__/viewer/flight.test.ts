import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { obstacleGap, roomGap } from '$lib/components/@Viewer/Scene/carry';
import {
  carrySeconds,
  createPlaneFlight,
  G,
  PLANE_SECONDS,
  type PlanePose,
} from '$lib/components/@Viewer/Scene/flight';
import {
  INTRO_AZIMUTH,
  PAPER_PLANE,
} from '$lib/components/@Viewer/Scene/layout';
import {
  createPaperGeometry,
  createPlaneFold,
} from '$lib/components/@Viewer/Scene/models/plane-fold';
import {
  ACTOR_SECONDS,
  CARRY_SPAN,
  carryEase,
  roomFor,
  stageFit,
  TABLE_STAGE,
  THROW,
  yawQuaternion,
} from '$lib/components/@Viewer/Scene/staging';
import type { Actor } from '$lib/components/@Viewer/Scene/state.svelte';

var source = readFileSync(
  new URL(
    '../../components/@Viewer/Scene/models/svg/paper-plane.svg',
    import.meta.url
  ),
  'utf8'
);
var fold = createPlaneFold(source);
var FACE: [number, number] = [29.7, 20.7];
var flight = createPlaneFlight(fold, () => FACE);
var dart = fold.pose(0, [29.7, 21]).map((point) => new Vector3(...point));
var keel = dart[1]!.clone().add(dart[2]!).multiplyScalar(0.5);
var unroll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), fold.roll);
var sheet = createPaperGeometry(fold, 1, FACE);

var _DT = 1 / 120;

var _snapshot = (pose: PlanePose): PlanePose => ({
  position: pose.position.clone(),
  quaternion: pose.quaternion.clone(),
  unfold: pose.unfold,
});

type Sample = {
  t: number;
  position: Vector3;
  quaternion: Quaternion;
  unfold: number;
  keel: Vector3;
  nose: Vector3;
};

var _sample = (
  at: (t: number) => PlanePose,
  from: number,
  to: number
): Sample[] =>
  Array.from({ length: Math.round((to - from) / _DT) + 1 }, (_, i) =>
    ((t, pose) => ({
      t,
      position: pose.position.clone(),
      quaternion: pose.quaternion.clone(),
      unfold: pose.unfold,
      keel: keel.clone().applyQuaternion(pose.quaternion).add(pose.position),
      nose: new Vector3(0, 0, 1).applyQuaternion(
        pose.quaternion.clone().multiply(unroll)
      ),
    }))(from + i * _DT, at(from + i * _DT))
  );

var _velocity = (samples: Sample[], i: number) =>
  samples[Math.min(samples.length - 1, i + 1)]!.keel.clone()
    .sub(samples[Math.max(0, i - 1)]!.keel)
    .divideScalar(
      samples[Math.min(samples.length - 1, i + 1)]!.t -
        samples[Math.max(0, i - 1)]!.t
    );

var _corners = (sample: Sample) =>
  sample.unfold > 0
    ? ((geometry) =>
        Array.from(
          { length: geometry.getAttribute('position').count },
          (_, i) =>
            new Vector3()
              .fromBufferAttribute(geometry.getAttribute('position'), i)
              .applyQuaternion(sample.quaternion)
              .add(sample.position)
        ))((sheet.update(sample.unfold, FACE), sheet.geometry))
    : dart.map((vertex) =>
        vertex.clone().applyQuaternion(sample.quaternion).add(sample.position)
      );

var forthSeconds = CARRY_SPAN * ACTOR_SECONDS.plane![0];
var swap = THROW.away * THROW.seconds;
var launch = THROW.fold * THROW.seconds;

var _forthShare = (t: number) => carryEase((t / forthSeconds) * CARRY_SPAN);
var _leaving = (t: number, start: number, seconds: number) =>
  1 - carryEase(Math.max(0, t - start) / seconds);

var _handover =
  (actor: Actor) =>
  (t: number): Record<Actor, number> =>
    ((k) => ({
      resume: 0,
      sketchbook: 0,
      tablet: 0,
      plane: 1 - k,
      [actor]: k,
    }))(carryEase(t / ACTOR_SECONDS[actor]![0]));

var aroundSamples = _sample(flight.around, 0, PLANE_SECONDS.back);

type Run = {
  samples: Sample[];
  share: (t: number) => number;
  room?: (t: number) => Record<Actor, number>;
  free: [number, number];
};

var _offset = new Vector3();

var _gap = (run: Run, corner: Vector3, t: number) =>
  run.room
    ? ((room) =>
        roomGap(
          corner.add(_offset.set(...roomFor('plane', room))),
          'plane',
          room
        ))(run.room(t))
    : obstacleGap(corner, 'plane', run.share(t));

var flights: Record<string, Run> = {
  forth: {
    samples: _sample(flight.forth, 0, flight.marks.land + 0.2),
    share: _forthShare,
    free: [0.3, flight.marks.apex - 0.35] as [number, number],
  },
  back: {
    samples: _sample(flight.back, 0, PLANE_SECONDS.back),
    share: (t: number) => _leaving(t, 0, 1.6),
    free: [0.6 + 0.55, flight.marks.back - 0.25] as [number, number],
  },
  backSlow: {
    samples: _sample(flight.back, 0, PLANE_SECONDS.back),
    share: (t: number) => _leaving(t, 0, 2.4),
    free: [0.6 + 0.55, flight.marks.back - 0.25] as [number, number],
  },
  throwing: {
    samples: _sample(flight.throwing, 0, THROW.seconds),
    share: (t: number) => (t < swap ? 1 : _leaving(t, swap, 1.6)),
    free: [launch + 0.55, flight.marks.arrival - 0.25] as [number, number],
  },
  ...Object.fromEntries(
    (['resume', 'sketchbook', 'tablet'] as const).map((actor) => [
      `облёт к ${actor}`,
      {
        samples: aroundSamples,
        share: (t: number) => _leaving(t, 0, ACTOR_SECONDS[actor]![0]),
        room: _handover(actor),
        free: [0.6 + 0.55, flight.marks.around - 0.25] as [number, number],
      },
    ])
  ),
};

describe('полёт самолётика', () => {
  test.each(
    Object.keys(flights)
  )('%s: не задевает лампу, стакан, визитку, чашку и стопку — в раскладке перехода', (name) =>
    ((run) =>
      expect(
        run.samples
          .filter((_, i) => i % 3 === 0)
          .reduce(
            (worst, sample) =>
              _corners(sample).reduce(
                (least, corner) => Math.min(least, _gap(run, corner, sample.t)),
                worst
              ),
            Number.POSITIVE_INFINITY
          )
      ).toBeGreaterThan(-1))(flights[name as keyof typeof flights]));

  test.each(Object.keys(flights))('%s: не уходит под стол', (name) =>
    expect(
      Math.min(
        ...flights[name as keyof typeof flights].samples.flatMap((sample) =>
          _corners(sample).map((corner) => corner.y)
        )
      )
    ).toBeGreaterThan(-0.02));

  test.each(
    Object.keys(flights)
  )('%s: в полёте нос смотрит по скорости', (name) =>
    ((run) =>
      run.samples.forEach(
        (sample, i) =>
          void (
            sample.t > run.free[0] &&
            sample.t < run.free[1] &&
            Math.abs(sample.t - swap) > 0.05 &&
            ((velocity) =>
              velocity.length() > 8 &&
              expect(
                (velocity.normalize().angleTo(sample.nose) * 180) / Math.PI
              ).toBeLessThan(25))(_velocity(run.samples, i))
          )
      ))(flights[name as keyof typeof flights]));

  test.each(
    Object.keys(flights)
  )('%s: после толчка сам высоту не набирает (энергия не растёт)', (name) =>
    ((run) =>
      ((energies) =>
        energies.forEach(
          ({ t, energy }, i) =>
            void (
              i > 6 &&
              t < swap === energies[i - 6]!.t < swap &&
              expect(energy).toBeLessThan(energies[i - 6]!.energy * 1.02 + 2)
            )
        ))(
        run.samples
          .map((sample, i) => ({ sample, i }))
          .filter(
            ({ sample }) =>
              sample.t > run.free[0] &&
              sample.t < run.free[1] &&
              Math.abs(sample.t - swap) > 0.1
          )
          .map(({ sample, i }) => ({
            t: sample.t,
            energy:
              _velocity(run.samples, i).lengthSq() / 2 + G * sample.keel.y,
          }))
      ))(flights[name as keyof typeof flights]));

  test.each(
    Object.keys(flights)
  )('%s: без скачков положения и поворота', (name) =>
    flights[name as keyof typeof flights].samples
      .slice(1)
      .forEach(
        (sample, i, samples) =>
          void (
            Math.abs(sample.t - swap) > _DT * 1.5 &&
            (expect(
              sample.position.distanceTo(
                (i === 0
                  ? flights[name as keyof typeof flights].samples[0]!
                  : samples[i - 1]!
                ).position
              )
            ).toBeLessThan(0.8),
            expect(
              (sample.quaternion.angleTo(
                (i === 0
                  ? flights[name as keyof typeof flights].samples[0]!
                  : samples[i - 1]!
                ).quaternion
              ) *
                180) /
                Math.PI
            ).toBeLessThan(8))
          )
      ));

  test('туда: лист ложится на место подачи до проявления контента', () => {
    const end = flight.forth(forthSeconds);
    expect(end.unfold).toBe(1);
    expect(end.position.distanceTo(new Vector3(...TABLE_STAGE))).toBeLessThan(
      1e-6
    );
    expect(
      end.quaternion.angleTo(new Quaternion(...yawQuaternion(INTRO_AZIMUTH)))
    ).toBeLessThan(1e-6);
    expect(flight.marks.land).toBeLessThan(
      0.82 * ACTOR_SECONDS.plane![0] - 0.1
    );
    expect(carrySeconds(1)).toBeCloseTo(forthSeconds, 3);
  });

  test('обратно и бросок: самолётик садится на своё место лёжа на крыле', () =>
    [
      _snapshot(flight.back(PLANE_SECONDS.back)),
      _snapshot(flight.around(PLANE_SECONDS.back)),
      _snapshot(flight.throwing(THROW.seconds)),
    ].forEach((end) => {
      expect(end.unfold).toBe(0);
      expect(
        end.position.distanceTo(new Vector3(...PAPER_PLANE.position))
      ).toBeLessThan(1e-3);
      expect(
        end.quaternion.angleTo(
          new Quaternion(...yawQuaternion(PAPER_PLANE.yaw))
        )
      ).toBeLessThan(1e-3);
    }));

  test('бросок: лист складывается на месте подачи носом вправо, без разворота на месте', () => {
    const start = flight.throwing(0);
    expect(start.unfold).toBe(1);
    expect(start.position.distanceTo(new Vector3(...TABLE_STAGE))).toBeLessThan(
      1e-6
    );
    flights.throwing.samples
      .filter((sample) => sample.t < launch)
      .forEach(
        (sample) =>
          void expect(
            Math.abs(sample.quaternion.x) + Math.abs(sample.quaternion.z)
          ).toBeLessThan(1e-9)
      );
  });

  test('бросок: в момент подмены старый и новый самолётики вне кадра', () => {
    const viewport = { width: 1440, height: 900 };
    const fit = stageFit('plane', viewport, {
      left: 208,
      top: 104,
      width: 1024,
      height: 714,
    });
    const camera = new PerspectiveCamera(
      fit.pose.fov,
      viewport.width / viewport.height,
      1,
      2000
    );
    camera.position.set(...fit.pose.position);
    camera.up.set(...fit.pose.up);
    camera.lookAt(...fit.pose.target);
    camera.updateMatrixWorld();
    [
      _snapshot(flight.throwing(swap - 0.01)),
      _snapshot(flight.throwing(swap + 0.01)),
    ].forEach(
      (pose) =>
        void dart
          .map((vertex) =>
            vertex
              .clone()
              .applyQuaternion(pose.quaternion)
              .add(pose.position)
              .project(camera)
          )
          .forEach(
            (ndc) =>
              void expect(
                Math.max(Math.abs(ndc.x), Math.abs(ndc.y))
              ).toBeGreaterThan(1)
          )
    );
  });
});
