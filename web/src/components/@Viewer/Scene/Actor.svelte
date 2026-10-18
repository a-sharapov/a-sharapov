<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import type { Snippet } from 'svelte';
  import { Group, Quaternion, Vector3 } from 'three';
  import { type Carried, carryAt, carryPath, carryTurn } from './carry';
  import {
    carrySeconds,
    createPlaneFlight,
    PLANE_SECONDS,
    type PlanePose,
    planeFold,
  } from './flight';
  import { createPlaneFold } from './models/plane-fold';
  import source from './models/svg/paper-plane.svg?raw';
  import { carryTravel, FACES, pileLift, pileShift, RESTS, THROW, yawQuaternion } from './staging';
  import { type Actor, rig } from './state.svelte';

  interface IActor {
    name: Actor;
    children: Snippet;
  }

  let { name, children }: IActor = $props();

  const group = new Group();
  const face = new Vector3(...FACES[name].center);
  const ground = new Vector3(...RESTS[name].position).add(
    face.clone().applyQuaternion(new Quaternion(...yawQuaternion(RESTS[name].yaw)))
  );
  const rest = {
    position: ground.clone(),
    quaternion: new Quaternion(...yawQuaternion(RESTS[name].yaw)),
  };
  const staged = { position: new Vector3(), quaternion: new Quaternion() };
  const point = new Vector3();
  const path = {
    slide: new Vector3(),
    rise: new Vector3(),
    land: new Vector3(),
  };

  const flight =
    name === 'plane'
      ? createPlaneFlight(createPlaneFold(source), () => rig.stages.plane.face)
      : null;
  const _BLEND = 0.6;
  const plane = {
    mode: 'rest' as 'rest' | 'forth' | 'back' | 'throw',
    route: 'back' as 'back' | 'around',
    clock: 0,
    p: 0,
    blend: 0,
  };
  const caught = {
    position: new Vector3(),
    quaternion: new Quaternion(),
    unfold: 0,
  };

  const _incoming = () =>
    (Object.keys(rig.actors) as Actor[]).some(
      (actor) => actor !== 'plane' && rig.actors[actor] > 0
    );

  const _catch = () => (
    caught.position.copy(group.position),
    caught.quaternion.copy(group.quaternion),
    (caught.unfold = planeFold.unfold),
    (plane.blend = 1)
  );

  const _planePose = (p: number, thrown: number, delta: number): PlanePose =>
    thrown >= 0
      ? ((plane.mode = 'throw'), flight!.throwing(thrown * THROW.seconds))
      : (void (
          plane.mode === 'throw' &&
          (p > 0 ? (_catch(), (plane.mode = 'forth')) : (plane.mode = 'rest'))
        ),
        void (p > plane.p && plane.mode !== 'forth'
          ? (plane.mode === 'back' && _catch(), (plane.mode = 'forth'))
          : p < plane.p &&
            plane.mode !== 'back' &&
            plane.p >= 0.999 &&
            ((plane.mode = 'back'),
            (plane.clock = 0),
            (plane.route = _incoming() ? 'around' : 'back'))),
        void (plane.mode === 'back' && (plane.clock += delta)),
        void (plane.mode === 'back' && plane.clock >= PLANE_SECONDS.back && (plane.mode = 'rest')),
        plane.mode === 'back'
          ? flight![plane.route](plane.clock)
          : flight!.forth(plane.mode === 'forth' ? carrySeconds(p) : 0));

  const _flyPlane = (delta: number) =>
    ((pose) => (
      group.position.copy(pose.position),
      group.quaternion.copy(pose.quaternion),
      (planeFold.unfold = pose.unfold),
      plane.blend > 0 &&
        ((plane.blend = Math.max(0, plane.blend - delta / _BLEND)),
        ((k) => (
          group.position.lerp(caught.position, k),
          group.quaternion.slerp(caught.quaternion, k),
          (planeFold.unfold += (caught.unfold - planeFold.unfold) * k)
        ))(plane.blend * plane.blend * (3 - 2 * plane.blend)))
    ))(_planePose(rig.actors.plane, rig.thrown, delta));

  let last = { p: Number.NaN, lift: Number.NaN, shift: Number.NaN };

  useTask(`actor-${name}`, (delta) => {
    const p = rig.actors[name];
    const lift = pileLift(name, rig.actors);
    const shift = pileShift(name, rig.actors);
    void (flight
      ? _flyPlane(delta)
      : (rest.position.set(ground.x + shift[0], ground.y + lift, ground.z + shift[2]),
        staged.position.fromArray(rig.stages[name].position),
        staged.quaternion.fromArray(rig.stages[name].quaternion),
        ((travel) => (
          carryPath(name as Carried, rest, staged, path),
          carryAt(name, rest.position, path, staged.position, travel, point),
          group.position.copy(point),
          group.quaternion.copy(rest.quaternion).slerp(staged.quaternion, carryTurn(name, travel)),
          group.position.sub(point.copy(face).applyQuaternion(group.quaternion))
        ))(carryTravel(name, p))));
    void (
      (p !== last.p ||
        lift !== last.lift ||
        shift[0] + shift[2] !== last.shift ||
        (flight !== null && (rig.thrown >= 0 || plane.mode === 'back' || plane.blend > 0))) &&
      (rig.shadowsDirty = true)
    );
    plane.p = p;
    last.p = p;
    last.lift = lift;
    last.shift = shift[0] + shift[2];
  });
</script>

<T is={group} name="actor-{name}">{@render children()}</T>
