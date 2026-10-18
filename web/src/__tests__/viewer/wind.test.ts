import { afterAll, describe, expect, test } from 'bun:test';
import { Quaternion, Vector3 } from 'three';
import {
  MOVER_NAMES,
  movers,
  resetMovers,
} from '$lib/components/@Viewer/Scene/movers';
import { AXIS_LEVELS } from '$lib/components/@Viewer/Scene/Steam/axis';
import {
  createSteamDrift,
  driftReach,
  driftResting,
  levelHeight,
  settleDrift,
  stepDrift,
} from '$lib/components/@Viewer/Scene/Steam/drift';
import {
  createWind,
  pushEnvelope,
  WAKE,
  WIND,
  wakeEnvelope,
} from '$lib/components/@Viewer/Scene/wind';

var _still = () =>
  MOVER_NAMES.forEach(
    (name) =>
      void ((movers[name].seen = true),
      (movers[name].speed = 0),
      movers[name].velocity.set(0, 0, 0),
      movers[name].position.set(0, -100, 0))
  );

var _fly = (
  wind: ReturnType<typeof createWind>,
  seconds: number,
  dt = 1 / 60
) =>
  Array.from({ length: Math.round(seconds / dt) }).forEach((_, i) => {
    const plane = movers['actor-plane'];
    plane.velocity.set(40, 0, 0);
    plane.speed = 40;
    plane.position.set(-30 + 40 * i * dt, 10, 0);
    wind.step(dt, i);
  });

var _rest = (
  wind: ReturnType<typeof createWind>,
  seconds: number,
  from: number,
  dt = 1 / 60
) =>
  Array.from({ length: Math.round(seconds / dt) }).forEach((_, i) => {
    const plane = movers['actor-plane'];
    plane.velocity.set(0, 0, 0);
    plane.speed = 0;
    wind.step(dt, from + i);
  });

afterAll(resetMovers);

describe('wind', () => {
  test('push rises from zero and is gone by the end of life', () => {
    expect(pushEnvelope(0)).toBe(0);
    expect(pushEnvelope(WIND.life)).toBe(0);
    expect(pushEnvelope(0.6)).toBeGreaterThan(0.3);
  });

  test('nothing moves — no puffs, no gust', () => {
    _still();
    const wind = createWind();
    _rest(wind, 1, 0);
    expect(wind.state.active).toBe(0);
    expect(wind.gustAt(new Vector3(0, 10, 0), new Vector3()).length()).toBe(0);
  });

  test('a passing plane pushes motes along its path, a few centimetres at most, and they come back', () => {
    _still();
    const wind = createWind();
    _fly(wind, 1.5);
    const near = wind.gustAt(new Vector3(0, 11, 1), new Vector3());
    const far = wind.gustAt(new Vector3(0, 10, 45), new Vector3());
    expect(near.x).toBeGreaterThan(0.2);
    expect(near.length()).toBeLessThan(4);
    expect(far.length()).toBeLessThan(0.02);
    expect(wind.state.active).toBeLessThan(WIND.puffs);
    _rest(wind, WIND.life + 0.1, 1000);
    expect(wind.state.active).toBe(0);
    expect(wind.gustAt(new Vector3(0, 11, 1), new Vector3()).length()).toBe(0);
  });

  test('a mover frame step is applied once per frame', () => {
    _still();
    const wind = createWind();
    expect(wind.step(1 / 60, 7)).toBe(true);
    expect(wind.step(1 / 60, 7)).toBe(false);
  });

  test('air near the path follows the plane; the excluded source does not count', () => {
    _still();
    const wind = createWind();
    _fly(wind, 1);
    expect(wind.airAt(new Vector3(5, 10, 0), new Vector3()).x).toBeGreaterThan(
      1
    );
    expect(
      wind.airAt(new Vector3(5, 10, 0), new Vector3(), 'actor-plane').length()
    ).toBe(0);
  });
});

describe('steam drift', () => {
  test('the strand trails behind a moving cup, anchored at the coffee, and straightens afterwards', () => {
    const drift = createSteamDrift();
    Array.from({ length: 36 }).forEach(
      () => void stepDrift(drift, 1 / 60, () => [18, 0])
    );
    expect(drift.world[0]).toBe(0);
    expect(drift.world[(AXIS_LEVELS - 1) * 2]!).toBeGreaterThan(1);
    settleDrift(drift, 1, 0);
    Array.from({ length: AXIS_LEVELS }, (_, level) =>
      Math.hypot(drift.local[level * 3]!, drift.local[level * 3 + 1]!)
    ).forEach(
      (offset, level) =>
        void expect(offset).toBeLessThanOrEqual(
          driftReach(levelHeight(level)) + 1e-6
        )
    );
    Array.from({ length: 60 * 8 }).forEach(
      () => void stepDrift(drift, 1 / 60, () => [0, 0])
    );
    expect(driftResting(drift)).toBe(true);
  });

  test('world offsets are turned into the cup frame like three does', () => {
    const drift = createSteamDrift();
    Array.from({ length: 30 }).forEach(
      () => void stepDrift(drift, 1 / 60, () => [3, -1])
    );
    const yaw = 0.83;
    settleDrift(drift, Math.cos(yaw), Math.sin(yaw));
    const level = AXIS_LEVELS - 1;
    const world = new Vector3(
      drift.world[level * 2]!,
      0,
      drift.world[level * 2 + 1]!
    );
    const local = world
      .clone()
      .applyQuaternion(
        new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw).invert()
      );
    const scale =
      Math.hypot(drift.local[level * 3]!, drift.local[level * 3 + 1]!) /
      world.length();
    expect(drift.local[level * 3]!).toBeCloseTo(local.x * scale, 5);
    expect(drift.local[level * 3 + 1]!).toBeCloseTo(local.z * scale, 5);
  });

  test('пылинки собираются в след за самолётиком — к линии пути, без перелёта', () => {
    _still();
    const wind = createWind();
    _fly(wind, 0.8);
    const pull = new Vector3();
    const near = new Vector3(-10, 10, 4);
    wind.gatherAt(near, pull);
    expect(pull.z).toBeLessThan(-0.5);
    expect(Math.abs(pull.z)).toBeLessThanOrEqual(4 * WAKE.pull + 1e-9);
    expect(Math.abs(pull.y)).toBeLessThan(0.3);
    wind.gatherAt(new Vector3(-10, 10, 40), pull);
    expect(pull.length()).toBeLessThan(0.01);
    _rest(wind, WAKE.life + 0.1, 1000);
    wind.gatherAt(near, pull);
    expect(pull.length()).toBe(0);
  });

  test('шлейф проявляется быстро и гаснет плавно', () => {
    expect(wakeEnvelope(0)).toBe(0);
    expect(wakeEnvelope(WAKE.rise * 4)).toBeGreaterThan(0.9);
    expect(wakeEnvelope(WAKE.life)).toBe(0);
    expect(wakeEnvelope(WAKE.life * 0.7)).toBeGreaterThan(0);
  });

  test('пылинки за самолётиком движутся без рывков и на вираже', () => {
    _still();
    const wind = createWind();
    const dt = 1 / 60;
    const plane = movers['actor-plane'];
    const probes = [
      new Vector3(0, 10, 3),
      new Vector3(10, 10, -2),
      new Vector3(18, 10, 6),
      new Vector3(5, 10, -6),
    ];
    const last = probes.map(() => new Vector3());
    const step = probes.map(() => new Vector3());
    const out = new Vector3();
    const jerk = { max: 0 };
    Array.from({ length: 240 }).forEach((_, i) => {
      const t = i * dt;
      const point = new Vector3(
        Math.sin(t * 1.6) * 20,
        10,
        -Math.cos(t * 1.6) * 20 + 20 * (1 - Math.cos(t * 0.7))
      );
      plane.velocity.copy(
        i
          ? point.clone().sub(plane.position).divideScalar(dt)
          : new Vector3(32, 0, 0)
      );
      plane.speed = plane.velocity.length();
      plane.position.copy(point);
      wind.step(dt, i);
      probes.forEach(
        (probe, k) =>
          void ((shift) =>
            ((change) => (
              i > 2 &&
                (jerk.max = Math.max(
                  jerk.max,
                  change.clone().sub(step[k]!).length()
                )),
              last[k]!.copy(shift),
              step[k]!.copy(change)
            ))(shift.clone().sub(last[k]!)))(
            wind
              .gatherAt(probe, out)
              .clone()
              .add(wind.gustAt(probe, new Vector3()))
          )
      );
    });
    expect(jerk.max).toBeLessThan(0.12);
  });
});
