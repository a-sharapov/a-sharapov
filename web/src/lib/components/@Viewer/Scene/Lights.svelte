<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import { Color, type DirectionalLight, FogExp2, type Texture } from 'three';
  import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
  import { uniform } from 'three/tsl';
  import { PMREMGenerator, type WebGPURenderer } from 'three/webgpu';
  import { GOBO, gustEnvelope, sharedGobo, swayAt } from './gobo';
  import { onFrame, WINDOWS } from './layout';
  import type { MixedMood } from './mood';
  import { pcssFilter } from './soft-shadows';
  import { WINDOW_LIGHT } from './volumetric';

  interface ILights {
    mood: MixedMood;
    shadows: boolean;
    intro: number;
  }

  let { mood, shadows, intro }: ILights = $props();

  const { scene, renderer, invalidate } = useThrelte();

  const gpu = renderer as unknown as WebGPURenderer;
  const gobo = sharedGobo();
  const gust = { at: 8 + Math.random() * 12, seconds: 4, clock: 0 };
  useTask('gobo-gust', (delta) =>
    ((t) =>
      void (gobo.sway.value.set(...swayAt(t, gustEnvelope(t, gust.at, gust.seconds))),
      t > gust.at + gust.seconds &&
        Object.assign(gust, {
          at: t + GOBO.gust.every[0] + Math.random() * (GOBO.gust.every[1] - GOBO.gust.every[0]),
          seconds:
            GOBO.gust.seconds[0] + Math.random() * (GOBO.gust.seconds[1] - GOBO.gust.seconds[0]),
        })))((gust.clock += delta))
  );
  const pmrem = new PMREMGenerator(gpu);
  let environment: Texture | null = null;
  const fog = new FogExp2(0xffffff, 0.005);
  scene.fog = fog;
  const backdrop = uniform(new Color());
  scene.backgroundNode = backdrop;
  void gpu.init().then(
    () =>
      void ((room) => (
        (environment = pmrem.fromScene(room, 0.04).texture),
        (scene.environment = environment),
        room.dispose(),
        pmrem.dispose()
      ))(new RoomEnvironment()),
    (error: unknown) => void console.error('Lights: окружение не запеклось', error)
  );

  const _WINDOWS = [
    {
      position: WINDOWS[0]!,
      share: 0.6,
      lightSize: 120,
      samples: 32,
      map: 2048,
    },
    {
      position: WINDOWS[1]!,
      share: 0.17,
      lightSize: 170,
      samples: 20,
      map: 1024,
    },
    {
      position: WINDOWS[2]!,
      share: 0.12,
      lightSize: 260,
      samples: 16,
      map: 1024,
    },
  ].map((window, i) => ({
    ...window,
    filter: pcssFilter({ ...window, gobo: i === 0 ? gobo.node : undefined }),
  }));

  const _DUSK_DIP = 0.4;

  $effect(() => {
    gobo.strength.value = intro;
  });

  $effect(() => {
    backdrop.value.copy(mood.colors.background);
    fog.color.copy(mood.colors.background);
    fog.density = mood.fogDensity;
    scene.environmentIntensity = mood.environment;
    invalidate();
  });

  const bindTarget = (light: DirectionalLight) => {
    light.target.position.set(0, 0, 0);
    scene.add(light.target);
    return () => void scene.remove(light.target);
  };

  onDestroy(() => {
    scene.environment = null;
    scene.backgroundNode = null;
    scene.fog = null;
    environment?.dispose();
  });
</script>

<T.HemisphereLight
  args={['#ffffff', '#000000', 1]}
  color={mood.colors.hemisphereSky}
  groundColor={mood.colors.hemisphereGround}
  intensity={mood.hemisphere}
/>

<T.PointLight
  position={onFrame(-16, 34, 22)}
  color={mood.colors.lamp}
  intensity={520 * mood.fill}
  decay={2}
  distance={0}
/>

{#each _WINDOWS as window, i (i)}
  <T.DirectionalLight
    name={i === 0 ? WINDOW_LIGHT : undefined}
    position={[window.position[0], window.position[1] * (1 - _DUSK_DIP * mood.dusk), window.position[2]]}
    color={mood.colors.sun}
    intensity={mood.sun * window.share}
    castShadow={shadows}
    shadow.mapSize={[window.map, window.map]}
    shadow.filterNode={window.filter}
    shadow.bias={-0.0004}
    shadow.normalBias={0.03}
    shadow.camera.left={-60}
    shadow.camera.right={60}
    shadow.camera.top={60}
    shadow.camera.bottom={-60}
    shadow.camera.near={10}
    shadow.camera.far={260}
    oncreate={bindTarget}
  />
{/each}
