<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import type { SpotLight } from 'three';
  import type { MixedMood } from './mood';
  import { ACTORS, type Actor, rig } from './state.svelte';

  interface IReadingLight {
    mood: MixedMood;
  }

  let { mood }: IReadingLight = $props();

  let light = $state.raw<SpotLight>();

  const _POWER = 3400;
  const _COLOR = '#ffdcbc';
  const _SHARE: Partial<Record<Actor, number>> = { tablet: 0 };

  useTask('reading-light', () =>
    ((presented) =>
      void (
        light &&
        rig.pose &&
        (Object.assign(light, {
          intensity: _POWER * (_SHARE[presented] ?? 1) * mood.reading * rig.actors[presented] ** 2,
        }),
        light.position.set(...rig.pose.position),
        light.target.position.set(...rig.stages[presented].position),
        light.target.updateMatrixWorld(),
        (light.angle =
          Math.atan(
            Math.hypot(...rig.stages[presented].face) /
              2 /
              Math.max(1, light.position.distanceTo(light.target.position))
          ) * 1.15))
      ))(ACTORS.reduce((best, actor) => (rig.actors[actor] > rig.actors[best] ? actor : best)))
  );
</script>

<T.SpotLight
  bind:ref={light}
  color={_COLOR}
  intensity={0}
  penumbra={0.5}
  decay={2}
  distance={0}
  oncreate={(spot) => void spot.parent?.add(spot.target)}
/>
